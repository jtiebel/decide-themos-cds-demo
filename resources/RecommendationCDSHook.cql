library GuidelineRecommendationCDSHook version '1.0.0'

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

context Patient

// Prüft, ob ein Goal mit dem spezifischen Zielkriterium "Verbesserung der Gehfähigkeit" vorhanden ist
define "HasTargetGoal":
  exists (
    [Goal] G
      where exists(G.target[0].measure.coding where 
        G.target[0].measure.coding.system = 'http://snomed.info/sct' and 
        G.target[0].measure.coding.code = '282097004'
      )
  )

// Hauptdefinition: Der Trigger wird ausgelöst, wenn das Zielkriterium vorliegt
define "TriggerGuidelineRecommendation":
  "HasTargetGoal"
