package common

type StudyPlannerScheduleStatus string
type StudyPlannerOverviewStatus string

const (
	StudyPlannerScheduleCreate            = "00"
	StudyPlannerScheduleOngoing           = "10"
	StudyPlannerScheduleUnfinished        = "20"
	StudyPlannerScheduleFullyComplete     = "50"
	StudyPlannerScheduleFewComplete       = "51"
	StudyPlannerScheduleMostlyComplete    = "52"
	StudyPlannerSchedulePartiallyComplete = "53"
	StudyPlannerScheduleLatelyComplete    = "54"

	StudyPlannerOverviewStatusCreate       = "00"
	StudyPlannerOverviewStatusAIError      = "01"
	StudyPlannerOverviewStatusAIProcessing = "05"
	StudyPlannerOverviewStatusAIComplete   = "06"
	StudyPlannerOverviewStatusOngoing      = "10"
	StudyPlannerOverviewStatusFinished     = "20"
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
