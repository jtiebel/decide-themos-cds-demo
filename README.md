# EHR Patientensicht

Dieses Repository enthält eine Webanwendung, die eine Demonstration einer EHR-Umgebung (Electronic Health Record) darstellt. Die Anwendung fokussiert sich auf die Therapieplanung bei Schlaganfallpatienten, indem FHIR-Daten (Fast Healthcare Interoperability Resources) in ein interaktives Frontend integriert werden. Dabei werden sowohl Patientenstammdaten als auch klinische Informationen genutzt, um dynamisch Therapieziele, Leitlinienempfehlungen und einen kompletten Pflegeplan (CarePlan) zu erstellen.

## Inhalt

* [Features](#features)
* [Technologien](#technologien)
* [Installation](#installation)
* [Verwendung](#verwendung)
* [Projektstruktur](#projektstruktur)
* [Beitragen](#beitragen)
* [Lizenz](#lizenz)

## Features

* **FHIR-Datenintegration:** Lädt Patientendaten, Diagnosen, Beobachtungsdaten und Service Requests im FHIR-Format.
* **Therapieplanung:** Ermöglicht die Definition von Therapie-/Rehabilitationszielen sowie das Hinzufügen und Verwalten von Therapieinterventionen.
* **CDS Hooks:** Dynamische Evaluierung von FHIR-Bundles zur Triggerung von CDS (Clinical Decision Support)-Hooks für Goalset und Recommendation.
* **Interaktives Frontend:** Übersichtliche Darstellung der Patientendaten und dynamische Interaktion via Bootstrap-Komponenten (Modals, Toasts, Cards).
* **Logging:** Übersichtliche Darstellung der FHIR-API-Kommunikation direkt im Browser.

## Technologien

Die Anwendung verwendet folgende Technologien und Frameworks:

* **HTML5 & CSS3:** Struktur und Styling der Anwendung.
* **JavaScript:** Dynamik, Datenabruf, FHIR-Datenverarbeitung, Evaluierungen und Logik zur Therapieplanung.
* **Bootstrap 5.3.3:** Für responsives Design und UI-Komponenten.
* **FHIR:** Standard zur Übertragung und Speicherung von Gesundheitsdaten.
* **RESTful API:** Zum Abruf von FHIR JSON-Beispielen (z.B. über GitHub Raw-URLs).

## Installation

1.  **Repository klonen:**
    ```bash
    git clone [https://github.com/dein-benutzername/ehr-patientensicht.git](https://github.com/dein-benutzername/ehr-patientensicht.git)
    cd ehr-patientensicht
    ```
2.  **Projektdateien öffnen:**
    Stelle sicher, dass du eine aktuelle Version eines modernen Webbrowsers verwendest (Chrome, Firefox, Edge usw.).
    Öffne die `index.html` direkt im Browser oder starte einen lokalen Webserver, um alle Funktionen ohne CORS-Probleme auszuführen.
3.  **Lokaler Webserver (optional):**
    Falls du einen lokalen Server benötigst, kannst du beispielsweise Python verwenden:
    ```bash
    # Für Python 3.x
    python -m http.server 8000
    ```
    Dann im Browser unter `http://localhost:8000` öffnen.

## Verwendung

Nach dem Öffnen der Anwendung im Browser:

1.  **Patientendaten laden:**
    Die Anwendung lädt automatisch ein Beispiel-FHIR-Bundle, das Patientendaten (z. B. Name, Geburtsdatum, Geschlecht), Diagnosen (z. B. Schlaganfall, Gangstörung) und Service Requests (z. B. Gangtraining) enthält.
2.  **Therapieziel hinzufügen:**
    Über den Button **"Therapieziel hinzufügen"** wird ein Modal geöffnet, in dem dynamisch mögliche Therapieziele (Goalset) basierend auf den FHIR-Daten zur Auswahl stehen.
3.  **Leitlinienempfehlungen:**
    Nach Auswahl eines Ziels kann der Therapeut klinische Leitlinienempfehlungen abrufen, die im Modal als Interventionen angezeigt werden. Eine Auswahl triggert weitere UI-Elemente zur Planung der Intervention.
4.  **Therapieplanung abschließen:**
    Nach Festlegung der Ziele und Interventionen wird ein FHIR CarePlan generiert, der alle gewünschten Details der Therapieplanung zusammenfasst.
5.  **Logging und Debugging:**
    Alle FHIR-Kommunikationen und Evaluierungsschritte werden in einem konsolenartigen Bereich auf der rechten Seite der Anwendung protokolliert.

## Projektstruktur

```bash
ehr-patientensicht/
├── index.html                   # Hauptdatei der Anwendung
├── style.css                    # (Optional) Externe CSS-Datei (in diesem Beispiel inline eingebettet)
├── script.js                    # (Optional) Externe JavaScript-Datei (in diesem Beispiel inline eingebettet)
├── goalset-cds-example.json     # Beispiel-JSON für Goalset-CDS Hook
├── recommendation-cds-example.json  # Beispiel-JSON für Recommendation-CDS Hook
└── README.md                    # Diese Datei

**Hinweis:** In diesem Repository sind die Skripte in der HTML-Datei integriert, sodass keine weitere Aufteilung nötig ist. Für größere Projekte empfiehlt sich jedoch eine saubere Trennung von HTML, CSS und JavaScript.

## Beitragen

Beiträge zum Projekt sind willkommen! Falls du Anregungen, Bugfixes oder neue Features hast, folge bitte diesen Schritten:

1.  Forke das Repository.
2.  Erstelle einen neuen Branch (`feature/neues-feature`).
3.  Führe deine Änderungen durch und committe diese.
4.  Erstelle einen Pull Request mit einer detaillierten Beschreibung deiner Änderungen.

## Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](https://opensource.org/licenses/MIT). Weitere Informationen findest du in der `LICENSE`-Datei.

Dieses Projekt dient als Demonstration der Integration von FHIR-Daten und CDS Hooks in einer EHR-Umgebung zur dynamischen Therapieplanung.
