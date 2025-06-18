package home

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
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
	Name     string `json:"name" binding:"required,min=5"`
	Country  uint64 `json:"country"`
	Language string `json:"language"`
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

	if userInfo.ID == 0 {
		userInfo = model.UserInfo{
			Email:      req.Email,
			Password:   req.Password,
			Name:       req.Name,
			CountryID:  countryObj.ID,
			Language:   countryObj.LanguageCode,
			AddTime:    time.Now(),
			UpdateTime: time.Now(),
			LoginId:    "",
			UserNo:     system.GenerateUserNoNumberOnly(),
			Status:     "00", // waiting for email verification
		}
		err := db.Save(&userInfo).Error
		if err != nil {
			log.Error("create user info error: ", err)
			res.Code = codes.CODE_ERR_DB_ERROR
			res.Msg = err.Error()
			c.JSON(http.StatusOK, res)
			return
		}
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		UserNo string `json:"user_no"`
	}{
		UserNo: userInfo.UserNo,
	}
	c.JSON(http.StatusOK, res)
}
