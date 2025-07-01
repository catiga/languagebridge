package model

import "time"

type PromptContext struct {
	ID             uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	AddTime        time.Time `gorm:"column:add_time" json:"add_time"`
	Flag           int       `gorm:"column:flag" json:"flag"`
	CategoryPath   string    `gorm:"column:category_path" json:"category_path"`
	CategoryLevel  string    `gorm:"column:category_level" json:"category_level"`
	Sort           int       `gorm:"column:sort" json:"sort"`
	GeneralContext string    `gorm:"column:general_context" json:"general_context"`
	PromptType     string    `gorm:"column:prompt_type" json:"prompt_type"`
	ResponseType   string    `gorm:"column:response_type" json:"response_type"`
	FuncName       string    `gorm:"column:func_name" json:"func_name"`
}

func (PromptContext) TableName() string {
	return "ai_prompt_context"
}
