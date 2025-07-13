package auth

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/api/http/request"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
)

func TrialLessonFetch(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var trialLessons []model.TrialLesson

	db.Model(&model.TrialLesson{}).Where("user_id = ?", userID).Order("apply_time DESC").Find(&trialLessons)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = trialLessons

	c.JSON(http.StatusOK, res)
}

func TrialLessonApply(c *gin.Context) {
	var req request.TrialLessonApplyRequest
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	if req.CourseID == 0 || req.TeacherID == 0 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please choose course and teacher"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var trialLesson model.TrialLesson

	db.Model(&model.TrialLesson{}).Where("user_id = ? and teacher_id = ?", userID, req.TeacherID).First(&trialLesson)

	if trialLesson.ID > 0 {
		res.Code = codes.CODE_ERR_REPEAT
		res.Msg = "Already listened to trial lesson on selected teacher"
		c.JSON(http.StatusOK, res)
		return
	}

	trialLesson = model.TrialLesson{
		UserID:    uint64(userID),
		TeacherID: req.TeacherID,
		CourseID:  req.CourseID,
		AddTime:   time.Now(),
		Status:    common.TrialLessonCreate,
		Comment:   "",
		Rate:      0,
	}
	err = db.Save(&trialLesson).Error
	if err != nil {
		log.Error(err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}
