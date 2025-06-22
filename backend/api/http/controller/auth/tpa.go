package auth

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
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
	CostPrice     decimal.Decimal `json:"cost_price" binding:"required"`
	DisplayPrice  decimal.Decimal `json:"display_price" binding:"required"`
	Goal          string          `json:"goal" binding:"required"`
	Duration      int             `json:"duration" binding:"required"`
	SessionNumber int             `json:"session_number" binding:"required"`
	CoursePicture string          `json:"course_picture" binding:"required"`
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
