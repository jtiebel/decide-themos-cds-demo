import { logToConsole } from "./utilities.js";

// Funktion zum Laden von JSON-Daten
export async function loadJSON(url) {
  try {
    const res = await fetch(url);
    // Erstelle einen anklickbaren Link zur Quelle
    const link = `<a href="${url}" target="_blank">${url}</a>`;
    
    // Logge die Meta-Antwort (kleines Objekt mit Status, ok etc.) – hier möchten wir diese Details sehen
    logToConsole(
      "FHIR Bundle Response",
      { resourceType: "Bundle", status: res.status, ok: res.ok },
    );
    
    if (!res.ok) throw new Error(`HTTP-Fehler: ${res.status}`);
    
    const json = await res.json();
    // Logge den geladenen Inhalt NICHT – also die Details des Bundles unterdrücken
    logToConsole(
      "FHIR Bundle Loaded",
      { resourceType: json.resourceType, type: json.type },
      { source: link, hideData: true }
    );
    
    return json;
  } catch (error) {
    logToConsole("Fehler beim Laden der JSON-Daten", { error: error.message });
    throw error;
  }
}
