package service

import (
	"time"

	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
)

type InternalComputeBookDatetime struct {
	LessonDate string
	StartTime  string
	EndTime    string
}

type InternalComputeBookDatetimeWithStatus struct {
	InternalComputeBookDatetime
	Enable bool
}

func TeacherAvailableSlots(teacherId uint64, specificDate string, duration int) []InternalComputeBookDatetimeWithStatus {
	db := system.GetDb()

	var templateSlots []model.TeacherTimeSlotTemplate
	err := db.Model(&model.TeacherTimeSlotTemplate{}).Where("teacher_id = ? and enabled = ?", teacherId, true).Find(&templateSlots).Error

	if err != nil {
		log.Error(err)
	}
	layout := "2006-01-02"
	layoutTime := "15:04:00"
	d, _ := time.Parse(layout, specificDate)

	var internalResult []InternalComputeBookDatetimeWithStatus
	weekday := int(d.Weekday())
	if weekday == 0 {
		weekday = 7 // Sunday fix
	}
	var allDate []string
	allDate = append(allDate, d.Format("2006-01-02"))
	for _, slot := range templateSlots {
		if slot.WeekDay == weekday {
			// split this time range by duration
			startTime, _ := time.Parse(layoutTime, slot.StartTime)
			endTime, _ := time.Parse(layoutTime, slot.EndTime)

			for endTime.After(startTime) {
				internalResult = append(internalResult, InternalComputeBookDatetimeWithStatus{
					InternalComputeBookDatetime: InternalComputeBookDatetime{
						LessonDate: d.Format(layout),
						StartTime:  startTime.Format(layoutTime),
						EndTime:    startTime.Add(time.Duration(duration) * time.Minute).Format(layoutTime),
					},
					Enable: true,
				})
				startTime = startTime.Add(time.Duration(duration) * time.Minute)
			}

		}
	}

	var existResult []model.CourseBookTrans
	// query can book?
	err = db.Model(&model.CourseBookTrans{}).
		Where("teacher_id = ? and lesson_date IN ?", teacherId, allDate).
		Find(&existResult).
		Error
	if err != nil {
		log.Error(err)
	}

	if len(existResult) > 0 {
		for i := range internalResult {
			want := &internalResult[i]
			for _, exist := range existResult {
				targetDate := exist.LessonDate.Format("2006-01-02")
				if want.LessonDate == targetDate {
					// parse time string to time.Time (only HH:mm)
					newStart, err := time.Parse(layoutTime, want.StartTime)
					if err != nil {
						log.Error(err)
					}
					newEnd, err := time.Parse(layoutTime, want.EndTime)
					existStart, _ := time.Parse("15:04:00", exist.StartTime)
					existEnd, _ := time.Parse("15:04:00", exist.EndTime)

					hasConflict := newStart.Before(existEnd) && newEnd.After(existStart)
					if hasConflict {
						want.Enable = false
					}
				}
			}
		}
	}
	return internalResult
}
