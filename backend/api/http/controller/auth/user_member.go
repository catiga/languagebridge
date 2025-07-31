package auth

import (
	"crypto/sha256"
	"fmt"
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
	LoginID     string `json:"login_id"`
	Password    string `json:"password"`
}

type UserSetting struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type UserSettingRequest struct {
	Settings []UserSetting
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

	// 为每个学生添加等级信息
	type MemberWithLevel struct {
		model.UserMember
		CurrentLevel int    `json:"current_level"`
		TargetLevel  int    `json:"target_level"`
		HasGoal      bool   `json:"has_goal"`
		GoalStatus   string `json:"goal_status"`
	}

	var result []MemberWithLevel
	for _, member := range memberList {
		// 查找该学生最新的学习计划
		var overview model.UserPlanOverview
		db.Model(&model.UserPlanOverview{}).
			Where("student_id = ? and flag != ?", member.ID, -1).
			Order("add_time DESC").
			First(&overview)

		memberWithLevel := MemberWithLevel{
			UserMember:   member,
			CurrentLevel: 0, // 0表示未设置
			TargetLevel:  0, // 0表示未设置
			HasGoal:      overview.ID > 0,
			GoalStatus:   "",
		}

		if overview.ID > 0 {
			memberWithLevel.GoalStatus = overview.Status
			// 只有在AI测评完成后才显示真实的等级信息
			if overview.Status == common.StudyPlannerOverviewStatusAIComplete {
				memberWithLevel.CurrentLevel = overview.InitLevel
				memberWithLevel.TargetLevel = overview.TargetLevel
			} else {
				// AI测评未完成，只显示目标等级，当前等级显示为未测评
				memberWithLevel.CurrentLevel = 0 // 未测评
				memberWithLevel.TargetLevel = overview.TargetLevel
			}
		}

		result = append(result, memberWithLevel)
	}

	res.Data = result
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
		db.Model(&model.UserMember{}).Where("user_id = ? and flag != ? and id = ?", userID, -1, req.ID).First(&member)
	}

	if len(req.LoginID) > 0 {
		member.LoginID = req.LoginID
	}
	if len(req.Password) > 0 {
		passwordHash := fmt.Sprintf("%x", sha256.Sum256([]byte(req.Password)))
		member.Password = passwordHash
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

func FetchMemberDelete(c *gin.Context) {
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

	memberId, err := strconv.ParseInt(c.Query("member_id"), 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_PARA_EMPTY
		res.Msg = "empty member id"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var member model.UserMember

	db.Model(&model.UserMember{}).Where("user_id = ? and flag != ? and id = ?", userID, -1, memberId).First(&member)
	if member.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "member not found"
		c.JSON(http.StatusOK, res)
		return
	}

	member.Flag = -1
	member.UpdateTime = time.Now()
	db.Model(&model.UserMember{}).Where("id = ?", member.ID).Update("flag", -1)

	res.Data = member
	c.JSON(http.StatusOK, res)
}

func FetchSettings(c *gin.Context) {
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
	var settings []model.UserSetting

	db.Model(&model.UserSetting{}).Where("user_id = ?", userID).Find(&settings)

	var ret []UserSetting
	if len(settings) > 0 {
		for _, r := range settings {
			ret = append(ret, UserSetting{
				Key:   r.SpecName,
				Value: r.SpecValue,
			})
		}
	}

	res.Data = ret
	c.JSON(http.StatusOK, res)
}

func UpdateSettings(c *gin.Context) {
	var req UserSettingRequest
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

	if len(req.Settings) > 0 {
		for _, r := range req.Settings {
			updates := map[string]interface{}{
				"spec_value": r.Value,
			}
			result := db.Model(&model.UserSetting{}).Where("user_id = ? and spec_name = ?", userID, r.Key).Updates(updates)
			if result.Error == nil && result.RowsAffected == 0 {
				db.Create(&model.UserSetting{
					UserID:    uint64(userID),
					SpecName:  r.Key,
					SpecValue: r.Value,
				})
			}
		}
	}

	c.JSON(http.StatusOK, res)
}
