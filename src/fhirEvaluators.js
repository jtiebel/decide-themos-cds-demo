// File: src/fhirEvaluators.js
import { logToConsole } from './utilities.js';

// Evaluierung des Goalset-Triggers: Prüft, ob die notwendigen Bedingungen erfüllt sind.
export function evaluateTriggerGoalset(patientBundle) {
  let hasStroke = false;
  let hasAbnormalGait = false;
  let hasGaitServiceRequest = false;

  patientBundle.entry.forEach(entry => {
    const resource = entry.resource;
    if (resource.resourceType === "Condition" && resource.code?.coding) {
      resource.code.coding.forEach(coding => {
        if (coding.system === 'http://hl7.org/fhir/sid/icd-10' && coding.code === 'I63') {
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

// Evaluierung der Recommendation: Sucht in einem kombinierten Bundle (Patientendaten + hinzugefügte Goals)
// nach einem Goal mit dem gewünschten targetCode.
export function evaluateTriggerGuidelineRecommendation(bundleForEval, targetCode) {
  let found = false;
  bundleForEval.entry.forEach(entry => {
    const resource = entry.resource;
    if (resource.resourceType === "Goal" && resource.target && Array.isArray(resource.target)) {
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
