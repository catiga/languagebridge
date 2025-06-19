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

type MemberFormRequest struct {
	ID          uint64 `json:"id"`
	Name        string `json:"name"`
	Email       string `json:"email"`
	RelType     string `json:"rel_type"`
	RelDesc     string `json:"rel_desc"`
	Gender      int    `json:"gender"`
	Birthday    string `json:"birthday"`
	Personality string `json:"personality"`
	Character   string `json:"character"`
}

func FetchMemberList(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("user_id")

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
	var memberList []model.UserMember

	db.Model(&model.UserMember{}).Where("user_id = ? and flag != ?", userID, -1).Find(&memberList)

	res.Data = memberList
	c.JSON(http.StatusOK, res)
}

func FetchMemberAdd(c *gin.Context) {
	var req MemberFormRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	currentUser, exist := c.Get("user_id")

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
	var member model.UserMember

	if req.ID > 0 {
		db.Model(&model.UserMember{}).Where("user_id = ? and flag != ?", userID, -1).First(&member)
	}

	if member.ID > 0 {
		member.Name = req.Name
		member.Birthday = req.Birthday
		member.Character = req.Character
		member.Email = req.Email
		member.Gender = req.Gender
		member.Personality = req.Personality
		member.RelDesc = req.RelDesc
		member.RelType = req.RelType
		member.UpdateTime = time.Now()

		db.Model(&model.UserMember{}).Where("id = ?", member.ID).Updates(&member)
	} else {
		member.Name = req.Name
		member.Birthday = req.Birthday
		member.Character = req.Character
		member.Email = req.Email
		member.Gender = req.Gender
		member.Personality = req.Personality
		member.RelDesc = req.RelDesc
		member.RelType = req.RelType
		member.UpdateTime = time.Now()
		member.AddTime = time.Now()
		member.UserID = uint64(userID)
		member.Flag = 0
		db.Model(&model.UserMember{}).Save(&member)
	}

	res.Data = member
	c.JSON(http.StatusOK, res)
}
