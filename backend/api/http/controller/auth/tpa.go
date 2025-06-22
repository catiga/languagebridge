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
