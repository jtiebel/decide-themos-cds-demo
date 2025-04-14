import { logToConsole } from "./utilities.js";

/**
 * Evaluates whether the trigger for setting a therapy goal should be activated.
 *
 * Ablauf:
 * 1. Durchläuft alle Einträge im übergebenen Patienten-Bundle (FHIR-Bundle mit Patientendaten).
 * 2. Untersucht Condition-Ressourcen:
 *    - Sucht nach einem Schlaganfall (ICD-10 Code 'I63').
 *    - Sucht nach einer abnormalen Gehweise (SNOMED Code '22325002').
 * 3. Untersucht ServiceRequest-Ressourcen:
 *    - Prüft, ob ein ServiceRequest mit SNOMED Code '74914000' vorliegt.
 * 4. Protokolliert das Ergebnis der Überprüfung.
 * 5. Gibt TRUE zurück, wenn alle drei Bedingungen erfüllt sind – ansonsten FALSE.
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

  logToConsole("Evaluierung Goalset", { hasStroke, hasAbnormalGait, hasGaitServiceRequest });
  return hasStroke && hasAbnormalGait && hasGaitServiceRequest;
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
