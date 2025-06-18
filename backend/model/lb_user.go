package model

import "time"

type UserInfo struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	LoginId    string    `gorm:"column:login_id;type:varchar(255);not null" json:"login_id"`
	Email      string    `gorm:"column:email" json:"email"`
	Name       string    `gorm:"column:name" json:"name"`
	Password   string    `gorm:"column:password" json:"-"`
	Country    string    `gorm:"column:Country" json:"Country"`
	Language   string    `gorm:"column:language" json:"language"`
	AddTime    time.Time `gorm:"column:add_time" json:"add_time"`
	UpdateTime time.Time `gorm:"column:update_time" json:"update_time"`
	Status     string    `gorm:"column:status" json:"status"`
	UserNo     string    `gorm:"column:user_no" json:"user_no"`
}

func (UserInfo) TableName() string {
	return "user_info"
}
