package auth

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/api/http/request"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/service"
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

func TrialLessonConfirm(c *gin.Context) {
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

	tlIdStr, exist := c.GetQuery("trial_id")
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select trial lesson to confirm"
		c.JSON(http.StatusOK, res)
		return
	}
	trialId, err := strconv.ParseInt(tlIdStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select trial lesson to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var trialLesson model.TrialLesson

	db.Model(&model.TrialLesson{}).Where("id = ? and user_id = ?", trialId, userID).Order("apply_time DESC").Find(&trialLesson)
	if trialLesson.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Please select trial lesson to confirm"
		c.JSON(http.StatusOK, res)
		return
	}
	if trialLesson.Status != common.TrialLessonWaitingConfirm {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "Status invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	err = db.Model(&model.TrialLesson{}).Where("id = ?", trialLesson.ID).Update("status", common.TrialLessonConfirmed).Error
	if err != nil {
		log.Error(err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func TrialLessonMeeting(c *gin.Context) {
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

	tlIdStr, exist := c.GetQuery("trial_id")
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select trial lesson to confirm"
		c.JSON(http.StatusOK, res)
		return
	}
	trialId, err := strconv.ParseInt(tlIdStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select trial lesson to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var trialLesson model.TrialLesson

	db.Model(&model.TrialLesson{}).Where("id = ? and user_id = ?", trialId, userID).Order("apply_time DESC").Find(&trialLesson)
	if trialLesson.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Please select trial lesson to confirm"
		c.JSON(http.StatusOK, res)
		return
	}
	if trialLesson.Status != common.TrialLessonConfirmed {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "Status invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	now := time.Now()
	start := trialLesson.ApplyTime.Add(-30 * time.Minute)
	end := trialLesson.ApplyTime.Add(2 * time.Hour)

	if !(now.After(start) && now.Before(end)) {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "Time expired"
		c.JSON(http.StatusOK, res)
		return
	}

	var teacherInfo model.Teacher
	var userInfo model.UserInfo
	db.Model(&model.Teacher{}).Where("id = ?", trialLesson.TeacherID).First(&teacherInfo)
	db.Model(&model.UserInfo{}).Where("id = ?", trialLesson.UserID).First(&userInfo)

	bridgeMeeting := fmt.Sprintf("%s%d_%d_%d", "langbridge", trialLesson.ID, teacherInfo.ID, userInfo.ID)
	roomURI := GenerateRoomName(bridgeMeeting)
	type TrialMeeting struct {
		TrialID     uint64    `json:"trial_id"`
		MeetingURI  string    `json:"meeting_uri"`
		CourseName  string    `json:"course_name"`
		TeacherName string    `json:"teacher_name"`
		StudentName string    `json:"student_name"`
		ApplyTime   time.Time `json:"apply_time"`
		CurrentRole string    `json:"c_r"`
	}

	retObj := TrialMeeting{
		TrialID:     trialLesson.ID,
		MeetingURI:  roomURI,
		CourseName:  "Trial Lesson",
		TeacherName: teacherInfo.Name,
		StudentName: userInfo.Name,
		ApplyTime:   *trialLesson.ApplyTime,
		CurrentRole: "0",
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = retObj

	c.JSON(http.StatusOK, res)
}

func FetchTeacherAvailableDate(c *gin.Context) {
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
	_, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	teacherIdStr, exist := c.GetQuery("teacher_id")
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select course teacher to confirm"
		c.JSON(http.StatusOK, res)
		return
	}
	teacherId, err := strconv.ParseInt(teacherIdStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select course teacher to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	selectDateStr, exist := c.GetQuery("select_date")
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select target course date"
		c.JSON(http.StatusOK, res)
		return
	}

	courseIdStr, exist := c.GetQuery("course_id")
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select target course date"
		c.JSON(http.StatusOK, res)
		return
	}
	courseId, err := strconv.ParseInt(courseIdStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select course teacher to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var courseInfo model.CourseInfo
	db.Model(&model.CourseInfo{}).Where("id = ?", courseId).First(&courseInfo)

	layout := "2006-01-02"
	_, err = time.Parse(layout, selectDateStr)
	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select target course date"
		c.JSON(http.StatusOK, res)
		return
	}

	availableSlots := service.TeacherAvailableSlots(uint64(teacherId), selectDateStr, courseInfo.Duration)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = availableSlots

	c.JSON(http.StatusOK, res)
}
