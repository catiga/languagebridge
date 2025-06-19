package model

import (
	"time"

	"github.com/shopspring/decimal"
)

type CourseInfo struct {
	ID           uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string          `gorm:"column:name" json:"name"`
	Introduction string          `gorm:"column:introduction" json:"introduction"`
	Detail       string          `gorm:"column:detail" json:"detail"`
	Language     string          `gorm:"column:language" json:"language"`
	Level        int             `gorm:"column:level" json:"level"`
	CostPrice    decimal.Decimal `gorm:"column:cost_price" json:"cost_price"`
	DisplayPrice decimal.Decimal `gorm:"column:display_price" json:"display_price"`
	Goal         string          `gorm:"column:goal" json:"goal"`
	UpdateTime   time.Time       `gorm:"column:update_time" json:"update_time"`
	AddTime      time.Time       `gorm:"column:add_time" json:"add_time"`
	Status       string          `gorm:"column:status" json:"status"`
	Flag         int             `gorm:"column:flag" json:"flag"`
}

func (CourseInfo) TableName() string {
	return "course_info"
}

type Teacher struct {
	ID                uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name              string    `gorm:"column:name" json:"name"`
	Introduction      string    `gorm:"column:introduction" json:"introduction"`
	Detail            string    `gorm:"column:detail" json:"detail"`
	FirstLanguage     string    `gorm:"column:first_language" json:"first_language"`
	NationalityID     uint64    `gorm:"column:nationality_id" json:"nationality_id"`
	NationalityName   string    `gorm:"column:nationality_name" json:"nationality_name"`
	LivingCountryID   uint64    `gorm:"column:living_country_id" json:"living_country_id"`
	LivingCountryName uint64    `gorm:"column:living_country_name" json:"living_country_name"`
	PhoneCode         string    `gorm:"column:phone_code" json:"phone_code"`
	Phone             string    `gorm:"column:phone" json:"phone"`
	UpdateTime        time.Time `gorm:"column:update_time" json:"update_time"`
	AddTime           time.Time `gorm:"column:add_time" json:"add_time"`
	Status            string    `gorm:"column:status" json:"status"`
	Flag              int       `gorm:"column:flag" json:"flag"`
}

func (Teacher) TableName() string {
	return "teacher_info"
}
