# DECIDE TheMoS FHIR-based Guideline CDS Implementation

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
* **Therapieplanung:** Ermöglicht die Definition von Therapie-/Rehabilitationszielen sowie das Hinzufügen und Verwalten von Therapieinterventionen auf Basis von SNOMED CT.
* **CDS Hooks:** Dynamische Evaluierung von FHIR-Bundles zur Triggerung von CDS (Clinical Decision Support)-Hooks für Goalsets und Recommendations.
* **Interaktives Frontend:** Übersichtliche Darstellung der Patientendaten und dynamische Interaktion via Bootstrap-Komponenten.
* **Logging:** Übersichtliche Darstellung der FHIR-API-Kommunikation direkt im Browser.

## Technologien

Die Anwendung verwendet folgende Technologien und Frameworks:

* **HTML5 & CSS3:** Struktur und Styling der Anwendung.
* **JavaScript:** Dynamik, Datenabruf, FHIR-Datenverarbeitung, Evaluierungen und Logik zur Therapieplanung.
* **Bootstrap 5.3.3:** Für responsives Design und UI-Komponenten.
* **FHIR:** Standard zur Übertragung und Speicherung von Gesundheitsdaten.
* **RESTful API:** Zum Abruf von FHIR JSON-Beispielen (über GitHub Raw-URLs).

## Demo

Eine Demo kann abgerufen werden über: [decide-themos-cds-demo](https://github.com/jtiebel/decide-themos-cds-demo)

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


## Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](https://opensource.org/licenses/MIT). 
Dieses Projekt dient lediglich als Demonstration der Integration von FHIR-Daten und CDS Hooks in einer EHR-Umgebung zur dynamischen Therapieplanung.
