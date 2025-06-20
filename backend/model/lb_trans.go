package model

import "time"

type CourseBookTrans struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	BookingNo  string    `gorm:"column:booking_no" json:"booking_no"`
	TeacherID  uint64    `gorm:"column:teacher_id" json:"teacher_id"`
	CourseID   uint64    `gorm:"column:course_id" json:"course_id"`
	UserID     uint64    `gorm:"column:user_id" json:"user_id"`
	LessonDate time.Time `gorm:"column:lesson_date" json:"lesson_date"`
	StartTime  string    `gorm:"column:start_time" json:"start_time"`
	EndTime    string    `gorm:"column:end_time" json:"end_time"`
	UpdateTime time.Time `gorm:"column:update_time" json:"update_time"`
	AddTime    time.Time `gorm:"column:add_time" json:"add_time"`
	Status     string    `gorm:"column:status" json:"status"`
}

func (CourseBookTrans) TableName() string {
	return "course_book_trans"
}
