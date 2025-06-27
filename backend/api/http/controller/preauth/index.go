package controller

import (
	"errors"
	"fmt"
	"net/http"
	"sync"
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

const DEFAULT_MSG = "Welcome to LangBridge"

var loginInLock sync.Map

type AuthRequestKey struct {
	AuthKey string `json:"auth_key" binding:"required,min=5"`
	Chain   string `json:"chain"`
}
type VerifyAuthRequest struct {
	ID    uint64 `json:"id"`
	Sign  string `json:"sign"`
	Chain string `json:"chain"`
	Ref   string `json:"ref"`
}

func GetAuthMsg(c *gin.Context) {
	var req AuthRequestKey
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var authObj model.AuthMessage
	err := db.Model(&model.AuthMessage{}).
		Where("auth_key = ? and expire_time > ?", req.AuthKey, time.Now()).
		Order("create_time desc").
		First(&authObj).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if authObj.ID == 0 {
		authObj = model.AuthMessage{
			AuthKey:    req.AuthKey,
			AuthMsg:    DEFAULT_MSG,
			Chain:      req.Chain,
			CreateTime: time.Now(),
			ExpireTime: time.Now().Add(5 * time.Minute),
			Nonce:      system.GenerateNonce(10),
		}
		err := db.Save(&authObj).Error
		if err != nil {
			log.Error("create auth msg error: ", err)
		}
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		ID      uint64 `json:"id"`
		Message string `json:"message"`
	}{
		ID:      authObj.ID,
		Message: authObj.Format(),
	}
	c.JSON(http.StatusOK, res)
}

func VerifyMessage(c *gin.Context) {
	var req VerifyAuthRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var authObj model.AuthMessage
	err := db.Model(&model.AuthMessage{}).
		Where("id = ?", req.ID).
		First(&authObj).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
			res.Msg = "record not found"
			c.JSON(http.StatusOK, res)
			return
		}
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if authObj.ExpireTime.Before(time.Now()) {
		res.Code = codes.CODE_ERR_REQ_EXPIRED
		res.Msg = "request expired"
		c.JSON(http.StatusOK, res)
		return
	}

	// start to verify message
	if !authObj.ComputeAuthDigest(req.Sign) {
		res.Code = codes.CODE_ERR_SIG_COMMON
		res.Msg = "invalid sign"
		c.JSON(http.StatusOK, res)
		return
	}

	_, loaded := loginInLock.LoadOrStore(authObj.ID, struct{}{})
	defer func() {
		loginInLock.Delete(authObj.ID)
	}()
	if loaded {
		res.Code = codes.CODE_ERR_PROCESSING
		res.Msg = "operating, please do not repeat the operation"
		c.JSON(http.StatusOK, res)
		return
	}

	var existWallet model.UserWallet
	err = db.Model(&model.UserWallet{}).Where("wallet = ?", authObj.AuthKey).First(&existWallet).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Error("query wallet error: ", authObj.AuthKey, err)
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = "system error"
		c.JSON(http.StatusOK, res)
		return
	}
	var userInfo model.UserInfo
	if existWallet.ID == 0 {
		// create user_id
		userInfo = model.UserInfo{
			AddTime:    time.Now(),
			UpdateTime: time.Now(),
			Status:     "00",
			UserNo:     system.GenerateUserNoNumberOnly(),
		}
		err := db.Save(&userInfo).Error
		if err != nil {
			log.Error("create user error", err)
		}
		userProfile := model.UserProfile{
			UserID:     userInfo.ID,
			UpdateTime: time.Now(),
		}
		db.Save(&userProfile)
		existWallet = model.UserWallet{
			Wallet:     authObj.AuthKey,
			Chain:      req.Chain,
			CreateTime: time.Now(),
			UserID:     userInfo.ID,
		}
		if len(req.Ref) > 0 {
			var refModel model.UserRef
			err = db.Model(&model.UserRef{}).Where("ref_code = ?", req.Ref).First(&refModel).Error
			if err == nil {
				existWallet.RefID = refModel.ID
			} else {
				log.Error("Reference-IM query by code error ", req.Ref, err)
			}
		}
		db.Save(&existWallet)
	} else {
		db.Model(&model.UserInfo{}).Where("id = ?", existWallet.UserID).First(&userInfo)
	}

	originalStr := fmt.Sprintf("%d,%s,%d", userInfo.ID, userInfo.UserNo, time.Now().Unix())
	token, err := security.Encrypt([]byte(originalStr))

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
