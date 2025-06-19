package model

import "time"

type UserInfo struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	LoginId    string    `gorm:"column:login_id;type:varchar(255);not null" json:"login_id"`
	Email      string    `gorm:"column:email" json:"email"`
	Name       string    `gorm:"column:name" json:"name"`
	Password   string    `gorm:"column:password" json:"-"`
	CountryID  uint64    `gorm:"column:country_id" json:"country_id"`
	Language   string    `gorm:"column:language" json:"language"`
	AddTime    time.Time `gorm:"column:add_time" json:"add_time"`
	UpdateTime time.Time `gorm:"column:update_time" json:"update_time"`
	Status     string    `gorm:"column:status" json:"status"`
	UserNo     string    `gorm:"column:user_no" json:"user_no"`
}

func (UserInfo) TableName() string {
	return "user_info"
}

type UserProfile struct {
	ID                uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID            uint64    `gorm:"column:user_id" json:"user_id"`
	NickName          string    `gorm:"column:nick_name" json:"nick_name"`
	Avatar            string    `gorm:"column:avatar" json:"avatar"`
	LivingCountryID   uint64    `gorm:"column:living_country_id" json:"living_country_id"`
	LivingCountryName string    `gorm:"column:living_country_name" json:"living_country_name"`
	LivingCountryCode string    `gorm:"column:living_country_code" json:"living_country_code"`
	ContactPhone      string    `gorm:"column:contact_phone" json:"contact_phone"`
	NativeLanguage    string    `gorm:"column:native_language" json:"native_language"`
	UpdateTime        time.Time `gorm:"column:update_time" json:"update_time"`
}

func (UserProfile) TableName() string {
	return "user_profile"
}

type UserMember struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      uint64    `gorm:"column:user_id" json:"user_id"`
	Name        string    `gorm:"column:name" json:"name"`
	Email       string    `gorm:"column:email" json:"email"`
	RelType     string    `gorm:"column:rel_type" json:"rel_type"`
	RelDesc     string    `gorm:"column:rel_desc" json:"rel_desc"`
	UpdateTime  time.Time `gorm:"column:update_time" json:"update_time"`
	AddTime     time.Time `gorm:"column:add_time" json:"add_time"`
	Flag        int       `gorm:"column:flag" json:"flag"`
	Gender      int       `gorm:"column:gender" json:"gender"`
	Birthday    string    `gorm:"column:birthday" json:"birthday"`
	Personality string    `gorm:"column:personality" json:"personality"`
	Character   string    `gorm:"column:character" json:"character"`
}

func (UserMember) TableName() string {
	return "user_member"
}
