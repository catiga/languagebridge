package model

import (
	"time"
)

type UserRef struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UwID       int64     `gorm:"column:uw_id;type:varchar(255);not null" json:"uw_id"`
	RefCode    string    `gorm:"column:ref_code" json:"ref_code"`
	CreateTime time.Time `gorm:"column:create_time" json:"create_time"`
}

func (UserRef) TableName() string {
	return "user_ref_key"
}

type DailyCheck struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UwID      int64     `gorm:"column:uw_id;type:varchar(255);not null" json:"uw_id"`
	CheckDate string    `gorm:"column:check_date" json:"check_date"`
	CheckTime time.Time `gorm:"column:check_time" json:"check_time"`
}

func (DailyCheck) TableName() string {
	return "daily_checkin"
}

type UserAttention struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UwID       int64     `gorm:"column:uw_id;type:varchar(255);not null" json:"uw_id"`
	Chain      string    `gorm:"column:chain" json:"chain"`
	Ca         string    `gorm:"column:ca" json:"ca"`
	CreateTime time.Time `gorm:"column:create_time" json:"create_time"`
	UpdateTime time.Time `gorm:"column:update_time" json:"update_time"`
	Flag       int       `gorm:"column:flag" json:"flag"`
}

func (UserAttention) TableName() string {
	return "user_attention"
}
