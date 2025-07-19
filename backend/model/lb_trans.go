package model

import "time"

type CourseBookTrans struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UcID       uint64    `gorm:"column:uc_id" json:"uc_id"`
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
	Ongoing    int       `gorm:"column:ongoing" json:"ongoing"`
}

func (CourseBookTrans) TableName() string {
	return "course_book_trans"
}

type CourseBookLeave struct {
	ID               uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	BookID           uint64    `gorm:"column:book_id" json:"book_id"`
	PendingDate      time.Time `gorm:"column:pending_date" json:"pending_date"`
	PendingStartTime string    `gorm:"column:pending_start_time" json:"pending_start_time"`
	PendingEndTime   string    `gorm:"column:pending_end_time" json:"pending_end_time"`
	Source           int       `gorm:"column:source" json:"source"`
	AddTime          time.Time `gorm:"column:add_time" json:"add_time"`
	Status           string    `gorm:"column:status" json:"status"`
}

func (CourseBookLeave) TableName() string {
	return "course_book_leave"
}

type CourseBookWithJoin struct {
	CourseBookTrans
	TeacherName string `json:"teacher_name"`
	CourseName  string `json:"course_name"`
	StudentName string `json:"student_name"`
}

type CourseMeetingNote struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	BtID      uint64    `gorm:"column:bt_id" json:"bt_id"`
	UserID    uint64    `gorm:"column:user_id" json:"user_id"`
	StudentID uint64    `gorm:"column:student_id" json:"student_id"`
	TeacherID uint64    `gorm:"column:teacher_id" json:"teacher_id"`
	Note      string    `gorm:"column:note" json:"note"`
	AddTime   time.Time `gorm:"column:add_time" json:"add_time"`
	Source    string    `gorm:"column:source" json:"source"`
}

func (CourseMeetingNote) TableName() string {
	return "course_meeting_note"
}
