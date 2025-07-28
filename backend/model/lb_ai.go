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

type ExamQuizRecord struct {
	ID            uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	AddTime       time.Time       `gorm:"column:add_time" json:"add_time"`
	AgentRecordID uint64          `gorm:"column:agent_record_id" json:"agent_record_id"`
	UserID        uint64          `gorm:"column:user_id" json:"user_id"`
	Score         decimal.Decimal `gorm:"column:score" json:"score"`
	Result        string          `gorm:"column:result" json:"result"`
}

func (ExamQuizRecord) TableName() string {
	return "exam_quiz_record"
}

type UserAgentRecordHistorical struct {
	AddTime       time.Time       `gorm:"column:add_time" json:"add_time"`
	Score         decimal.Decimal `gorm:"column:score" json:"score"`
	AiPromptID    uint64          `gorm:"column:arid" json:"arid"`
	Input         string          `gorm:"column:input" json:"input"`
	CategoryPath  string          `gorm:"column:category_path" json:"category_path"`
	CategoryLevel string          `gorm:"column:category_level" json:"category_level"`
}
