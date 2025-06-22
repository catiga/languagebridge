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
