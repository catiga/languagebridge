package model

import (
	"time"

	"github.com/shopspring/decimal"
)

type CourseInfo struct {
	ID            uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	Name          string          `gorm:"column:name" json:"name"`
	Introduction  string          `gorm:"column:introduction" json:"introduction"`
	Detail        string          `gorm:"column:detail" json:"detail"`
	Language      string          `gorm:"column:language" json:"language"`
	Level         int             `gorm:"column:level" json:"level"`
	CostPrice     decimal.Decimal `gorm:"column:cost_price" json:"cost_price"`
	DisplayPrice  decimal.Decimal `gorm:"column:display_price" json:"display_price"`
	Goal          string          `gorm:"column:goal" json:"goal"`
	UpdateTime    time.Time       `gorm:"column:update_time" json:"update_time"`
	AddTime       time.Time       `gorm:"column:add_time" json:"add_time"`
	Status        string          `gorm:"column:status" json:"status"`
	Flag          int             `gorm:"column:flag" json:"flag"`
	Duration      int             `gorm:"column:duration" json:"duration"`
	SessionNumber int             `gorm:"column:session_number" json:"session_number"`
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
	LivingCountryName string    `gorm:"column:living_country_name" json:"living_country_name"`
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

type UserCourse struct {
	ID       uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID   uint64    `gorm:"column:user_id" json:"user_id"`
	CourseID uint64    `gorm:"column:course_id" json:"course_id"`
	AddTime  time.Time `gorm:"column:add_time" json:"add_time"`
	Status   string    `gorm:"column:status" json:"status"`
	Flag     int       `gorm:"column:flag" json:"flag"`
}

func (UserCourse) TableName() string {
	return "user_course"
}

type UserCourseWithCourse struct {
	// user_course 表字段
	UserCourseID uint64    `gorm:"column:uc_id" json:"user_course_id"`
	UserID       uint64    `gorm:"column:user_id" json:"user_id"`
	CourseID     uint64    `gorm:"column:course_id" json:"course_id"`
	UCStatus     string    `gorm:"column:uc_status" json:"user_course_status"`
	UCAddTime    time.Time `gorm:"column:uc_add_time" json:"user_course_add_time"`

	// course_info 表字段
	CourseName    string          `gorm:"column:name" json:"course_name"`
	Introduction  string          `gorm:"column:introduction" json:"introduction"`
	Detail        string          `gorm:"column:detail" json:"detail"`
	Language      string          `gorm:"column:language" json:"language"`
	Level         int             `gorm:"column:level" json:"level"`
	CostPrice     decimal.Decimal `gorm:"column:cost_price" json:"cost_price"`
	DisplayPrice  decimal.Decimal `gorm:"column:display_price" json:"display_price"`
	Goal          string          `gorm:"column:goal" json:"goal"`
	CourseAddTime time.Time       `gorm:"column:course_add_time" json:"course_add_time"`
	CourseUpdTime time.Time       `gorm:"column:course_update_time" json:"course_update_time"`
	CourseStatus  string          `gorm:"column:course_status" json:"course_status"`
	CourseFlag    int             `gorm:"column:course_flag" json:"course_flag"`
}

type TeacherTimeSlotTemplate struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	TeacherID  uint64    `gorm:"column:teacher_id" json:"teacher_id"`
	WeekDay    int       `gorm:"column:week_day" json:"week_day"`
	StartTime  string    `gorm:"column:start_time" json:"start_time"`
	EndTime    string    `gorm:"column:end_time" json:"end_time"`
	Enabled    bool      `gorm:"column:enabled" json:"enabled"`
	UpdateTime time.Time `gorm:"column:update_time" json:"update_time"`
}

func (TeacherTimeSlotTemplate) TableName() string {
	return "teacher_timeslot_template"
}
