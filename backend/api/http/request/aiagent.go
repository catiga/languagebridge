package request

type SelfAssessmentRequest struct {
	Content string `json:"content"`
}

type SelfAssessmentExamRequest struct {
	Level int `json:"level"`
}
