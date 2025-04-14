// File: src/main.js
import { loadJSON } from "./api.js";
import { evaluateTriggerGoalset, evaluateTriggerGuidelineRecommendation } from "./fhirEvaluators.js";
import * as UI from "./ui.js";
import { logToConsole } from "./utilities.js";

// Hauptklasse, welche die App-Logik und die UI-Interaktionen bündelt
class TherapyPlanApp {
  constructor() {
    this.apiEndpoints = {
      patient: "https://raw.githubusercontent.com/jtiebel/DECIDE/main/patient-example.json",
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
  }

  init() {
    this.bindEvents();
    this.loadPatientData();
    window.addEventListener("resize", () => this.checkScreenSize());
    window.addEventListener("load", () => this.checkScreenSize());
  }

  bindEvents() {
    document.getElementById("btn-open-goal-modal").addEventListener("click", async () => {
      // Beispiel: Trigger-Bedingungen prüfen (aus dem Bundle extrahieren)
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

    document.getElementById("modal-rehaziel").addEventListener("change", function () {
      document.getElementById("modal-ziel-description").value =
        this.options[this.selectedIndex].getAttribute("data-description") || "";
    });

    document.getElementById("modal-btn-accept-goal").addEventListener("click", () => this.handleModalGoalAccept());

    document.getElementById("btn-complete-planning").addEventListener("click", () => this.handlePlanComplete());
  }

  async loadPatientData() {
    try {
      this.bundle = await loadJSON(this.apiEndpoints.patient);
      // Patienteninformationen aktualisieren
      const patient = this.bundle.entry.find(e => e.resource.resourceType === "Patient")?.resource;
      UI.updatePatientInfo(patient);

      // Aktualisiere weitere UI-Bereiche
      const getResources = type => this.bundle.entry.filter(e => e.resource.resourceType === type).map(e => e.resource);
      const conditions = getResources("Condition");
      const observations = getResources("Observation");
      const serviceRequests = getResources("ServiceRequest");

      conditions.forEach((cond, i) => logToConsole(`Condition Resource ${i + 1}`, cond));
      observations.forEach((obs, i) => logToConsole(`Observation Resource ${i + 1}`, obs));
      serviceRequests.forEach((sr, i) => logToConsole(`ServiceRequest Resource ${i + 1}`, sr));

      // Beispiel: Aktualisiere Condition-Informationen
      const conditionStroke = this.bundle.entry.find(
        e => e.resource.resourceType === "Condition" && e.resource.id === "condition-stroke"
      )?.resource;
      const conditionAbnormalGait = this.bundle.entry.find(
        e => e.resource.resourceType === "Condition" && e.resource.id === "condition-abnormal-gait"
      )?.resource;
      UI.updateConditions(conditionStroke, "diagnosis-stroke-info");
      UI.updateConditions(conditionAbnormalGait, "diagnosis-abnormal-gait-info");
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
    // Hier würde ein Modal zur Anzeige der Leitlinienempfehlungen geöffnet
    // Beispielhafter Ablauf:
    this.runGuidelineCheck(this.currentGoal.target[0].measure.coding[0].code)
      .then(() => {
        // Empfehlungen anzeigen, etc.
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
        // Extrahiere Recommendations anhand deines targetCode
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

  handlePlanComplete() {
    document.querySelectorAll("#goal-summary button").forEach(btn => btn.style.display = "none");
    document.getElementById("btn-open-goal-modal").style.display = "none";
    document.getElementById("btn-complete-planning").style.display = "none";
    const goalsInfoEl = document.getElementById("goal-summary");
    goalsInfoEl.textContent = "Planung abgeschlossen";
    goalsInfoEl.style.color = "green";

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
