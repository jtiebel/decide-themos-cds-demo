library GoalsetCDSHook version '1.0.0'

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

context Patient

// Prüft, ob eine Stroke-Condition vorhanden ist (ICD‑10 I63)
define "HasStroke":
  exists ([Condition] C where
    exists(C.code.coding where 
      C.code.coding.system = 'http://hl7.org/fhir/sid/icd-10' and 
      C.code.coding.code = 'I63'
    )
  )

// Prüft, ob eine Condition für Abnormal Gait vorhanden ist (SNOMED 22325002)
define "HasAbnormalGait":
  exists ([Condition] C where
    exists(C.code.coding where 
      C.code.coding.system = 'http://snomed.info/sct' and 
      C.code.coding.code = '22325002'
    )
  )

// Prüft, ob ein ServiceRequest für Gait Re-education vorhanden ist (SNOMED 74914000)
define "HasGaitServiceRequest":
  exists ([ServiceRequest] SR where
    exists(SR.code.coding where 
      SR.code.coding.system = 'http://snomed.info/sct' and 
      SR.code.coding.code = '74914000'
    )
  )

// Hauptdefinition: Alle drei Bedingungen müssen erfüllt sein
define "TriggerGoalset":
  "HasStroke" and "HasAbnormalGait" and "HasGaitServiceRequest"
