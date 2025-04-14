import { loadJSON } from "./api.js";
import { evaluateTriggerGoalset, evaluateTriggerGuidelineRecommendation } from "./fhirEvaluators.js";
import * as UI from "./ui.js";
import { logToConsole } from "./utilities.js";

// Hauptklasse, welche die App-Logik und die UI-Interaktionen bündelt
class TherapyPlanApp {
  constructor() {
    this.apiEndpoints = {
      patient: "https://raw.githubusercontent.com/jtiebel/decide-themos-cds-demo/resources/patient-example.json",
      goalsetExample: "https://raw.githubusercontent.com/jtiebel/DECIDE/main/goalset-cds-example.json",
      recommendationExample: "https://raw.githubusercontent.com/jtiebel/DECIDE/main/recommendation-cds-example.json"
    };
    this.currentRecommendation = null;
    this.currentGoal = null;
    this.addedGoals = [];
    this.goalProcedures = [];
    this.bundle = null;
    this.guidelineRecs = [];
    // Referenzen auf modale Elemente (Bootstrap) werden später initialisiert
    this.goalSettingModal = new bootstrap.Modal(document.getElementById("goalSettingModal"));
    this.guidelineModal = new bootstrap.Modal(document.getElementById("guidelineModal"));
  }

  init() {
    this.bindEvents();
    this.loadPatientData();
    window.addEventListener("resize", () => this.checkScreenSize());
    window.addEventListener("load", () => this.checkScreenSize());
  }

  bindEvents() {
    // Event: Öffne das Goalset Modal und prüfe Trigger-Bedingungen
    document.getElementById("btn-open-goal-modal").addEventListener("click", async () => {
      const patientBundle = this.bundle;
      const conditionStroke = patientBundle.entry.find(
        e => e.resource.resourceType === "Condition" && e.resource.id === "condition-stroke"
      )?.resource;
      const conditionAbnormalGait = patientBundle.entry.find(
        e => e.resource.resourceType === "Condition" && e.resource.id === "condition-abnormal-gait"
      )?.resource;
      const serviceRequestGait = patientBundle.entry.find(
        e => e.resource.resourceType === "ServiceRequest" &&
          e.resource.code.coding.some(
            c => c.system === "http://snomed.info/sct" && c.code === "74914000"
          )
      )?.resource;

      if (conditionStroke && conditionAbnormalGait && serviceRequestGait) {
        logToConsole("FHIR CDS Hook Trigger (Goalset)", {
          trigger: {
            conditionStroke: conditionStroke.code.coding[0],
            // Hier wird der Zustand zwar geprüft, aber im UI wird nun immer der Physiotherapie-Link verwendet.
            conditionAbnormalGait: conditionAbnormalGait.code.coding[0],
            serviceRequestGait: serviceRequestGait.code.coding[0]
          },
          message: "Alle erforderlichen Trigger-Bedingungen erfüllt."
        });
        const dynamicGoalset = await this.evaluateGoalsetHook(patientBundle);
        if (dynamicGoalset) {
          const selectEl = document.getElementById("modal-rehaziel");
          selectEl.innerHTML = `<option value="">Bitte Zielsetzung wählen:</option>`;
          dynamicGoalset.entry.forEach(entry => {
            const goal = entry.resource;
            if (goal.resourceType === "Goal") {
              // data-name erhält coding.display, data-display erhält description.text.
              const coding = goal.description && goal.description.coding && goal.description.coding[0];
              const noteText = goal.note && goal.note[0] ? goal.note[0].text : "";
              if (coding) {
                selectEl.innerHTML += `
                  <option value="${coding.code}" 
                          data-description="${noteText}" 
                          data-name="${coding.display}" 
                          data-display="${goal.description.text}" 
                          data-url="Condition/condition-abnormal-gait">
                    ${goal.description.text} (${coding.code})
                  </option>`;
              }
            }
          });
        }
      } else {
        logToConsole("FHIR CDS Hook Trigger (Goalset) fehlgeschlagen", {
          message: "Nicht alle erforderlichen Trigger-Bedingungen sind erfüllt."
        });
      }
      this.goalSettingModal.show();
    });

    // Event: Aktualisiere Zielformulierung beim Ändern der Auswahl
    document.getElementById("modal-rehaziel").addEventListener("change", function () {
      document.getElementById("modal-ziel-description").value =
        this.options[this.selectedIndex].getAttribute("data-description") || "";
    });

    // Event: Übernehme das im Modal erstellte Ziel
    document.getElementById("modal-btn-accept-goal").addEventListener("click", () => this.handleModalGoalAccept());

    // Event: Absenden des Guideline-Formulars
    document.getElementById("guidelineForm").addEventListener("submit", e => {
      e.preventDefault();
      this.handleGuidelineFormSubmit();
    });

    // Event: Abschluss der Planung
    document.getElementById("btn-complete-planning").addEventListener("click", () => this.handlePlanComplete());
  }

  async loadPatientData() {
    try {
      this.bundle = await loadJSON(this.apiEndpoints.patient);
      // Patienteninformationen aktualisieren
      const patient = this.bundle.entry.find(e => e.resource.resourceType === "Patient")?.resource;
      UI.updatePatientInfo(patient);

      // Weitere Ressourcen extrahieren und in die Konsole loggen
      const getResources = type => this.bundle.entry.filter(e => e.resource.resourceType === type).map(e => e.resource);
      const conditions = getResources("Condition");
      const observations = getResources("Observation");
      const serviceRequests = getResources("ServiceRequest");

      conditions.forEach((cond, i) => logToConsole(`Condition Resource ${i + 1}`, cond));
      observations.forEach((obs, i) => logToConsole(`Observation Resource ${i + 1}`, obs));
      serviceRequests.forEach((sr, i) => logToConsole(`ServiceRequest Resource ${i + 1}`, sr));

      // UI: Conditions aktualisieren
      const conditionStroke = this.bundle.entry.find(
        e => e.resource.resourceType === "Condition" && e.resource.id === "condition-stroke"
      )?.resource;
      const conditionAbnormalGait = this.bundle.entry.find(
        e => e.resource.resourceType === "Condition" && e.resource.id === "condition-abnormal-gait"
      )?.resource;
      UI.updateConditions(conditionStroke, "diagnosis-stroke-info");
      // Anstelle der Standardanzeige wird hier der physiotherapie-spezifische Link angezeigt.
      UI.updateAbnormalGaitInfo(conditionAbnormalGait);
      UI.updateObservations(observations);
      UI.updateServiceRequests(serviceRequests);

    } catch (err) {
      logToConsole("FHIR Error", {
        resourceType: "OperationOutcome",
        issue: [{ severity: "error", code: "exception", details: { text: err.message } }]
      });
      alert("Fehler beim Laden der Patientendaten.");
    }
  }

  async evaluateGoalsetHook(patientBundle) {
    try {
      const triggerResult = evaluateTriggerGoalset(patientBundle);
      logToConsole("Ergebnis Goalset Evaluation", { triggerResult });
      if (triggerResult) {
        const exRes = await loadJSON(this.apiEndpoints.goalsetExample);
        logToConsole("Goalset Example Loaded", exRes, { cdsLibrary: "GoalsetCDSHook", version: "1.0.0" });
        return exRes;
      } else {
        logToConsole("Goalset Evaluation", "Kein Trigger – Goalset Example wird nicht geladen.");
        return null;
      }
    } catch (error) {
      logToConsole("evaluateGoalsetHook Error", { error: error.message });
      return null;
    }
  }

  handleModalGoalAccept() {
    const selectEl = document.getElementById("modal-rehaziel");
    const selected = selectEl.options[selectEl.selectedIndex];
    const code = selected.value;
    const name = selected.getAttribute("data-name");
    const description = selected.getAttribute("data-description");
    const display = selected.getAttribute("data-display");
    const url = selected.getAttribute("data-url");

    if (code && name && description && display && url) {
      const zielFormulierung = document.getElementById("modal-ziel-description").value;
      const newGoal = {
        resourceType: "Goal",
        id: `goal-${Date.now()}`,
        lifecycleStatus: "proposed",
        achievementStatus: {
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/goal-achievement",
            code: "in-progress",
            display: "In Progress"
          }]
        },
        description: { text: zielFormulierung },
        subject: { reference: "urn:uuid:patient-example" },
        target: [{
          measure: {
            coding: [{
              system: "http://snomed.info/sct",
              code,
              display
            }]
          }
        }],
        measureName: name
      };
      logToConsole("Goal Resource (Entwurf)", newGoal);
      this.addedGoals.push(newGoal);
      this.renderGoalList();
      this.goalSettingModal.hide();
      new bootstrap.Toast(document.getElementById("goalToast")).show();
    }
  }

  renderGoalList() {
    const container = document.getElementById("goal-summary");
    container.innerHTML = this.addedGoals.map((goal, index) => {
      const { code, display } = goal.target[0].measure.coding[0];
      const goalUrl = `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${code}&edition=MAIN/2025-04-01&release=&languages=en`;
      const interventionHtml = goal.intervention
        ? `<p><strong>Intervention:</strong> ${goal.intervention.heading}</p>
           <p><strong>Einheiten pro Woche:</strong> ${goal.intervention.frequency}</p>
           <p><strong>Minuten pro Einheit:</strong> ${goal.intervention.duration}</p>`
        : `<button type="button" class="btn btn-warning btn-plan-therapy" data-index="${index}">Clinical Reasoning starten</button>`;
      return `<div class="mb-3">
                <p><strong>Zielkriterium:</strong> ${display} (<a href="${goalUrl}" target="_blank">${code} ${goal.measureName}</a>)</p>
                <p><strong>Zielformulierung:</strong> ${goal.description.text}</p>
                ${interventionHtml}
                <hr>
              </div>`;
    }).join('');
    if (this.addedGoals.length) {
      document.getElementById("btn-complete-planning").classList.remove("d-none");
    }
    document.querySelectorAll(".btn-plan-therapy").forEach(btn =>
      btn.addEventListener("click", e => this.handlePlanTherapy(e.currentTarget.getAttribute("data-index")))
    );
  }

  handlePlanTherapy(goalIndex) {
    this.currentGoal = this.addedGoals[goalIndex];
    logToConsole("FHIR CDS Hook triggered", {
      target: this.currentGoal.target[0].measure.coding[0],
      user: { role: "Therapist", name: "Therapeut XY" },
      message: "Abfrage der Leitlinie erfolgt."
    });
    this.runGuidelineCheck(this.currentGoal.target[0].measure.coding[0].code)
      .then(() => {
        // Anzeigen der Empfehlungen im Guideline-Modal
        document.getElementById("modalRecommendationsContainer").classList.remove("d-none");
        document.getElementById("modalPlanForm").classList.add("d-none");
        document.getElementById("btnConfirmGuideline").disabled = true;
        this.displayRecommendationsRadioCards(this.guidelineRecs);
        this.guidelineModal.show();
      })
      .catch(err => console.error("Fehler beim Laden der Leitlinienempfehlungen", err));
  }

  async runGuidelineCheck(code) {
    try {
      // Kombiniere Patientendaten und hinzugefügte Goals
      const combinedBundle = {
        entry: [
          ...this.bundle.entry,
          ...this.addedGoals.map(goal => ({ resource: goal }))
        ]
      };
      logToConsole("Combined Bundle for Recommendation Evaluation", combinedBundle, { info: "Patientdaten plus Ziele" });
      const triggerResult = evaluateTriggerGuidelineRecommendation(combinedBundle, code);
      logToConsole("Recommendation Trigger Evaluation", { code, triggerResult });
      if (triggerResult) {
        const recommendationData = await loadJSON(this.apiEndpoints.recommendationExample);
        logToConsole("Recommendation Example Loaded", recommendationData, { cdsLibrary: "RecommendationCDSHook", version: "1.0.0" });
        const extractedRecs = this.extractRecommendations(recommendationData, code);
        this.guidelineRecs = extractedRecs;
        return this.guidelineRecs;
      } else {
        logToConsole("Recommendation Evaluation", "Kein Trigger – Recommendation Example wird nicht geladen.");
        return [];
      }
    } catch (err) {
      logToConsole("runGuidelineCheck Error", { error: err.message });
      throw err;
    }
  }

  extractRecommendations(recommendationData, targetCode) {
    let recs = [];
    if (recommendationData.sections) {
      recommendationData.sections.forEach(section => {
        if (section.subSections) {
          section.subSections.forEach(sub => {
            if (sub.recommendations) {
              sub.recommendations.forEach(rec => {
                if (rec.interventions && rec.interventions.codes && rec.interventions.codes.some(c => c.code === targetCode)) {
                  recs.push(rec);
                }
              });
            }
          });
        }
      });
    }
    logToConsole("Extracted Recommendations", recs);
    return recs;
  }

  displayRecommendationsRadioCards(recommendations) {
    const container = document.getElementById("modalRecommendationsContainer");
    container.innerHTML = `
      <div class="mb-2 text-info">
        Über das integrierte Clinical Decision Support System (CDSS) wurden <strong>${recommendations.length}</strong> Interventionen für das gewählte Ziel gefunden.
      </div>
      ${recommendations.map((rec, idx) => {
        const strengthUpper = rec.strength.toUpperCase();
        const strengthMap = {
          "STRONG": { text: "Starke Empfehlung", badge: "bg-success" },
          "WEAK": { text: "Schwache Empfehlung", badge: "bg-warning" },
          "WEAKAGAINST": { text: "Schwache Empfehlung gegen", badge: "bg-danger" },
          "WEAK AGAINST": { text: "Schwache Empfehlung gegen", badge: "bg-danger" }
        };
        const { text: strengthText, badge: badgeClass } = strengthMap[strengthUpper] || { text: rec.strength, badge: "bg-secondary" };
        const badgeHtml = `<span class="badge ${badgeClass}" style="font-size:0.8rem; margin-left:10px;">${strengthText}</span>`;
        return `
          <div class="card mb-2" data-index="${idx}" style="cursor: pointer;">
            <div class="card-body">
              <h6><b>${rec.heading}${badgeHtml}</b></h6>
              <p style="font-size:.9rem;color: grey">${rec.text}</p>
            </div>
          </div>
        `;
      }).join('')}
    `;
    container.querySelectorAll('.card').forEach(card => {
      card.addEventListener("click", () => {
        container.querySelectorAll('.card').forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        const index = card.getAttribute("data-index");
        this.currentRecommendation = recommendations[index];
        const fhirIntervention = {
          resourceType: "PlanDefinition",
          id: `plandef-${this.currentRecommendation.recommendationId}`,
          title: this.currentRecommendation.heading,
          description: this.currentRecommendation.text,
          strength: this.currentRecommendation.strength,
          status: "active",
          code: {
            coding: [{
              system: "http://myCDSS.com/recommendations",
              code: `${this.currentRecommendation.guidelineId}-${this.currentRecommendation.recommendationId}`,
              display: this.currentRecommendation.heading
            }]
          },
          action: [{
            title: this.currentRecommendation.interventions.codes[0].name,
            code: "NA",
            description: this.currentRecommendation.interventions.codes[0].description,
            ontology: "SNOMED",
            type: this.currentRecommendation.interventions.codes[0].type
          }]
        };
        logToConsole("Intervention ausgewählt (FHIR-Format)", fhirIntervention);
        document.getElementById("modalPlanForm").classList.remove("d-none");
        document.getElementById("btnConfirmGuideline").disabled = false;
      });
    });
  }

  handleGuidelineFormSubmit() {
    if (!this.currentRecommendation) {
      logToConsole("Fehler", { message: "Es wurde keine Intervention ausgewählt." });
      return;
    }
    const freq = document.getElementById("freqInputModal").value || "2";
    const dur = document.getElementById("durInputModal").value || "30";
    this.currentGoal.intervention = {
      heading: this.currentRecommendation.heading,
      frequency: freq,
      duration: dur
    };
    const proc = this.createProcedure(freq, dur);
    this.goalProcedures.push({ goalId: this.currentGoal.id, procedure: proc });
    this.renderGoalList();
    this.guidelineModal.hide();
    new bootstrap.Toast(document.getElementById("interventionToast")).show();
  }

  createProcedure(freq, dur) {
    if (!this.currentRecommendation) {
      logToConsole("Procedure Error", { message: "Es wurde keine Intervention ausgewählt." });
      return;
    }
    const proc = {
      resourceType: "Procedure",
      id: `procedure-${Date.now()}`,
      status: "preparation",
      subject: { reference: "urn:uuid:patient-example" },
      code: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "NA",
          display: "NA"
        }]
      },
      note: [{
        text: `${this.currentRecommendation.heading} – ${this.currentRecommendation.text}`
      }],
      performedPeriod: { start: new Date().toISOString() },
      occurrenceTiming: {
        repeat: {
          frequency: parseInt(freq, 10),
          period: 1,
          periodUnit: "wk",
          duration: parseInt(dur, 10),
          durationUnit: "min"
        }
      },
      reasonReference: [{ reference: `Goal/${this.currentGoal.id}` }]
    };
    logToConsole("Procedure (Therapieplanung)", proc);
    return proc;
  }

  handlePlanComplete() {
    // Blende nur die Steuerungen aus (Buttons), der Bereich mit den Zielen bleibt erhalten
    document.getElementById("btn-open-goal-modal").style.display = "none";
    document.getElementById("btn-complete-planning").style.display = "none";
    // Aktualisiere den Status im oberen Bereich (im Header), statt den gesamten Inhalt zu ersetzen
    const statusEl = document.getElementById("goals-info");
    statusEl.textContent = "Planung abgeschlossen";
    statusEl.style.color = "green";

    const extraProcedure = {
      resourceType: "Procedure",
      id: "procedure-74914000",
      status: "preparation",
      subject: { reference: "urn:uuid:patient-example" },
      code: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "74914000",
          display: "Gait re-education"
        }]
      }
    };

    const carePlan = {
      resourceType: "CarePlan",
      id: `careplan-${Date.now()}`,
      status: "active",
      intent: "plan",
      subject: { reference: "urn:uuid:patient-example" },
      goal: this.addedGoals.map(goal => ({ reference: `Goal/${goal.id}` })),
      activity: this.goalProcedures.map(item => ({ detail: item.procedure }))
        .concat([{ detail: extraProcedure }])
    };

    logToConsole("FHIR CarePlan", carePlan);
    new bootstrap.Toast(document.getElementById("completePlanningToast")).show();
  }

  checkScreenSize() {
    const minWidth = 800, minHeight = 600;
    document.getElementById("screen-warning").style.display =
      (window.innerWidth < minWidth || window.innerHeight < minHeight) ? "flex" : "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new TherapyPlanApp();
  app.init();
});
