package request

type CreatePlannerStageGoalRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Goal        string `json:"goal"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
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
