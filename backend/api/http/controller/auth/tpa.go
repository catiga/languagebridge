package auth

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
)

type UpdateTeacherProfileRequest struct {
	Name            string `json:"name" binding:"required,min=2"`
	FirstName       string `json:"first_name" binding:"required,min=1"`
	LastName        string `json:"last_name" binding:"required,min=1"`
	NationalityID   uint64 `json:"nationality_id"`
	LivingCountryID uint64 `json:"living_country_id"`
	Introduction    string `json:"introduction" binding:"required,min=6"`
	FirstLanguage   string `json:"first_language" binding:"required"`
	Avatar          string `json:"avatar"`
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
	var userInfo model.Teacher
	db.Model(&model.Teacher{}).Where("id = ?", userID).First(&userInfo)
	if userInfo.ID == 0 {
		res.Code = codes.CODE_ERR_TX
		res.Msg = "please login"
		c.JSON(http.StatusOK, res)
		return
	}

	var livingCountry model.DictCountry
	var nationality model.DictCountry
	if req.LivingCountryID > 0 {
		db.Model(&model.DictCountry{}).Where("id = ?", req.LivingCountryID).First(&livingCountry)
	}
	if req.NationalityID > 0 {
		db.Model(&model.DictCountry{}).Where("id = ?", req.NationalityID).First(&nationality)
	}
	if nationality.ID == 0 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please specify country code"
		c.JSON(http.StatusOK, res)
		return
	}

	userInfo.Avatar = req.Avatar
	userInfo.FirstName = req.FirstName
	userInfo.LastName = req.LastName
	userInfo.NationalityID = nationality.ID
	userInfo.NationalityName = nationality.Name
	userInfo.LivingCountryID = livingCountry.ID
	userInfo.LivingCountryName = livingCountry.Name
	userInfo.Introduction = req.Introduction
	userInfo.FirstLanguage = req.FirstLanguage

	db.Model(&model.Teacher{}).Where("id = ?", userInfo.ID).Updates(&userInfo)
	c.JSON(http.StatusOK, res)
}
