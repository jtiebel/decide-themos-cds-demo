import { logToConsole } from "./utilities.js";

// UI-Funktion: Aktualisiert die Patienteninformationen im DOM
export function updatePatientInfo(patient) {
  document.getElementById('patient-info').innerHTML = `
    <p><strong>Name:</strong> ${patient.name[0].given[0]} ${patient.name[0].family}</p>
    <p><strong>Geburtsdatum:</strong> ${patient.birthDate}</p>
    <p><strong>Geschlecht:</strong> ${patient.gender === 'female' ? 'weiblich' : patient.gender}</p>
  `;
}

// Aktualisiert UI-Bereiche für Conditions (allgemein)
export function updateConditions(condition, elementId) {
  if (condition) {
    const { code: { coding: [coding] } } = condition;
    document.getElementById(elementId).innerHTML = `<p><strong>Diagnose:</strong> ${coding.code} – ${coding.display}</p>`;
  }
}

// Spezielle UI-Funktion für "diagnosis-abnormal-gait-info"
// Hier wird der klinische Befund aus der Patient Example übernommen (22325002 – Abnormal gait).
export function updateAbnormalGaitInfo(condition) {
  if (condition) {
    const { code: { coding: [coding] } } = condition;
    document.getElementById('diagnosis-abnormal-gait-info').innerHTML = `
      <p>
        <strong>Klinischer Befund:</strong> ${coding.code} – ${coding.display} 
        (<a href="https://browser.ihtsdotools.org/?perspective=full&amp;conceptId1=${coding.code}&amp;edition=MAIN/2025-04-01&amp;release=&amp;languages=en" target="_blank">
          ${coding.code} ${coding.display}
        </a>)
      </p>
    `;
  }
}

// Aktualisiert UI-Bereiche für Observations
export function updateObservations(observations) {
  if (!observations || observations.length === 0) return;
  const obsHtml = observations.map(obs => {
    const { coding: [coding] } = obs.code;
    const value = obs.valueInteger ?? (obs.valueString || 'kein Wert');
    return `<p><strong>${coding.display}:</strong> ${value}</p>`;
  }).join('');
  document.getElementById('observations-info').innerHTML = `<div>${obsHtml}</div>`;
}

// Aktualisiert UI-Bereiche für Service Requests
export function updateServiceRequests(serviceRequests) {
  if (!serviceRequests || serviceRequests.length === 0) return;
  let srHtml = "";
  serviceRequests.forEach(sr => {
    const { coding: [coding] } = sr.code;
    const url = `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${coding.code}&edition=MAIN/2025-04-01&release=&languages=en`;
    if (sr.id === "servicerequest-physiotherapy-training") {
      srHtml += `<p><span>Physiotherapie Training</span> ${coding.display} (<a href="${url}" target="_blank">${coding.code} ${coding.display}</a>)</p>`;
    } else if (sr.id === "servicerequest-ambulation-training") {
      srHtml += `<p><span>└─</span> Mobilitätstraining (<a href="${url}" target="_blank">${coding.code} ${coding.display}</a>)</p>`;
    } else if (sr.id === "servicerequest-gait-training" || sr.id === "servicerequest-gait-reeducation") {
      srHtml += `<p><span style="margin-left:25px">└─</span> Gangtraining (<a href="${url}" target="_blank">${coding.code} ${coding.display}</a>)</p>`;
    }
  });
  document.getElementById('service-requests-info').innerHTML = srHtml;
}
