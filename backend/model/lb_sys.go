package model

import (
	"time"
)

type SysMessage struct {
	ID       uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	FullName string    `gorm:"column:full_name" json:"full_name"`
	Subject  string    `gorm:"column:subject" json:"subject"`
	Email    string    `gorm:"column:email" json:"email"`
	Message  string    `gorm:"column:message" json:"message"`
	AddTime  time.Time `gorm:"column:add_time" json:"add_time"`
}

func (SysMessage) TableName() string {
	return "sys_message"
}
