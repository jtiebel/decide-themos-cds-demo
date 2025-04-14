// File: src/fhirEvaluators.js

import { logToConsole } from './utilities.js';

/**
 * Evaluates whether the trigger for setting a therapy goal should be activated.
 *
 * Ablauf:
 * 1. Durchläuft alle Einträge im übergebenen Patienten-Bundle (FHIR-Bundle mit Patientendaten).
 * 2. Untersucht Condition-Ressourcen:
 *    - Sucht nach einem Schlaganfall (ICD-10 Code 'I63').
 *    - Sucht nach einer abnormalen Gehweise (SNOMED Code '22325002').
 * 3. Untersucht ServiceRequest-Ressourcen:
 *    - Prüft, ob ein ServiceRequest mit SNOMED Code '74914000' vorliegt, der
 *      vermutlich einen Bezug zu einer Gehtrainingstherapie hat.
 * 4. Protokolliert das Ergebnis der Überprüfung.
 * 5. Gibt TRUE zurück, wenn alle drei Bedingungen erfüllt sind – ansonsten FALSE.
 *
 * @param {Object} patientBundle - FHIR-Bundle mit Patientendaten.
 * @returns {boolean} - TRUE, wenn die Voraussetzungen (Schlaganfall, abnorme Gehweise, 
 *                      und zugehöriger ServiceRequest) erfüllt sind; andernfalls FALSE.
 */
export function evaluateTriggerGoalset(patientBundle) {
  // Initialisierung der Flags zur Erfassung der jeweiligen Bedingungen.
  let hasStroke = false;
  let hasAbnormalGait = false;
  let hasGaitServiceRequest = false;

  // Iteriere über alle Einträge im Patienten-Bundle.
  patientBundle.entry.forEach(entry => {
    const { resource } = entry;
    
    // Überprüfe, ob es sich um eine Condition-Ressource handelt und ob Codierungen vorhanden sind.
    if (resource.resourceType === "Condition" && resource.code?.coding) {
      resource.code.coding.forEach(coding => {
        // Bestimme, ob ein Schlaganfall (ICD-10 'I63') vorliegt.
        if (coding.system === 'http://hl7.org/fhir/sid/icd-10' && coding.code === 'I63') {
          hasStroke = true;
        }
        // Bestimme, ob eine abnormale Gehweise (SNOMED '22325002') vorliegt.
        if (coding.system === 'http://snomed.info/sct' && coding.code === '22325002') {
          hasAbnormalGait = true;
        }
      });
    }
    
    // Überprüfe, ob es sich um einen ServiceRequest mit zugehöriger Codierung handelt.
    if (resource.resourceType === "ServiceRequest" && resource.code?.coding) {
      resource.code.coding.forEach(coding => {
        // Ermittelt, ob eine Gehtraining-bezogene ServiceRequest (SNOMED '74914000') vorliegt.
        if (coding.system === 'http://snomed.info/sct' && coding.code === '74914000') {
          hasGaitServiceRequest = true;
        }
      });
    }
  });

  // Protokolliere das Ergebnis der Evaluierung.
  logToConsole("Evaluierung Goalset", { hasStroke, hasAbnormalGait, hasGaitServiceRequest });
  
  // Alle Bedingungen müssen erfüllt sein, damit der Trigger aktiviert wird.
  return hasStroke && hasAbnormalGait && hasGaitServiceRequest;
}


/**
 * Evaluates whether a guideline recommendation has already been integrated in the patient data.
 *
 * Ablauf:
 * 1. Durchläuft alle Einträge im kombinierten Bundle, das Patientendaten und 
 *    bereits hinzugefügte Therapieziele (Goal-Objekte) enthält.
 * 2. Untersucht jede Goal-Ressource:
 *    - Prüft, ob die Ressource Zielsetzungen (target) enthält.
 *    - Innerhalb der Zielsetzungen wird nach einer Measure gesucht, 
 *      deren Codierung mit dem vorgegebenen Zielcode (targetCode) übereinstimmt.
 * 3. Protokolliert das Ergebnis der Überprüfung.
 * 4. Gibt TRUE zurück, wenn ein Ziel mit der entsprechenden Measure gefunden wurde.
 *
 * @param {Object} bundleForEval - FHIR-Bundle, das Patientendaten und bestehende Ziele kombiniert.
 * @param {string} targetCode - Der SNOMED-Code, nach dem in der Goal-Ressource gesucht wird.
 * @returns {boolean} - TRUE, wenn ein entsprechendes Ziel bereits existiert; andernfalls FALSE.
 */
export function evaluateTriggerGuidelineRecommendation(bundleForEval, targetCode) {
  let found = false;

  // Durchlaufe alle Einträge im kombinierten Bundle.
  bundleForEval.entry.forEach(entry => {
    const { resource } = entry;
    
    // Verarbeite nur Goal-Ressourcen, die Zielsetzungen (target) enthalten.
    if (resource.resourceType === "Goal" && Array.isArray(resource.target)) {
      resource.target.forEach(target => {
        // Stelle sicher, dass eine Measure mit Codierungen vorhanden ist.
        if (target.measure && target.measure.coding) {
          target.measure.coding.forEach(coding => {
            // Vergleiche den SNOMED-Code der Measure mit dem vorgegebenen Zielcode.
            if (coding.system === 'http://snomed.info/sct' && coding.code === targetCode) {
              found = true;
            }
          });
        }
      });
    }
  });

  // Protokolliere das Ergebnis, um nachvollziehen zu können, ob und welcher Code gefunden wurde.
  logToConsole("Evaluierung Recommendation", { targetCode, found });
  
  return found;
}
