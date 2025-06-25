package model

import "time"

type VerificationProcess struct {
	ID             uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Target         string    `gorm:"column:target" json:"target"`
	Type           string    `gorm:"column:type" json:"type"`
	Code           string    `gorm:"column:code" json:"code"`
	AddTime        time.Time `gorm:"column:add_time" json:"add_time"`
	ValidatePeriod int64     `gorm:"column:validate_period" json:"validate_period"`
	Sort           string    `gorm:"column:sort" json:"sort"`
	Status         string    `gorm:"column:status" json:"status"`
}

func (VerificationProcess) TableName() string {
	return "verification_process"
}
