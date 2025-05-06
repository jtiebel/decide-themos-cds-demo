library GuidelineRecommendationCDSHook version '1.0.0'

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

context Patient

// Liste der relevanten Zielkriterien (SNOMED CT Codes)
define "MobilityTargetCodes":
  {
    '282097004', // Gehfähigkeit – Ability to walk
    '724237005', // Gehgeschwindigkeit – Gait speed
    '165263003', // Gehausdauer – Walking distance
    '298348009'  // Anzahl der Stürze – Number of falls
  }

// Prüft, ob ein Goal mit einem der Zielkriterien vorhanden ist
define "HasTargetGoal":
  exists (
    [Goal] G
      where exists (
        G.target T
          where exists (
            T.measure.coding C
              where C.system = 'http://snomed.info/sct'
              and C.code in "MobilityTargetCodes"
          )
      )
  )

// Hauptdefinition: Der Trigger wird ausgelöst, wenn eines der Zielkriterien vorliegt
define "TriggerGuidelineRecommendation":
  "HasTargetGoal"
