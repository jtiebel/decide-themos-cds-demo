import { logToConsole } from "./utilities.js";

// Funktion zum Laden von JSON-Daten
export async function loadJSON(url) {
  try {
    const res = await fetch(url);
    // Erstelle einen anklickbaren Link zur Quelle
    const link = `<a href="${url}" target="_blank">${url}</a>`;
    // Logge nur den Header mit URL und Status – keine vollständigen Daten
    logToConsole(
      "FHIR Bundle Response",
      { resourceType: "Bundle", status: res.status, ok: res.ok },
      { source: link, hideData: true }
    );
    if (!res.ok) throw new Error(`HTTP-Fehler: ${res.status}`);
    const json = await res.json();
    // Falls gewünscht kannst Du hier noch einen separaten Log-Eintrag für den geladenen Inhalt machen,
    // oder diesen komplett unterdrücken.
    // Beispiel: logToConsole("FHIR Bundle Loaded", json, { source: link });
    return json;
  } catch (error) {
    logToConsole("Fehler beim Laden der JSON-Daten", { error: error.message });
    throw error;
  }
}
