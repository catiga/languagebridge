package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/api/http/request"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
	"github.com/langbridge/backend/utils"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type UpdateTeacherProfileRequest struct {
	Name            string `json:"name" binding:"required,min=2"`
	FirstName       string `json:"first_name" binding:"required,min=1"`
	LastName        string `json:"last_name" binding:"required,min=1"`
	NationalityID   uint64 `json:"nationality_id"`
	LivingCountryID uint64 `json:"living_country_id"`
	Introduction    string `json:"introduction" binding:"required,min=6"`
	Detail          string `json:"detail"`
	FirstLanguage   string `json:"first_language" binding:"required"`
	Avatar          string `json:"avatar"`
}

type UpdateTeacherCertificateRequest struct {
	ID          uint64 `json:"id"`
	Title       string `json:"title" binding:"required,min=2"`
	Achievement string `json:"achievement" binding:"required,min=2"`
	IssueOrg    string `json:"issue_org"`
	GetDate     string `json:"get_date"`
	Document    string `json:"document"`
}

type TeacherResponse struct {
	ID        uint64    `json:"id"`
	Email     string    `gorm:"column:email" json:"email"`
	Name      string    `gorm:"column:name" json:"name"`
	AddTime   time.Time `json:"add_time"`
	Status    string    `json:"status"`
	TeacherNo string    `json:"teacher_no"`
	Avatar    string    `gorm:"column:avatar" json:"avatar"`
}

type SelectTimeSlot struct {
	WeekDay   int    `json:"week_day"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Enable    int    `json:"enable"`
}

type SetTimeSlotsRequest struct {
	Slots []SelectTimeSlot `json:"slots"`
}

type AddCourseRequest struct {
	ID            uint64          `json:"id"`
	Name          string          `json:"name" binding:"required"`
	Introduction  string          `json:"introduction" binding:"required"`
	Detail        string          `json:"detail" binding:"required"`
	Language      string          `json:"language" binding:"required"`
	Level         int             `json:"level" binding:"required"`
	CostPrice     decimal.Decimal `json:"cost_price"`
	DisplayPrice  decimal.Decimal `json:"display_price"`
	Goal          string          `json:"goal" binding:"required"`
	Duration      int             `json:"duration" binding:"required"`
	SessionNumber int             `json:"session_number" binding:"required"`
	CoursePicture string          `json:"course_picture" binding:"required"`
}

type SimpleCourseBookObject struct {
	BookID      uint64 `json:"book_id"`
	BookNo      string `json:"book_no"`
	LessonDate  string `json:"lesson_date"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	CourseID    uint64 `json:"course_id"`
	CourseName  string `json:"course_name"`
	TeacherID   uint64 `json:"teacher_id"`
	UserID      uint64 `json:"user_id"`
	TeacherName string `json:"teacher_name"`
}

func TeacherOverview(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()
	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	teacherId, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var teacherCourseCount int64
	var lessonUpcomingCount int64
	var lessonPastCount int64
	var totalStudentCount int64
	var teacherInfo model.Teacher

	db.Model(&model.Teacher{}).Where("id = ?", teacherId).First(&teacherInfo)

	var currentWeekCourseList []SimpleCourseBookObject

	err = db.Model(&model.CourseTeacherBind{}).
		Where("teacher_id = ?", teacherId).
		Count(&teacherCourseCount).Error
	if err != nil {
		log.Error("overview-fetch total course error", err)
	}

	err = db.Model(&model.CourseBookTrans{}).Where("teacher_id = ? and lesson_date >= ?", teacherId, time.Now()).Count(&lessonUpcomingCount).Error
	if err != nil {
		log.Error("overview-fetch upcoming lession error", err)
	}

	err = db.Model(&model.CourseBookTrans{}).Where("teacher_id = ? and lesson_date < ?", teacherId, time.Now()).Count(&lessonPastCount).Error
	if err != nil {
		log.Error("overview-fetch past lession error", err)
	}

	err = db.Model(&model.CourseBookTrans{}).
		Where("teacher_id = ?", 4).
		Select("DISTINCT user_id").
		Count(&totalStudentCount).Error

	if err != nil {
		log.Error("overview-fetch Count distinct user_id error:", err)
	}

	currentWeekStart, currentWeekEnd := utils.GetCurrentWeekRange()
	err = db.Table("course_book_trans as b").
		Select(`b.id as book_id, b.booking_no as book_no, b.lesson_date, b.start_time, b.end_time, 
			b.course_id, c.name as course_name, b.teacher_id, b.user_id`).
		Joins("LEFT JOIN course_info c ON b.course_id = c.id").
		Where("b.teacher_id = ? AND b.lesson_date >= ? AND b.lesson_date <= ?", teacherId, currentWeekStart, currentWeekEnd).
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
		UpdatedTeacher      TeacherResponse          `json:"updated_teacher"`
	}{
		MyCourseCount:       teacherCourseCount,
		LessonUpcomingCount: lessonUpcomingCount,
		LessonPastCount:     lessonPastCount,
		TotalStudentCount:   totalStudentCount,
		CurrentWeekCourses:  currentWeekCourseList,
		UpdatedTeacher: TeacherResponse{
			ID:        teacherInfo.ID,
			Email:     teacherInfo.Email,
			Name:      teacherInfo.Name,
			AddTime:   teacherInfo.AddTime,
			TeacherNo: teacherInfo.TeacherNo,
			Avatar:    teacherInfo.Avatar,
			Status:    teacherInfo.Status,
		},
	}
	c.JSON(http.StatusOK, res)
}

func RetrieveTeacherProfile(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var teacherInfo model.Teacher
	db.Model(&model.Teacher{}).Where("id = ?", userID).First(&teacherInfo)
	if teacherInfo.ID == 0 {
		res.Code = codes.CODE_ERR_TX
		res.Msg = "please login"
		c.JSON(http.StatusOK, res)
		return
	}

	res.Data = struct {
		TeacherNo       string `json:"teacher_no"`
		Name            string `json:"name"`
		FirstName       string `json:"first_name"`
		LastName        string `json:"last_name"`
		FirstLanguage   string `json:"first_language"`
		Email           string `json:"email"`
		NationalityID   uint64 `json:"nationality_id"`
		LivingCountryID uint64 `json:"living_country_id"`
		Introduction    string `json:"introduction"`
		Detail          string `json:"detail"`
		Avatar          string `json:"avatar"`
		PhoneCode       string `json:"phone_code"`
		Phone           string `json:"phone"`
		Status          string `json:"status"`
		InviteCode      string `json:"invite_code"`
	}{
		TeacherNo:       teacherInfo.TeacherNo,
		Name:            teacherInfo.Name,
		FirstName:       teacherInfo.FirstName,
		LastName:        teacherInfo.LastName,
		FirstLanguage:   teacherInfo.FirstLanguage,
		Email:           teacherInfo.Email,
		NationalityID:   teacherInfo.NationalityID,
		LivingCountryID: teacherInfo.LivingCountryID,
		Introduction:    teacherInfo.Introduction,
		Detail:          teacherInfo.Detail,
		PhoneCode:       teacherInfo.PhoneCode,
		Phone:           teacherInfo.Phone,
		Avatar:          teacherInfo.Avatar,
		Status:          teacherInfo.Status,
		InviteCode:      teacherInfo.InviteCode,
	}
	c.JSON(http.StatusOK, res)
}

func UpdateTeacherProfile(c *gin.Context) {
	var req UpdateTeacherProfileRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	currentTeacher, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentTeacherStr, _ := currentTeacher.(string)
	teacherID, err := strconv.ParseInt(currentTeacherStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var teacherInfo model.Teacher
	db.Model(&model.Teacher{}).Where("id = ?", teacherID).First(&teacherInfo)
	if teacherInfo.ID == 0 {
		res.Code = codes.CODE_ERR_DB_ERROR
		res.Msg = "teacher not found"
		c.JSON(http.StatusOK, res)
		return
	}

	// Update fields
	teacherInfo.Name = req.Name
	teacherInfo.FirstName = req.FirstName
	teacherInfo.LastName = req.LastName
	teacherInfo.Introduction = req.Introduction
	teacherInfo.Detail = req.Detail
	teacherInfo.FirstLanguage = req.FirstLanguage

	if len(req.Avatar) > 0 {
		teacherInfo.Avatar = req.Avatar
	}

	if req.NationalityID > 0 {
		var nationality model.DictCountry
		db.Model(&model.DictCountry{}).Where("id = ?", req.NationalityID).First(&nationality)
		if nationality.ID > 0 {
			teacherInfo.NationalityID = nationality.ID
			teacherInfo.NationalityName = nationality.Name
		}
	}

	if req.LivingCountryID > 0 {
		var livingCountry model.DictCountry
		db.Model(&model.DictCountry{}).Where("id = ?", req.LivingCountryID).First(&livingCountry)
		if livingCountry.ID > 0 {
			teacherInfo.LivingCountryID = livingCountry.ID
			teacherInfo.LivingCountryName = livingCountry.Name
		}
	}

	if err := db.Save(&teacherInfo).Error; err != nil {
		log.Error("failed to update teacher profile", err)
		res.Code = codes.CODE_ERR_DB_ERROR
		res.Msg = "failed to update profile"
		c.JSON(http.StatusOK, res)
		return
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	c.JSON(http.StatusOK, res)
}

func RetrieveTeacherCertificate(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var teacherCerts []model.TeacherCertificate
	db.Model(&model.TeacherCertificate{}).Where("teacher_id = ? and flag != ?", userID, -1).Find(&teacherCerts)

	res.Data = teacherCerts
	c.JSON(http.StatusOK, res)
}

func UpdateTeacherCertificate(c *gin.Context) {
	var req UpdateTeacherCertificateRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	currentTeacher, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentTeacherStr, _ := currentTeacher.(string)
	teacherID, err := strconv.ParseInt(currentTeacherStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var teacherInfo model.Teacher
	db.Model(&model.Teacher{}).Where("id = ?", teacherID).First(&teacherInfo)

	var teacherCert model.TeacherCertificate
	if req.ID > 0 {
		db.Model(&model.TeacherCertificate{}).Where("id = ?", req.ID).First(&teacherCert)
		if teacherCert.ID == 0 {
			res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
			res.Msg = "certificate not found"
			c.JSON(http.StatusOK, res)
			return
		}
		teacherCert.Title = req.Title
		teacherCert.Achievement = req.Achievement
		teacherCert.IssueOrg = req.IssueOrg
		teacherCert.GetDate = req.GetDate
		teacherCert.Document = req.Document
		err = db.Model(&model.TeacherCertificate{}).Where("id = ?", req.ID).Updates(&teacherCert).Error
		if err != nil {
			log.Error("save cert err", err)
		}
	} else {
		teacherCert.Title = req.Title
		teacherCert.Achievement = req.Achievement
		teacherCert.IssueOrg = req.IssueOrg
		teacherCert.GetDate = req.GetDate
		teacherCert.Document = req.Document
		teacherCert.TeacherID = teacherInfo.ID
		teacherCert.AddTime = time.Now()
		err = db.Model(&model.TeacherCertificate{}).Save(&teacherCert).Error
		if err != nil {
			log.Error("save cert err", err)
		}
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	c.JSON(http.StatusOK, res)
}

func RemoveTeacherCertificate(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	id, _ := strconv.ParseInt(c.Query("id"), 10, 64)

	db := system.GetDb()
	var teacherCert model.TeacherCertificate
	db.Model(&model.TeacherCertificate{}).Where("id = ? and teacher_id = ?", id, userID).First(&teacherCert)

	if teacherCert.ID > 0 {
		db.Model(&model.TeacherCertificate{}).Where("id = ?", id).Update("flag", -1)
	}

	c.JSON(http.StatusOK, res)
}

func TeacherBindCourse(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	course_id, _ := strconv.ParseInt(c.Query("course_id"), 10, 64)

	db := system.GetDb()
	var course model.CourseInfo
	db.Model(&model.CourseInfo{}).Where("id = ?", course_id).First(&course)

	if course.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var courseTeacherBind model.CourseTeacherBind
	err = db.Model(&model.CourseTeacherBind{}).Where("course_id = ? and teacher_id = ?", course_id, userID).First(&courseTeacherBind).Error

	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			res.Code = codes.CODE_ERR_UNKNOWN
			res.Msg = "unknown " + err.Error()
			c.JSON(http.StatusOK, res)
			return
		} else {
			courseTeacherBind.CourseID = course.ID
			courseTeacherBind.TeacherID = uint64(userID)
			err = db.Save(&courseTeacherBind).Error
			if err != nil {
				log.Error(err)
			}
		}
	}

	c.JSON(http.StatusOK, res)
}

func TeacherCourseList(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var myCourses []model.CourseInfo
	err = db.Table("course_info AS c").
		Joins("JOIN course_teacher AS ct ON ct.course_id = c.id").
		Where("ct.teacher_id = ?", userID).
		Where("c.flag != ?", -1).
		Order("c.update_time DESC").
		Scan(&myCourses).Error

	res.Data = myCourses

	c.JSON(http.StatusOK, res)
}

func TeacherUnBindCourse(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	course_id, _ := strconv.ParseInt(c.Query("course_id"), 10, 64)

	db := system.GetDb()
	var course model.CourseInfo
	db.Model(&model.CourseInfo{}).Where("id = ?", course_id).First(&course)

	if course.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var courseTeacherBind model.CourseTeacherBind
	err = db.Model(&model.CourseTeacherBind{}).Where("course_id = ? and teacher_id = ?", course_id, userID).First(&courseTeacherBind).Error

	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			res.Code = codes.CODE_ERR_UNKNOWN
			res.Msg = "unknown " + err.Error()
			c.JSON(http.StatusOK, res)
			return
		} else {
			db.Delete(&courseTeacherBind)
		}
	} else {
		db.Delete(&courseTeacherBind)
	}

	c.JSON(http.StatusOK, res)
}

func TeacherTimeSlotTemplate(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var teacherTimeslot []model.TeacherTimeSlotTemplate
	db.Model(&model.TeacherTimeSlotTemplate{}).Where("teacher_id = ?", userID).Find(&teacherTimeslot)

	res.Data = teacherTimeslot

	c.JSON(http.StatusOK, res)
}

func TeacherTimeslotTemplateUpdate(c *gin.Context) {
	var req SetTimeSlotsRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	currentTeacher, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentTeacherStr, _ := currentTeacher.(string)
	teacherID, err := strconv.ParseInt(currentTeacherStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var teacherSlots []model.TeacherTimeSlotTemplate

	err = db.Where("teacher_id = ?", teacherID).
		Delete(&model.TeacherTimeSlotTemplate{}).Error

	for _, r := range req.Slots {
		enable := false
		if r.Enable == 1 {
			enable = true
		}
		teacherSlots = append(teacherSlots, model.TeacherTimeSlotTemplate{
			TeacherID:  uint64(teacherID),
			WeekDay:    r.WeekDay,
			StartTime:  r.StartTime,
			EndTime:    r.EndTime,
			Enabled:    enable,
			UpdateTime: time.Now(),
		})
	}
	db.CreateInBatches(teacherSlots, 7)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	c.JSON(http.StatusOK, res)
}

func TeacherScheduleTimeRange(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentTeacher, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentTeacherStr, _ := currentTeacher.(string)
	teacherID, err := strconv.ParseInt(currentTeacherStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	layout := "2006-01-02"
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	startDate, err1 := time.Parse(layout, startDateStr)
	endDate, err2 := time.Parse(layout, endDateStr)

	if err1 != nil || startDate.Format(layout) != startDateStr {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "start_date must be in yyyy-MM-dd format"
		c.JSON(http.StatusOK, res)
		return
	}

	if err2 != nil || endDate.Format(layout) != endDateStr {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "end_date must be in yyyy-MM-dd format"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var total int64
	db.Model(&model.CourseBookTrans{}).
		Where("teacher_id = ? and lesson_date >= ? and lesson_date <= ?", teacherID, startDate, endDate).
		Count(&total)

	var result []model.CourseBookWithJoin

	err = db.Table("course_book_trans").
		Joins("LEFT JOIN teacher_info ON course_book_trans.teacher_id = teacher_info.id").
		Joins("LEFT JOIN course_info ON course_book_trans.course_id = course_info.id").
		Where("course_book_trans.teacher_id = ? and course_book_trans.lesson_date >= ? and course_book_trans.lesson_date <= ?", teacherID, startDateStr, endDateStr).
		Select("course_book_trans.*, teacher_info.name AS teacher_name, course_info.name AS course_name").
		Order("lesson_date, start_time ASC").
		Scan(&result).Error
	if err != nil {
		log.Error(err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = result
	c.JSON(http.StatusOK, res)
}

func AddCourse(c *gin.Context) {
	var req AddCourseRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	currentTeacher, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentTeacherStr, _ := currentTeacher.(string)
	teacherID, err := strconv.ParseInt(currentTeacherStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	newCourse := model.CourseInfo{
		Name:          req.Name,
		Introduction:  req.Introduction,
		Detail:        req.Detail,
		Language:      req.Language,
		Level:         req.Level,
		CostPrice:     req.CostPrice,
		DisplayPrice:  req.DisplayPrice,
		Goal:          req.Goal,
		UpdateTime:    time.Now(),
		AddTime:       time.Now(),
		Flag:          0,
		Duration:      req.Duration,
		CoursePicture: req.CoursePicture,
		SessionNumber: req.SessionNumber,
		Status:        "000",
	}

	db := system.GetDb()
	err = db.Save(&newCourse).Error

	if err != nil {
		log.Error("save course info fail", err)
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = "save course info failed"
		c.JSON(http.StatusOK, res)
		return
	}

	courseTeacher := model.CourseTeacherBind{
		CourseID:  newCourse.ID,
		TeacherID: uint64(teacherID),
		Score:     0,
	}

	db.Save(&courseTeacher)

	c.JSON(http.StatusOK, res)
}

func TeacherGetMeetingInfo(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	btidStr := c.Query("btid")
	btid, err := strconv.ParseInt(btidStr, 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "course meeting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var bookTran model.CourseBookTrans
	err = db.Model(&model.CourseBookTrans{}).Where("id = ? and teacher_id = ?", btid, userID).First(&bookTran).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	// 解析字符串成 time.Time
	lessonDate := bookTran.LessonDate
	lessonDateStr := lessonDate.Format("2006-01-02")
	log.Info(lessonDateStr)

	// 当前日期，只保留年月日部分
	today := time.Now().Format("2006-01-02")
	todayTime, _ := time.Parse("2006-01-02", today)

	if lessonDateStr != today {
		// 比较日期
		if lessonDate.Before(todayTime) {
			res.Code = codes.CODE_ERR_METHOD_UNSUPPORT
			res.Msg = "course date already passed"
			c.JSON(http.StatusOK, res)
			return
		} else if lessonDate.After(todayTime) {
			res.Code = codes.CODE_ERR_METHOD_UNSUPPORT
			res.Msg = "course not starting"
			c.JSON(http.StatusOK, res)
			return
		}
	}

	bridgeMeeting := fmt.Sprintf("%s%d_%s_%d", "langbridge", bookTran.UcID, bookTran.BookingNo, bookTran.ID)

	//roomURI := fmt.Sprintf("https://meet.jit.si/%s_%s_%d", "langbridge", bookTran.BookingNo, bookTran.ID)
	roomURI := GenerateRoomName(bridgeMeeting)

	var courseLog model.CourseLogRecord
	db.Model(&model.CourseLogRecord{}).Where("book_id = ?", bookTran.ID).First(&courseLog)

	if courseLog.ID == 0 {
		courseLog.AddTime = time.Now()
		courseLog.BookID = bookTran.ID
		courseLog.MeetingURI = roomURI
		courseLog.StartFrom = "T"
		db.Model(&model.CourseLogRecord{}).Save(&courseLog)
	}

	var courseInfo model.CourseInfo
	var teacherInfo model.Teacher
	db.Model(&model.CourseInfo{}).Where("id = ?", bookTran.CourseID).First(&courseInfo)
	db.Model(&model.Teacher{}).Where("id = ?", bookTran.TeacherID).First(&teacherInfo)
	db.Model(&model.CourseBookTrans{}).Where("id = ?", bookTran.ID).Update("ongoing", 1)
	var studentInfo model.UserMember
	err = db.Table("user_member as um").
		Joins("JOIN user_course as uc ON um.id = uc.student_id").
		Where("uc.id = ?", bookTran.UcID).Scan(&studentInfo).Error

	token, err := utils.GenerateJWT(bookTran.LessonDate, 24*time.Hour)
	if err != nil {
		log.Error(err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		MeetingURI    string `json:"meeting_uri"`
		BookID        uint64 `json:"book_id"`
		CourseName    string `json:"course_name"`
		CourseDetail  string `json:"course_detail"`
		CourseID      uint64 `json:"course_id"`
		TeacherName   string `json:"teacher_name"`
		TeacherID     uint64 `json:"teacher_id"`
		TeacherDetail string `json:"teacher_detail"`
		LessonDate    string `json:"lesson_date"`
		StartTime     string `json:"start_time"`
		EndTime       string `json:"end_time"`
		Token         string `json:"token"`
		StudentID     uint64 `json:"student_id"`
		StudentName   string `json:"student_name"`
	}{
		MeetingURI:    roomURI,
		BookID:        bookTran.ID,
		CourseName:    courseInfo.Name,
		CourseID:      courseInfo.ID,
		CourseDetail:  courseInfo.Detail,
		TeacherName:   teacherInfo.Name,
		TeacherID:     teacherInfo.ID,
		TeacherDetail: teacherInfo.Detail,
		LessonDate:    bookTran.LessonDate.Format("2006-01-02"),
		StartTime:     bookTran.StartTime,
		EndTime:       bookTran.EndTime,
		Token:         token,
		StudentID:     studentInfo.ID,
		StudentName:   studentInfo.Name,
	}
	c.JSON(http.StatusOK, res)
}

func TeacherGetMeetingEnd(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	btidStr := c.Query("btid")
	btid, err := strconv.ParseInt(btidStr, 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "course meeting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var bookTran model.CourseBookTrans
	err = db.Model(&model.CourseBookTrans{}).Where("id = ? and teacher_id = ?", btid, userID).First(&bookTran).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var courseLog model.CourseLogRecord
	db.Model(&model.CourseLogRecord{}).Where("book_id = ?", bookTran.ID).First(&courseLog)

	if courseLog.ID > 0 && courseLog.EndTime == nil {
		now := time.Now()
		courseLog.EndTime = &now
		courseLog.EndFrom = "T"
		err = db.Model(&model.CourseLogRecord{}).Where("id = ?", courseLog.ID).Updates(&courseLog).Error
		if err != nil {
			log.Error(err)
		}
	}
	db.Model(&model.CourseBookTrans{}).Where("id = ?", bookTran.ID).Update("ongoing", 2)

	c.JSON(http.StatusOK, res)
}

func GenerateRoomName(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])[:32] // 可选：截取前32位，已经足够唯一
}

func TeacherCourseGetHistories(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	teacherID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	pageNo, _ := strconv.ParseInt(c.Query("pn"), 10, 64)
	pageSize, _ := strconv.ParseInt(c.Query("ps"), 10, 64)

	if pageNo <= 0 {
		pageNo = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	db := system.GetDb()

	var total int64
	db.Model(&model.CourseBookTrans{}).
		Where("user_id = ?", teacherID).
		Count(&total)

	totalPages := (total + pageSize - 1) / pageSize

	var result []model.CourseBookWithJoin

	err = db.Table("course_book_trans").
		Joins("JOIN course_log_record clr on clr.book_id = course_book_trans.id").
		Joins("LEFT JOIN teacher_info ON course_book_trans.teacher_id = teacher_info.id").
		Joins("LEFT JOIN course_info ON course_book_trans.course_id = course_info.id").
		Where("course_book_trans.teacher_id = ?", teacherID).
		Select("course_book_trans.*, teacher_info.name AS teacher_name, course_info.name AS course_name").
		Order("lesson_date, start_time DESC").
		Offset(int((pageNo - 1)) * int(pageSize)).
		Limit(int(pageSize)).
		Scan(&result).Error
	if err != nil {
		log.Error(err)
	}

	res.Data = gin.H{
		"list":        result,
		"pn":          pageNo,
		"ps":          pageSize,
		"total":       total,
		"total_pages": totalPages,
	}
	c.JSON(http.StatusOK, res)
}

func TeacherCourseFetchDetail(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	userCourseId, _ := strconv.ParseInt(c.Query("uc_id"), 10, 64)

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	teacherID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var userCourse model.CourseBookTrans
	db.Model(&model.CourseBookTrans{}).Where("id = ?", userCourseId).First(&userCourse)

	if userCourse.TeacherID != uint64(teacherID) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Can not find course you taught, please check"
		c.JSON(http.StatusOK, res)
		return
	}

	var course model.CourseInfo
	err = db.Model(&model.CourseInfo{}).Where("id = ?", userCourse.CourseID).First(&course).Error
	if err != nil {
		log.Error("[Course] fetch detail err", err)
	}

	var bookTrans []model.CourseBookTrans
	db.Model(&model.CourseBookTrans{}).Where("uc_id = ?", userCourse.ID).Find(&bookTrans)
	var courseBooked []CourseBookedTran
	for _, r := range bookTrans {
		courseBooked = append(courseBooked, CourseBookedTran{
			BookingNo:  r.BookingNo,
			TeacherID:  r.TeacherID,
			CourseID:   r.CourseID,
			UserID:     r.UserID,
			LessonDate: r.LessonDate,
			StartTime:  r.StartTime,
			EndTime:    r.EndTime,
			Status:     r.Status,
			Ongoing:    r.Ongoing,
		})
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = CourseWithJoinStatus{
		CourseInfo:       course,
		UcID:             userCourse.ID,
		Joined:           true,
		JoinTime:         userCourse.AddTime,
		UserCourseStatus: userCourse.Status,
		BookedTrans:      courseBooked,
	}
	c.JSON(http.StatusOK, res)
}

func TeacherCourseGetReview(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	teacherID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	btidStr := c.Query("btid")
	btid, err := strconv.ParseInt(btidStr, 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "course spec invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var bookTran model.CourseBookTrans
	err = db.Model(&model.CourseBookTrans{}).Where("id = ? and teacher_id = ?", btid, teacherID).First(&bookTran).Error

	if err != nil {
		log.Error("fetch course info error", err)
	}

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var reviews []model.CourseReview
	db.Model(&model.CourseReview{}).Where("book_id = ? and teacher_id = ?", bookTran.ID, teacherID).Order("add_time DESC").Find(&reviews)

	res.Data = reviews
	c.JSON(http.StatusOK, res)
}

func TeacherCourseAddReview(c *gin.Context) {
	var req CourseReviewAddRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if len(req.Comment) == 0 || len(req.Comment) > 500 {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "Comment should not be empty, and less than 500 chars"
		c.JSON(http.StatusOK, res)
		return
	}
	if req.Rate < 0 || req.Rate > 5 {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "Rate should be between 0 to 5"
		c.JSON(http.StatusOK, res)
		return
	}

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	teacherID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	btidStr := c.Query("btid")
	btid, err := strconv.ParseInt(btidStr, 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "course meeting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var bookTran model.CourseBookTrans
	err = db.Model(&model.CourseBookTrans{}).Where("id = ? and teacher_id = ?", btid, teacherID).First(&bookTran).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var review = model.CourseReview{
		BookID:    bookTran.ID,
		TeacherID: uint64(teacherID),
		UserID:    bookTran.UserID,
		Comment:   req.Comment,
		Rate:      int(req.Rate),
		AddTime:   time.Now(),
		Direction: 2,
		Flag:      0,
	}
	db.Save(&review)

	c.JSON(http.StatusOK, res)
}

func TeacherEmailSend(c *gin.Context) {
	var req EmailSendRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userId, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "Invalid email format"
		c.JSON(http.StatusOK, res)
		return
	}

	err = utils.SendVerifyCodeMail(req.Email, string(codes.VerificationSortTeacher))
	if err != nil {
		log.Error("send email err", err)
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = "send email failed"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var userInfo model.Teacher

	db.Model(&model.Teacher{}).Where("id = ?", userId).First(&userInfo)
	if userInfo.Status == "20" && req.Email == userInfo.Email {
		res.Code = codes.CODE_ERR_REPEAT
		res.Msg = "unverified email or change email needs reverify"
		c.JSON(http.StatusOK, res)
		return
	}
	c.JSON(http.StatusOK, res)
}

func TeacherEmailCheck(c *gin.Context) {
	var req EmailCheckRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "Invalid email format"
		c.JSON(http.StatusOK, res)
		return
	}

	if len(req.Code) != 6 || !regexp.MustCompile(`^\d{6}$`).MatchString(req.Code) {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "Code must be a 6-digit number"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var userInfo model.Teacher
	db.Model(&model.Teacher{}).Where("id = ?", userID).First(&userInfo)

	if userInfo.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "user record not existed"
		c.JSON(http.StatusOK, res)
		return
	}

	if req.Email != userInfo.Email {
		// change email check
		var existEmailuser model.Teacher
		err = db.Model(&model.Teacher{}).Where("email = ?", req.Email).First(&existEmailuser).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			res.Code = codes.CODE_ERR_UNKNOWN
			res.Msg = "user email check error"
			log.Error("query user email err", err)
			c.JSON(http.StatusOK, res)
			return
		}
		if err == nil {
			res.Code = codes.CODE_ERR_EXIST_OBJ
			res.Msg = "Email already registered"
			c.JSON(http.StatusOK, res)
			return
		}
		userInfo.Email = req.Email
	}

	var verifyProcess model.VerificationProcess
	db.Model(&model.VerificationProcess{}).
		Where("target = ? and code = ? and type = ? and sort = ?", req.Email, req.Code, codes.VerificationTypeEmail, codes.VerificationSortTeacher).
		First(&verifyProcess)
	if verifyProcess.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "verification code not sent"
		c.JSON(http.StatusOK, res)
		return
	}

	if time.Now().After(verifyProcess.AddTime.Add(time.Duration(verifyProcess.ValidatePeriod) * time.Second)) {
		res.Code = codes.CODE_ERR_REQ_EXPIRED
		res.Msg = "verification code expired"
		c.JSON(http.StatusOK, res)
		return
	}

	userInfo.Status = "20"
	db.Save(&userInfo)
	verifyProcess.Status = "100"
	db.Save(&verifyProcess)
	c.JSON(http.StatusOK, res)
}

func TeacherCourseMeetingNodeAdd(c *gin.Context) {
	var req CourseMeetingNoteAddRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if len(req.Note) == 0 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please enter note"
		c.JSON(http.StatusOK, res)
		return
	}

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var bookTran model.CourseBookTrans
	err = db.Model(&model.CourseBookTrans{}).Where("id = ? and teacher_id = ?", req.BtID, userID).First(&bookTran).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var studentInfo model.UserMember
	err = db.Table("user_member as um").
		Joins("JOIN user_course as uc ON um.id = uc.student_id").
		Where("uc.id = ?", bookTran.UcID).Scan(&studentInfo).Error

	var note = model.CourseMeetingNote{
		BtID:      bookTran.ID,
		UserID:    bookTran.UserID,
		TeacherID: bookTran.TeacherID,
		StudentID: studentInfo.ID,
		Note:      req.Note,
		AddTime:   time.Now(),
		Source:    "1",
	}
	db.Save(&note)

	c.JSON(http.StatusOK, res)
}

func TeacherCourseMeetingNodeFetch(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	btidStr := c.Query("btid")
	btid, err := strconv.ParseInt(btidStr, 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "course meeting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var notes []model.CourseMeetingNote
	err = db.Model(&model.CourseMeetingNote{}).Where("bt_id = ? and teacher_id = ? and source = ?", btid, userID, 1).Order("add_time DESC").Find(&notes).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	type NoteResponse struct {
		ID      uint64    `json:"id"`
		Note    string    `json:"note"`
		AddTime time.Time `json:"add_time"`
	}
	var retData []NoteResponse
	for _, r := range notes {
		retData = append(retData, NoteResponse{
			ID:      r.ID,
			Note:    r.Note,
			AddTime: r.AddTime,
		})
	}
	res.Data = retData

	c.JSON(http.StatusOK, res)
}

func TeacherTrialLessonFetch(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var trialLessons []model.TrialLesson

	db.Model(&model.TrialLesson{}).Where("teacher_id = ?", userID).Order("apply_time DESC").Find(&trialLessons)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = trialLessons

	c.JSON(http.StatusOK, res)
}

func TeacherTrialLessonAssign(c *gin.Context) {
	var req request.TrialLessonAssignRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var trialLesson model.TrialLesson

	db.Model(&model.TrialLesson{}).Where("id = ? and teacher_id = ?", req.ID, userID).First(&trialLesson)

	if trialLesson.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Trial lesson not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var updatesMap = map[string]interface{}{
		"apply_time": &req.ApplyTime,
		"status":     common.TrialLessonWaitingConfirm,
	}
	err = db.Model(&model.TrialLesson{}).Where("id = ?", req.ID).Updates(updatesMap).Error
	if err != nil {
		log.Error(err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func TeacherTrialLessonMeeting(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	tlIdStr, exist := c.GetQuery("trial_id")
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select trial lesson to confirm"
		c.JSON(http.StatusOK, res)
		return
	}
	trialId, err := strconv.ParseInt(tlIdStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select trial lesson to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var trialLesson model.TrialLesson

	db.Model(&model.TrialLesson{}).Where("id = ? and teacher_id = ?", trialId, userID).Order("apply_time DESC").Find(&trialLesson)
	if trialLesson.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Please select trial lesson to confirm"
		c.JSON(http.StatusOK, res)
		return
	}
	if trialLesson.Status != common.TrialLessonConfirmed {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "Status invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	now := time.Now()
	start := trialLesson.ApplyTime.Add(-30 * time.Minute)
	end := trialLesson.ApplyTime.Add(2 * time.Hour)

	if !(now.After(start) && now.Before(end)) {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "Time expired"
		c.JSON(http.StatusOK, res)
		return
	}

	var teacherInfo model.Teacher
	var userInfo model.UserInfo
	db.Model(&model.Teacher{}).Where("id = ?", trialLesson.TeacherID).First(&teacherInfo)
	db.Model(&model.UserInfo{}).Where("id = ?", trialLesson.UserID).First(&userInfo)

	bridgeMeeting := fmt.Sprintf("%s%d_%d_%d", "langbridge", trialLesson.ID, teacherInfo.ID, userInfo.ID)
	roomURI := GenerateRoomName(bridgeMeeting)
	type TrialMeeting struct {
		TrialID     uint64    `json:"trial_id"`
		MeetingURI  string    `json:"meeting_uri"`
		CourseName  string    `json:"course_name"`
		TeacherName string    `json:"teacher_name"`
		StudentName string    `json:"student_name"`
		ApplyTime   time.Time `json:"apply_time"`
		CurrentRole string    `json:"c_r"`
	}

	retObj := TrialMeeting{
		TrialID:     trialLesson.ID,
		MeetingURI:  roomURI,
		CourseName:  "Trial Lesson",
		TeacherName: teacherInfo.Name,
		StudentName: userInfo.Name,
		ApplyTime:   *trialLesson.ApplyTime,
		CurrentRole: "1",
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = retObj

	c.JSON(http.StatusOK, res)
}

func TeacherLeaveList(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	teacherId, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	pageNo, _ := strconv.ParseInt(c.Query("pn"), 10, 64)
	pageSize, _ := strconv.ParseInt(c.Query("ps"), 10, 64)

	if pageNo <= 0 {
		pageNo = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	db := system.GetDb()

	var total int64
	db.Table("course_book_leave cl").
		Joins("JOIN course_book_trans ct ON cl.book_id = ct.id").
		Where("ct.teacher_id = ?", teacherId).
		Count(&total)

	totalPages := (total + pageSize - 1) / pageSize

	type CourseLeaveRich struct {
		model.CourseBookLeave
		UserID     uint64 `gorm:"column:user_id" json:"user_id"`
		UserName   string `gorm:"column:user_name" json:"user_name"`
		LessonDate string `gorm:"column:lesson_date" json:"lesson_date"`
		StartTime  string `gorm:"column:start_time" json:"start_time"`
		EndTime    string `gorm:"column:end_time" json:"end_time"`
		CourseID   uint64 `gorm:"column:course_id" json:"course_id"`
		CourseName string `gorm:"column:course_name" json:"course_name"`
	}
	var leaveList []CourseLeaveRich

	db.Table("course_book_leave cl").
		Joins("JOIN course_book_trans ct ON cl.book_id = ct.id").
		Joins("JOIN course_info c ON ct.course_id = c.id").
		Joins("JOIN user_info user ON ct.user_id = user.id").
		Where("ct.teacher_id = ?", teacherId).
		Select("cl.*, user.id AS user_id, user.name AS user_name, ct.lesson_date AS lesson_date, ct.start_time AS start_time, ct.end_time AS end_time, c.id AS course_id, c.name AS course_name").
		Offset(int((pageNo - 1)) * int(pageSize)).
		Limit(int(pageSize)).
		Scan(&leaveList)

	if err != nil {
		log.Error(err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = gin.H{
		"list":        leaveList,
		"pn":          pageNo,
		"ps":          pageSize,
		"total":       total,
		"total_pages": totalPages,
	}

	c.JSON(http.StatusOK, res)
}

func TeacherLeaveConfirm(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	teacherId, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	leaveIdStr, exist := c.GetQuery("leave_id")
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select pending leave to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	leaveId, err := strconv.ParseUint(leaveIdStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select pending leave to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var leaveObj model.CourseBookLeave
	var bookTran model.CourseBookTrans
	db.Model(&model.CourseBookLeave{}).Where("id = ?", leaveId).First(&leaveObj)
	if leaveObj.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Leave request not found"
		c.JSON(http.StatusOK, res)
		return
	}
	db.Model(&model.CourseBookTrans{}).Where("id = ?", leaveObj.BookID).First(&bookTran)
	if bookTran.TeacherID != uint64(teacherId) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Leave request not found, please check data again"
		c.JSON(http.StatusOK, res)
		return
	}

	if leaveObj.Status != common.BookLeaveStatusApply {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "Have already handled this leave request"
		c.JSON(http.StatusOK, res)
		return
	}
	if bookTran.Status != common.BookTransStatusRequestLeave {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "Student might withdraw this request"
		c.JSON(http.StatusOK, res)
		return
	}

	leaveObj.Status = common.BookLeaveStatusComfirmed
	db.Updates(&leaveObj)
	bookTran.Status = common.BookTransStatusNormal
	bookTran.LessonDate = leaveObj.PendingDate
	bookTran.StartTime = leaveObj.PendingStartTime
	bookTran.EndTime = leaveObj.PendingEndTime
	db.Updates(&bookTran)

	var teacherInfo model.Teacher
	var userInfo model.UserInfo
	var courseInfo model.CourseInfo
	db.Model(&model.Teacher{}).Where("id = ?", bookTran.TeacherID).First(&teacherInfo)
	db.Model(&model.UserInfo{}).Where("id = ?", bookTran.UserID).First(&userInfo)
	db.Model(&model.CourseInfo{}).Where("id = ?", bookTran.CourseID).First(&courseInfo)

	utils.SendLeaveResultToUserMail(userInfo.Email, teacherInfo.Name, courseInfo.Name,
		leaveObj.PendingDate.Format("2006-01-02"),
		leaveObj.PendingStartTime, leaveObj.PendingEndTime, "Accepted",
		fmt.Sprintf("Hi, I've accepted the lesson change from %s %s-%s to %s %s-%s, please noted this update",
			leaveObj.OriginalDate.Format("2006-01-02"), leaveObj.OriginalStartTime, leaveObj.OriginalEndTime, leaveObj.PendingDate.Format("2006-01-02"), leaveObj.PendingStartTime, leaveObj.PendingEndTime))

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func TeacherLeaveReject(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("teacher_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	teacherId, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	leaveIdStr, exist := c.GetQuery("leave_id")
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select pending leave to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	leaveId, err := strconv.ParseUint(leaveIdStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select pending leave to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var leaveObj model.CourseBookLeave
	var bookTran model.CourseBookTrans
	db.Model(&model.CourseBookLeave{}).Where("id = ?", leaveId).First(&leaveObj)
	if leaveObj.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Leave request not found"
		c.JSON(http.StatusOK, res)
		return
	}
	db.Model(&model.CourseBookTrans{}).Where("id = ?", leaveObj.BookID).First(&bookTran)
	if bookTran.TeacherID != uint64(teacherId) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Leave request not found, please check data again"
		c.JSON(http.StatusOK, res)
		return
	}

	if leaveObj.Status != common.BookLeaveStatusApply {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "Have already handled this leave request"
		c.JSON(http.StatusOK, res)
		return
	}
	if bookTran.Status != common.BookTransStatusRequestLeave {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "Student might withdraw this request"
		c.JSON(http.StatusOK, res)
		return
	}

	leaveObj.Status = common.BookLeaveStatusRejected
	db.Updates(&leaveObj)
	bookTran.Status = common.BookTransStatusNormal
	db.Updates(&bookTran)

	var teacherInfo model.Teacher
	var userInfo model.UserInfo
	var courseInfo model.CourseInfo
	db.Model(&model.Teacher{}).Where("id = ?", bookTran.TeacherID).First(&teacherInfo)
	db.Model(&model.UserInfo{}).Where("id = ?", bookTran.UserID).First(&userInfo)
	db.Model(&model.CourseInfo{}).Where("id = ?", bookTran.CourseID).First(&courseInfo)

	utils.SendLeaveResultToUserMail(userInfo.Email, teacherInfo.Name, courseInfo.Name,
		leaveObj.PendingDate.Format("2006-01-02"),
		leaveObj.PendingStartTime, leaveObj.PendingEndTime, "Declined",
		"The requested time conflicts with an existing class")

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}
