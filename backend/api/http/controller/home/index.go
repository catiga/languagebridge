package home

import (
	"crypto/sha256"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/security"
	"github.com/langbridge/backend/system"
	"gorm.io/gorm"
)

type HomeRequest struct {
	Chain    string `json:"chain"`
	Interval string `json:"interval"`
	Page     int    `json:"pn" binding:"required,min=1"`
	PageSize int    `json:"ps" binding:"required,min=1"`
	Type     int    `json:"type"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,min=5"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required,min=2"`
	Country  uint64 `json:"country"`
	Language string `json:"language"`
}

type LoginRequest struct {
	LoginName string `json:"login_name"`
	Password  string `json:"password"`
}

func Welcome(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()
	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func Register(c *gin.Context) {
	var req RegisterRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var userInfo model.UserInfo
	err := db.Model(&model.UserInfo{}).
		Where("email = ?", req.Email).
		First(&userInfo).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if userInfo.ID > 0 {
		res.Code = codes.CODE_ERR_EXIST_OBJ
		res.Msg = "email repeated"
		c.JSON(http.StatusOK, res)
		return
	}

	var countryObj model.DictCountry
	if req.Country > 0 {
		db.Model(&model.DictCountry{}).Where("id = ?", req.Country).First(&countryObj)
	}
	if countryObj.ID == 0 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please specify country code"
		c.JSON(http.StatusOK, res)
		return
	}

	passwordHash := fmt.Sprintf("%x", sha256.Sum256([]byte(req.Password)))

	userInfo = model.UserInfo{
		Email:      req.Email,
		Password:   passwordHash,
		Name:       req.Name,
		CountryID:  countryObj.ID,
		Language:   countryObj.LanguageCode,
		AddTime:    time.Now(),
		UpdateTime: time.Now(),
		LoginId:    "",
		UserNo:     system.GenerateUserNoNumberOnly(),
		Status:     "00", // waiting for email verification
	}
	err = db.Save(&userInfo).Error
	if err != nil {
		log.Error("create user info error: ", err)
		res.Code = codes.CODE_ERR_DB_ERROR
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}
	// create user profile
	userProfile := model.UserProfile{
		UserID:            userInfo.ID,
		LivingCountryID:   countryObj.ID,
		LivingCountryName: countryObj.Name,
		LivingCountryCode: countryObj.PhoneCode,
		UpdateTime:        time.Now(),
	}
	err = db.Save(&userProfile).Error
	log.Error("save profile error", err)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		UserNo string `json:"user_no"`
	}{
		UserNo: userInfo.UserNo,
	}
	c.JSON(http.StatusOK, res)
}

func Login(c *gin.Context) {
	var req LoginRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var userInfo model.UserInfo
	err := db.Model(&model.UserInfo{}).
		Where("(email = ? or login_id = ? or user_no = ?)", req.LoginName, req.LoginName, req.LoginName).
		First(&userInfo).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if userInfo.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "user information is not found"
		c.JSON(http.StatusOK, res)
		return
	}

	if req.Password != userInfo.Password {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "user password is incorrect"
		c.JSON(http.StatusOK, res)
		return
	}

	// if userInfo.Status != "20" {
	// 	res.Code = codes.CODE_STATUS_INVALID
	// 	res.Msg = "user status is invalid"
	// 	c.JSON(http.StatusOK, res)
	// 	return
	// }

	originalStr := fmt.Sprintf("%d,%s,%d", userInfo.ID, userInfo.UserNo, time.Now().Unix())
	token, err := security.Encrypt([]byte(originalStr))

	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "build login token failed"
		c.JSON(http.StatusOK, res)
		return
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		UserNo string `json:"user_no"`
		Email  string `json:"email"`
		Name   string `json:"name"`
		Token  string `json:"token"`
	}{
		UserNo: userInfo.UserNo,
		Email:  userInfo.Email,
		Name:   userInfo.Name,
		Token:  token,
	}
	c.JSON(http.StatusOK, res)
}

func CourseFetchList(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	pageNo, _ := strconv.ParseInt(c.Query("pn"), 10, 64)
	pageSize, _ := strconv.ParseInt(c.Query("ps"), 10, 64)

	if pageNo <= 0 {
		pageNo = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	db := system.GetDb()

	var courseList []model.CourseInfo
	var total int64

	// 统计总数
	db.Model(&model.CourseInfo{}).
		Where("status = ? AND flag != ?", "100", -1).
		Count(&total)

	// 获取当前页数据
	err := db.Model(&model.CourseInfo{}).
		Where("status = ? AND flag != ?", "100", -1).
		Order("id ASC").
		Offset(int((pageNo - 1) * pageSize)).
		Limit(int(pageSize)).
		Find(&courseList).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	totalPages := (total + pageSize - 1) / pageSize

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = gin.H{
		"list":        courseList,
		"pn":          pageNo,
		"ps":          pageSize,
		"total":       total,
		"total_pages": totalPages,
	}
	c.JSON(http.StatusOK, res)
}

func CourseFetchDetail(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	courseId, _ := strconv.ParseInt(c.Query("course_id"), 10, 64)

	db := system.GetDb()

	var course model.CourseInfo

	err := db.Model(&model.CourseInfo{}).Where("id = ?", courseId).First(&course).Error
	if err != nil {
		log.Error("[Course] fetch detail err", err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = course
	c.JSON(http.StatusOK, res)
}

func CourseFetchTeacherList(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	courseId, _ := strconv.ParseInt(c.Query("course_id"), 10, 64)

	db := system.GetDb()

	var teacherList []model.Teacher

	err := db.Table("teacher_info AS t").
		Select("t.*").
		Joins("JOIN course_teacher AS ct ON ct.teacher_id = t.id").
		Where("ct.course_id = ? and t.flag != ?", courseId, -1).
		Scan(&teacherList).Error

	if err != nil {
		log.Error("[Course] fetch teacher list err", err)
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = teacherList
	c.JSON(http.StatusOK, res)
}

func CourseFetchReviewList(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	courseId, _ := strconv.ParseInt(c.Query("course_id"), 10, 64)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = courseId
	c.JSON(http.StatusOK, res)
}
