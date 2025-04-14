import { logToConsole } from "./utilities.js";

// Funktion zum Laden von JSON-Daten
export async function loadJSON(url) {
  try {
    const res = await fetch(url);
    // Erstelle einen anklickbaren Link zur Quelle
    const link = `<a href="${url}" target="_blank">${url}</a>`;
    // Logge FHIR Bundle Response inklusive URL
    logToConsole("FHIR Bundle Response", { resourceType: "Bundle", status: res.status, ok: res.ok, source: link });
    if (!res.ok) throw new Error(`HTTP-Fehler: ${res.status}`);
    const json = await res.json();
    logToConsole("FHIR Bundle Loaded", json);
    return json;
  } catch (error) {
    logToConsole("Fehler beim Laden der JSON-Daten", { error: error.message });
    throw error;
  }
}
