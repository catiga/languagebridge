package auth

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
	"github.com/langbridge/backend/utils"
)

type StudentResponse struct {
	ID      uint64    `json:"id"`
	Email   string    `gorm:"column:email" json:"email"`
	Name    string    `gorm:"column:name" json:"name"`
	AddTime time.Time `json:"add_time"`
	Avatar  string    `gorm:"column:avatar" json:"avatar"`
}

func StudentOverview(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()
	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"

	currentUser, exist := c.Get("student_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	student_id, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var studentCourseCount int64
	var lessonUpcomingCount int64
	var lessonPastCount int64
	var totalStudentCount int64

	var studentInfo model.UserMember
	var currentWeekCourseList []SimpleCourseBookObject

	db.Model(&model.UserMember{}).Where("id = ?", student_id).First(&studentInfo)

	err = db.Model(&model.UserCourse{}).
		Where("student_id = ?", student_id).
		Count(&studentCourseCount).Error
	if err != nil {
		log.Error("overview-fetch total course error", err)
	}

	err = db.Table("course_book_trans ct").Joins("JOIN user_course uc ON ct.uc_id = uc.id").
		Where("uc.student_id = ? and ct.lesson_date > ?", studentInfo.ID, time.Now()).Count(&lessonUpcomingCount).Error
	if err != nil {
		log.Error("overview-fetch upcoming lession error", err)
	}

	err = db.Table("course_book_trans ct").Joins("JOIN user_course uc ON ct.uc_id = uc.id").
		Where("uc.student_id = ? and ct.lesson_date < ?", studentInfo.ID, time.Now()).Count(&lessonPastCount).Error

	err = db.Table("course_book_trans ct").Joins("JOIN user_course uc ON ct.uc_id = uc.id").
		Where("uc.student_id = ?", studentInfo.ID).Select("DISTINCT uc.student_id").Count(&totalStudentCount).Error

	currentWeekStart, currentWeekEnd := utils.GetCurrentWeekRange()
	err = db.Table("course_book_trans as b").
		Select(`b.id as book_id, b.booking_no as book_no, b.lesson_date, b.start_time, b.end_time, 
			b.course_id, c.name as course_name, b.teacher_id, t.name AS teacher_name, b.user_id`).
		Joins("JOIN user_course uc ON b.uc_id = uc.id").
		Joins("LEFT JOIN course_info c ON b.course_id = c.id").
		Joins("LEFT JOIN teacher_info t ON b.teacher_id = t.id").
		Where("uc.student_id = ? AND b.lesson_date >= ? AND b.lesson_date <= ?", student_id, currentWeekStart, currentWeekEnd).
		Order("b.lesson_date, b.start_time asc").
		Scan(&currentWeekCourseList).Error
	if err != nil {
		log.Error("overview-fetch week course list error", err)
	}

	res.Data = struct {
		MyCourseCount       int64                    `json:"my_course_count"`
		LessonUpcomingCount int64                    `json:"lesson_upcoming_count"`
		LessonPastCount     int64                    `json:"lesson_past_count"`
		TotalStudentCount   int64                    `json:"total_student_count"`
		CurrentWeekCourses  []SimpleCourseBookObject `json:"current_week_courses"`
		UpdatedStudent      StudentResponse          `json:"updated_student"`
	}{
		MyCourseCount:       studentCourseCount,
		LessonUpcomingCount: lessonUpcomingCount,
		LessonPastCount:     lessonPastCount,
		TotalStudentCount:   totalStudentCount,
		CurrentWeekCourses:  currentWeekCourseList,
		UpdatedStudent: StudentResponse{
			ID:      studentInfo.ID,
			Email:   studentInfo.Email,
			Name:    studentInfo.Name,
			AddTime: studentInfo.AddTime,
			Avatar:  "",
		},
	}
	c.JSON(http.StatusOK, res)
}
