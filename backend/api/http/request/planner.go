package request

type CreatePlannerStageGoalRequest struct {
	Title          string `json:"title"`
	Description    string `json:"description"`
	Goal           string `json:"goal"`
	StartDate      string `json:"start_date"`
	EndDate        string `json:"end_date"`
	GoalPeriodType string `json:"goal_period_type"`
	TargetLevel    int    `json:"target_level"`
	InitLevel      int    `json:"init_level"`
	StudentID      uint64 `json:"student_id"`
}

type AddStageTaskRequest struct {
	OverviewID uint64 `json:"overview_id"`
	ExeDate    string `json:"exe_date"`
	StartTime  string `json:"start_time"`
	EndTime    string `json:"end_time"`
	Duration   int    `json:"duration"`
	Priority   int    `json:"priority"`
	Content    string `json:"content"`
	Note       string `json:"note"`
	Repeat     bool   `json:"repeat"`
}

type UpdateStageTaskRequest struct {
	ID     uint64 `json:"id"`
	Status string `json:"status"`
	Note   string `json:"note"`
}
