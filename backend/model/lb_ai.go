package model

import (
	"time"

	"github.com/shopspring/decimal"
)

type PromptContext struct {
	ID              uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	AddTime         time.Time `gorm:"column:add_time" json:"add_time"`
	Flag            int       `gorm:"column:flag" json:"flag"`
	CategoryPath    string    `gorm:"column:category_path" json:"category_path"`
	CategoryLevel   string    `gorm:"column:category_level" json:"category_level"`
	Sort            int       `gorm:"column:sort" json:"sort"`
	GeneralContext  string    `gorm:"column:general_context" json:"general_context"`
	PromptType      string    `gorm:"column:prompt_type" json:"prompt_type"`
	ResponseType    string    `gorm:"column:response_type" json:"response_type"`
	FuncName        string    `gorm:"column:func_name" json:"func_name"`
	PromptVariables string    `gorm:"column:prompt_variables" json:"prompt_variables"`
}

func (PromptContext) TableName() string {
	return "ai_prompt_context"
}

type UserAgentRecord struct {
	ID            uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	AddTime       time.Time `gorm:"column:add_time" json:"add_time"`
	Flag          int       `gorm:"column:flag" json:"flag"`
	AiPromptID    uint64    `gorm:"column:ai_prompt_id" json:"ai_prompt_id"`
	Input         string    `gorm:"column:input" json:"input"`
	Result        string    `gorm:"column:result" json:"result"`
	UserID        uint64    `gorm:"column:user_id" json:"user_id"`
	CategoryPath  string    `gorm:"column:category_path" json:"category_path"`
	CategoryLevel string    `gorm:"column:category_level" json:"category_level"`
	OverviewID    uint64    `gorm:"column:overview_id" json:"overview_id"`
}

func (UserAgentRecord) TableName() string {
	return "user_agent_record"
}

type UserAgentPrompt struct {
	ID            uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	PromptID      uint64 `gorm:"column:prompt_id" json:"prompt_id"`
	AgentRecordID uint64 `gorm:"column:agent_record_id" json:"agent_record_id"`
}

func (UserAgentPrompt) TableName() string {
	return "user_agent_prompt"
}

type ExamQuizRecord struct {
	ID            uint64               `gorm:"primaryKey;autoIncrement" json:"id"`
	AddTime       time.Time            `gorm:"column:add_time" json:"add_time"`
	AgentRecordID uint64               `gorm:"column:agent_record_id" json:"agent_record_id"`
	UserID        uint64               `gorm:"column:user_id" json:"user_id"`
	Score         decimal.Decimal      `gorm:"column:score" json:"score"`
	Result        string               `gorm:"column:result" json:"result"`
	Assessments   []ExamQuizAssessment `gorm:"-" json:"assessments"`
}

func (ExamQuizRecord) TableName() string {
	return "exam_quiz_record"
}

type ExamQuizAssessment struct {
	ID                      uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	AddTime                 time.Time       `gorm:"column:add_time" json:"add_time"`
	OverviewID              uint64          `gorm:"column:overview_id" json:"overview_id"`
	QuizRecordID            uint64          `gorm:"column:quiz_record_id" json:"quiz_record_id"`
	UserID                  uint64          `gorm:"column:user_id" json:"user_id"`
	StudentID               uint64          `gorm:"column:student_id" json:"student_id"`
	InitLevel               int             `gorm:"column:init_level" json:"init_level"`
	InitSubLevel            int             `gorm:"column:init_sub_level" json:"init_sub_level"`
	EstimatedDurationDays   int             `gorm:"column:estimated_duration_days" json:"estimated_duration_days"`
	AssessScore             decimal.Decimal `gorm:"column:assess_score" json:"assess_score"`
	AssessMaxScore          decimal.Decimal `gorm:"column:assess_max_score" json:"assess_max_score"`
	AssessLevelEstimate     string          `gorm:"column:assess_level_estimate" json:"assess_level_estimate"`
	AssessOverAllComment    string          `gorm:"column:assess_overall_comment" json:"assess_over_all_comment"`
	AssessStrengths         string          `gorm:"column:assess_strengths" json:"assess_strengths"`
	AssessWeaknesses        string          `gorm:"column:assess_weaknesses" json:"assess_weaknesses"`
	AssessSuggestions       string          `gorm:"column:assess_suggestions" json:"assess_suggestions"`
	AssessWritingEvaluation string          `gorm:"column:assess_writing_evaluation" json:"assess_writing_evaluation"`
	StudyPlanTpl            string          `gorm:"column:study_plan_tpl" json:"study_plan_tpl"`
	LearningTags            string          `gorm:"column:learning_tags" json:"learning_tags"`
}

func (ExamQuizAssessment) TableName() string {
	return "exam_quiz_assessment"
}

type UserAgentRecordHistorical struct {
	AddTime       time.Time       `gorm:"column:add_time" json:"add_time"`
	Score         decimal.Decimal `gorm:"column:score" json:"score"`
	AiPromptID    uint64          `gorm:"column:arid" json:"arid"`
	Input         string          `gorm:"column:input" json:"input"`
	CategoryPath  string          `gorm:"column:category_path" json:"category_path"`
	CategoryLevel string          `gorm:"column:category_level" json:"category_level"`
}

type UserAgentRecordOverview struct {
	QuizID        uint64          `gorm:"column:quiz_id" json:"quiz_id"`
	Score         decimal.Decimal `gorm:"column:score" json:"score"`
	Result        string          `gorm:"column:result" json:"result"`
	CategoryPath  string          `gorm:"category_path" json:"category_path"`
	CategoryLevel string          `gorm:"category_level" json:"category_level"`
	AgentRecordID uint64          `gorm:"column:agent_record_id" json:"agent_record_id"`
	OverviewID    uint64          `gorm:"column:overview_id" json:"overview_id"`
	AddTime       time.Time       `gorm:"column:add_time" json:"add_time"`
}
