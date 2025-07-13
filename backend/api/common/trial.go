package common

type TrialLessonStatus string

const (
	TrialLessonCreate         = "00"
	TrialLessonWaitingConfirm = "10"
	TrialLessonConfirmed      = "20"
	TrialLessonFinished       = "30"
)
