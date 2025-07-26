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

type SysTag struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"column:name" json:"name"`
	ParentID    string    `gorm:"column:parent_id" json:"parent_id"`
	Description string    `gorm:"column:description" json:"description"`
	Sort        int       `gorm:"column:Sort" json:"Sort"`
	Active      int       `gorm:"column:active" json:"active"`
	AddTime     time.Time `gorm:"column:add_time" json:"add_time"`
}

func (SysTag) TableName() string {
	return "sys_tag"
}
