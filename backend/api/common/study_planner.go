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

func StatusCheck(ss string) bool {
	switch ss {
	case
		StudyPlannerScheduleCreate,
		StudyPlannerScheduleOngoing,
		StudyPlannerScheduleUnfinished,
		StudyPlannerScheduleFullyComplete,
		StudyPlannerScheduleFewComplete,
		StudyPlannerScheduleMostlyComplete,
		StudyPlannerSchedulePartiallyComplete,
		StudyPlannerScheduleLatelyComplete:
		return true
	default:
		return false
	}
}
