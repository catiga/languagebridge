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

type UserPlanScheduleResponse struct {
	ID        uint64    `json:"id"`
	StudentID uint64    `json:"student_id"`
	ExeDate   string    `json:"exe_date"`
	StartTime string    `json:"start_time"`
	EndTime   string    `json:"end_time"`
	Duration  int       `json:"duration"`
	Priority  int       `json:"priority"`
	Content   string    `json:"content"`
	Note      string    `json:"note"`
	AddTime   time.Time `json:"add_time"`
}

type UserPlanOverviewResponse struct {
	ID          uint64                     `json:"id"`
	StudentID   uint64                     `json:"student_id"`
	Title       string                     `json:"title"`
	Description string                     `json:"description"`
	Goal        string                     `json:"goal"`
	AddTime     time.Time                  `json:"add_time"`
	StartDate   string                     `json:"start_date"`
	EndDate     string                     `json:"end_date"`
	Tasks       []UserPlanScheduleResponse `json:"tasks"`
}

func CreateStageGoal(c *gin.Context) {
	var req request.CreatePlannerStageGoalRequest
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

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	endDate, err := time.Parse("2006-01-02", req.EndDate)

	now := time.Now().Truncate(24 * time.Hour)
	today := time.Date(
		now.Year(), now.Month(), now.Day(),
		0, 0, 0, 0, now.Location(),
	)

	if startDate.Before(today) {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "stage date setting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	if startDate.After(endDate) {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "stage date setting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	m := model.UserPlanOverview{
		Title:       req.Title,
		Description: req.Description,
		UserID:      uint64(userID),
		Goal:        req.Goal,
		AddTime:     time.Now(),
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Flag:        0,
		StudentID:   0,
	}
	db.Save(&m)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func PulltageGoal(c *gin.Context) {
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

	var overviewList []model.UserPlanOverview
	var taskList []model.UserPlanSchedule
	var overIds []uint64
	err = db.Model(&model.UserPlanOverview{}).Where("user_id = ? and flag != ?", userID, -1).Find(&overviewList).Error
	if err != nil {
		log.Error(err)
	}
	for _, v := range overviewList {
		overIds = append(overIds, v.ID)
	}
	if len(overIds) > 0 {
		err = db.Model(&model.UserPlanSchedule{}).Where("overview_id IN ? and flag != ?", overIds, -1).Find(&taskList).Error
		if err != nil {
			log.Error(err)
		}
	}

	var retOverviewList []UserPlanOverviewResponse
	for _, v := range overviewList {
		var taskDataSub []UserPlanScheduleResponse
		if len(taskList) > 0 {
			for _, s := range taskList {
				if v.ID == s.OverviewID {
					taskDataSub = append(taskDataSub, UserPlanScheduleResponse{
						ID:        s.ID,
						StudentID: s.StudentID,
						ExeDate:   s.ExeDate,
						StartTime: s.StartTime,
						EndTime:   s.EndTime,
						Duration:  s.Duration,
						Priority:  s.Priority,
						Content:   s.Content,
						Note:      s.Note,
						AddTime:   s.AddTime,
					})
				}
			}
		}
		retOverviewList = append(retOverviewList, UserPlanOverviewResponse{
			ID:          v.ID,
			StudentID:   v.StudentID,
			Title:       v.Title,
			Description: v.Description,
			Goal:        v.Goal,
			AddTime:     v.AddTime,
			StartDate:   v.StartDate,
			EndDate:     v.EndDate,
			Tasks:       taskDataSub,
		})
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = retOverviewList

	c.JSON(http.StatusOK, res)
}

func AddStageTask(c *gin.Context) {
	var req request.AddStageTaskRequest
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

	db := system.GetDb()

	var overview model.UserPlanOverview
	db.Model(&model.UserPlanOverview{}).Where("id = ?", req.OverviewID).First(&overview)
	if overview.UserID != uint64(userID) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Overview not found"
		c.JSON(http.StatusOK, res)
		return
	}

	m := model.UserPlanSchedule{
		Content:    req.Content,
		Note:       req.Note,
		ExeDate:    req.ExeDate,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
		Duration:   req.Duration,
		Priority:   req.Priority,
		OverviewID: req.OverviewID,
		Flag:       0,
		StudentID:  0,
		AddTime:    time.Now(),
	}
	db.Save(&m)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}
