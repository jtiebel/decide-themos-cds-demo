import { logToConsole } from "./utilities.js";

/**
 * Evaluates whether the trigger for setting a therapy goal should be activated.
 *
 * Ablauf:
 * 1. Durchläuft alle Einträge im übergebenen Patienten-Bundle (FHIR-Bundle mit Patientendaten).
 * 2. Untersucht Condition-Ressourcen:
 *    - Sucht nach einem Schlaganfall (ICD-10 Code 'I63.3').
 *    - Sucht nach einer abnormalen Gehweise (SNOMED Code '22325002').
 * 3. Untersucht ServiceRequest-Ressourcen:
 *    - Prüft, ob ein ServiceRequest mit SNOMED Code '74914000' vorliegt.
 * 4. Protokolliert das Ergebnis der Überprüfung.
 * 5. Gibt TRUE zurück, wenn alle drei Bedingungen erfüllt sind – ansonsten FALSE.
 *
 * Zusätzlich wird pseudomäßig die CDS Hook Library ausgegeben, um den Aufruf des CDS Hooks zu simulieren.
 *
 * @param {Object} patientBundle - FHIR-Bundle mit Patientendaten.
 * @returns {boolean} - TRUE, wenn die Voraussetzungen erfüllt sind; sonst FALSE.
 */
export function evaluateTriggerGoalset(patientBundle) {
  let hasStroke = false;
  let hasAbnormalGait = false;
  let hasGaitServiceRequest = false;

  patientBundle.entry.forEach(entry => {
    const { resource } = entry;
    
    if (resource.resourceType === "Condition" && resource.code?.coding) {
      resource.code.coding.forEach(coding => {
        // Hinweis: Hier wurde der ICD-10 Code 'I63.3' verwendet; passe diesen bei Bedarf an.
        if (coding.system === 'http://hl7.org/fhir/sid/icd-10' && coding.code === 'I63.3') {
          hasStroke = true;
        }
        if (coding.system === 'http://snomed.info/sct' && coding.code === '22325002') {
          hasAbnormalGait = true;
        }
      });
    }
    
    if (resource.resourceType === "ServiceRequest" && resource.code?.coding) {
      resource.code.coding.forEach(coding => {
        if (coding.system === 'http://snomed.info/sct' && coding.code === '74914000') {
          hasGaitServiceRequest = true;
        }
      });
    }
  });

  // Logge die Evaluation der Triggerbedingungen:
  logToConsole("Evaluierung Goalset", { hasStroke, hasAbnormalGait, hasGaitServiceRequest });
  const triggerResult = hasStroke && hasAbnormalGait && hasGaitServiceRequest;

  // Pseudomäßiger Aufruf des CDS Hooks:
  // Erstelle eine statische FHIR Library Resource, die den CDS Hook repräsentiert.
  const cdsLibrary = {
    "resourceType": "Library",
    "id": "goalset-cds-hook-library",
    "url": "https://github.com/YourUser/YourRepo/goalset-cds-hook-library",
    "version": "1.0.0",
    "name": "GoalsetCDSHookLibrary",
    "title": "Goalset CDS Hook Library",
    "status": "active",
    "experimental": true,
    "description": "Library containing CDS Hook logic for triggering the goalset CDS action based on the fulfillment of three conditions: Stroke, Abnormal gait, and Gait re-education service request.",
    "purpose": "Checks if the patient has a Stroke (ICD‑10 I63.3), an Abnormal gait (SNOMED 22325002), and a Gait Re-education (SNOMED 74914000) ServiceRequest.",
    "type": {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/library-type",
          "code": "logic-library",
          "display": "Logic Library"
        }
      ]
    },
    "content": [
      {
        "contentType": "text/cql",
        "url": "https://raw.githubusercontent.com/YourUser/YourRepo/main/GoalsetCDSHook.cql",
        "title": "GoalsetCDSHook.cql"
      }
    ]
  };

  // Logge den pseudomäßigen Aufruf des CDS Hooks:
  logToConsole("Goalset CDS Hook Library", cdsLibrary);

  return triggerResult;
}

/**
 * Evaluates whether a guideline recommendation has already been integrated in the patient data.
 *
 * Ablauf:
 * 1. Durchläuft alle Einträge im kombinierten Bundle (Patientendaten + hinzugefügte Goals).
 * 2. Untersucht Goal-Ressourcen und deren target-Maß.
 * 3. Gibt TRUE zurück, wenn ein Ziel mit der entsprechenden Measure gefunden wurde.
 *
 * @param {Object} bundleForEval - Kombiniertes FHIR-Bundle.
 * @param {string} targetCode - Der SNOMED-Code, nach dem gesucht wird.
 * @returns {boolean} - TRUE, wenn ein entsprechendes Ziel existiert; sonst FALSE.
 */
export function evaluateTriggerGuidelineRecommendation(bundleForEval, targetCode) {
  let found = false;
  bundleForEval.entry.forEach(entry => {
    const { resource } = entry;
    
    if (resource.resourceType === "Goal" && Array.isArray(resource.target)) {
      resource.target.forEach(target => {
        if (target.measure && target.measure.coding) {
          target.measure.coding.forEach(coding => {
            if (coding.system === 'http://snomed.info/sct' && coding.code === targetCode) {
              found = true;
            }
          });
        }
      });
    }
  });

  logToConsole("Evaluierung Recommendation", { targetCode, found });
  return found;
}
