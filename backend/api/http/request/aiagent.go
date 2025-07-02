package request

type SelfAssessmentRequest struct {
	Content string `json:"content"`
}

type SelfAssessmentExamRequest struct {
	Level int `json:"level"`
}

type ExamQuiz struct {
	Type        string   `json:"type"`
	Question    string   `json:"question"`
	Options     []string `json:"options"`
	Answer      string   `json:"answer"`
	Explanation string   `json:"explanation"`
	UserAnswer  string   `json:"user_answer"`
	Correct     bool     `json:"correct"`
}

type ExamMarkRequest struct {
	ExamID    uint64     `json:"exam_id`
	Questions []ExamQuiz `json:"questions"`
}
