import { logToConsole } from "./utilities.js";

// Funktion zum Laden von JSON-Daten
export async function loadJSON(url) {
  try {
    const res = await fetch(url);
    // Logge FHIR Bundle Response mit Status und ok-Flag vor der Umwandlung in JSON
    logToConsole("FHIR Bundle Response", { resourceType: "Bundle", status: res.status, ok: res.ok });
    if (!res.ok) throw new Error(`HTTP-Fehler: ${res.status}`);
    const json = await res.json();
    logToConsole("JSON geladen", json);
    return json;
  } catch (error) {
    logToConsole("Fehler beim Laden der JSON-Daten", { error: error.message });
    throw error;
  }
}
