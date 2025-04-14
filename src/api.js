// File: src/api.js

import { logToConsole } from "./utilities.js";

// Funktion zum Laden von JSON-Daten
export async function loadJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP-Fehler: ${res.status}`);
    const json = await res.json();
    logToConsole("JSON geladen", json);
    return json;
  } catch (error) {
    logToConsole("Fehler beim Laden der JSON-Daten", { error: error.message });
    throw error;
  }
}

