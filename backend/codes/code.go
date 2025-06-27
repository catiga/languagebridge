package codes

type VerificationSort string
type VerificationType string

const (
	VerificationSortUser    VerificationSort = "10"
	VerificationSortTeacher VerificationSort = "20"
	VerificationTypeEmail   VerificationType = "10"
	VerificationTypeSms     VerificationType = "20"
)

type CourseMineStatus string

const (
	CourseMineInactive      CourseMineStatus = "00"
	CourseMineWatingConfirm CourseMineStatus = "01"
	CourseMineCanceled      CourseMineStatus = "02"
	CourseMineOngoing       CourseMineStatus = "10"
	CourseMineComplete      CourseMineStatus = "20"
)
