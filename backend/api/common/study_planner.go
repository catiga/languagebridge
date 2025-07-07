package common

type StudyPlannerScheduleStatus string

const (
	StudyPlannerScheduleCreate            = "00"
	StudyPlannerScheduleOngoing           = "10"
	StudyPlannerScheduleUnfinished        = "20"
	StudyPlannerScheduleFullyComplete     = "50"
	StudyPlannerScheduleFewComplete       = "51"
	StudyPlannerScheduleMostlyComplete    = "52"
	StudyPlannerSchedulePartiallyComplete = "53"
	StudyPlannerScheduleLatelyComplete    = "54"
)
