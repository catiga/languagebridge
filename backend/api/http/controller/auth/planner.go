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
	"github.com/langbridge/backend/utils"
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
	Status    string    `json:"status"`
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

func PullStageGoal(c *gin.Context) {
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
	studentIdStr, exist := c.GetQuery("student_id")
	var studentId = uint64(0)
	if exist {
		studentId, _ = strconv.ParseUint(studentIdStr, 10, 64)
	}

	db := system.GetDb()

	var overviewList []model.UserPlanOverview
	var taskList []model.UserPlanSchedule
	var overIds []uint64

	var sql = "user_id = ? and flag != ?"
	var params = []interface{}{userID, -1}
	if studentId > 0 {
		sql = sql + " and student_id = ?"
		params = append(params, studentId)
	}
	err = db.Model(&model.UserPlanOverview{}).Where(sql, params...).Find(&overviewList).Error
	if err != nil {
		log.Error(err)
	}
	for _, v := range overviewList {
		overIds = append(overIds, v.ID)
	}
	if len(overIds) > 0 {
		err = db.Model(&model.UserPlanSchedule{}).Where("overview_id IN ? and flag != ?", overIds, -1).Order(("start_time DESC")).Find(&taskList).Error
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
						Status:    s.Status,
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
	if overview.ID == 0 || overview.UserID != uint64(userID) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Overview not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var saveList []model.UserPlanSchedule
	if req.Repeat {
		var firstDateStr = req.ExeDate
		var endDateStr = overview.EndDate
		if _, err := time.Parse("2006-01-02", endDateStr); err != nil {
			res.Code = codes.CODE_ERR_SETTING
			res.Msg = "Can't loop task because overview end date empty"
			c.JSON(http.StatusOK, res)
			return
		}
		for {
			saveList = append(saveList, model.UserPlanSchedule{
				Content:    req.Content,
				Note:       req.Note,
				ExeDate:    firstDateStr,
				StartTime:  req.StartTime,
				EndTime:    req.EndTime,
				Duration:   req.Duration,
				Priority:   req.Priority,
				OverviewID: req.OverviewID,
				Flag:       0,
				StudentID:  0,
				AddTime:    time.Now(),
				Status:     common.StudyPlannerScheduleCreate,
			})
			if firstDateStr == endDateStr {
				break
			}
			var err error
			firstDateStr, err = utils.GetNextDate(firstDateStr)
			if err != nil {
				res.Code = codes.CODE_ERR_SETTING
				res.Msg = "Invalid repeat date sequence"
				c.JSON(http.StatusOK, res)
				return
			}
		}
	} else {
		saveList = append(saveList, model.UserPlanSchedule{
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
		})
	}

	db.CreateInBatches(&saveList, 30)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func BindStageGoal(c *gin.Context) {
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
	overviewIdStr, exist := c.GetQuery("overview_id")
	overview_id := int64(0)
	if !exist {
		res.Code = codes.CODE_ERR_PARA_EMPTY
		res.Msg = "Please select overview"
		c.JSON(http.StatusOK, res)
		return
	}
	overview_id, _ = strconv.ParseInt(overviewIdStr, 10, 64)

	studentIdStr, exist := c.GetQuery("student_id")
	studentId := uint64(0)
	if !exist {
		res.Code = codes.CODE_ERR_PARA_EMPTY
		res.Msg = "Please select student for binding"
		c.JSON(http.StatusOK, res)
		return
	}
	studentId, err = strconv.ParseUint(studentIdStr, 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_PARA_EMPTY
		res.Msg = "Please select student for binding"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var userOverView model.UserPlanOverview
	db.Model(&model.UserPlanOverview{}).Where("id = ?", overview_id).First(&userOverView)
	if userOverView.ID == 0 || userOverView.UserID != uint64(userID) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Study planner not found"
		c.JSON(http.StatusOK, res)
		return
	}

	nowStr := time.Now().Format("2006-01-02")
	if userOverView.EndDate < nowStr {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "Can not change binding for ended plan"
		c.JSON(http.StatusOK, res)
		return
	}

	var userMember model.UserMember
	db.Model(&model.UserMember{}).Where("id = ? and flag != ?", studentId, -1).First(&userMember)
	if userMember.ID == 0 || userMember.UserID != uint64(userID) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Student not found"
		c.JSON(http.StatusOK, res)
		return
	}
	db.Model(&model.UserPlanOverview{}).Where("id = ?", userOverView.ID).Update("student_id", userMember.ID)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"

	c.JSON(http.StatusOK, res)
}

func StatStageGoal(c *gin.Context) {
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
	overviewIdStr, exist := c.GetQuery("overview_id")
	overview_id := int64(0)
	if !exist {
		res.Code = codes.CODE_ERR_PARA_EMPTY
		res.Msg = "Please select overview"
		c.JSON(http.StatusOK, res)
		return
	}
	overview_id, _ = strconv.ParseInt(overviewIdStr, 10, 64)

	db := system.GetDb()

	var userOverView model.UserPlanOverview
	db.Model(&model.UserPlanOverview{}).Where("id = ?", overview_id).First(&userOverView)
	if userOverView.ID == 0 || userOverView.UserID != uint64(userID) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Study planner not found"
		c.JSON(http.StatusOK, res)
		return
	}
	var statResult []model.UserPlanSchedule
	db.Model(&model.UserPlanSchedule{}).Where("overview_id = ? and flag != ?", userOverView.ID, -1).Find(&statResult)

	type StatStruct struct {
		Create            int
		Ongoing           int
		Unfinished        int
		FullyComplete     int
		FewComplete       int
		MostlyComplete    int
		PartiallyComplete int
		LatelyComplete    int
	}
	var stat StatStruct
	for _, v := range statResult {
		switch v.Status {
		case common.StudyPlannerScheduleCreate:
			stat.Create += 1
		case common.StudyPlannerScheduleOngoing:
			stat.Ongoing += 1
		case common.StudyPlannerScheduleUnfinished:
			stat.Unfinished += 1
		case common.StudyPlannerScheduleFullyComplete:
			stat.FullyComplete += 1
		case common.StudyPlannerScheduleFewComplete:
			stat.FewComplete += 1
		case common.StudyPlannerScheduleMostlyComplete:
			stat.MostlyComplete += 1
		case common.StudyPlannerSchedulePartiallyComplete:
			stat.PartiallyComplete += 1
		case common.StudyPlannerScheduleLatelyComplete:
			stat.LatelyComplete += 1
		}
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = stat

	c.JSON(http.StatusOK, res)
}

func UpdateStageTask(c *gin.Context) {
	var req request.UpdateStageTaskRequest
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
	var stageTask model.UserPlanSchedule
	db.Model(&model.UserPlanSchedule{}).Where("id = ?", req.ID).First(&stageTask)
	if stageTask.ID == 0 || stageTask.Flag == -1 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Task not found or be deleted"
		c.JSON(http.StatusOK, res)
		return
	}
	db.Model(&model.UserPlanOverview{}).Where("id = ?", stageTask.OverviewID).First(&overview)
	if overview.UserID != uint64(userID) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Task not found or be deleted"
		c.JSON(http.StatusOK, res)
		return
	}
	if !common.StatusCheck(req.Status) {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select the correct status"
		c.JSON(http.StatusOK, res)
		return
	}

	var note string = stageTask.Note
	if len(note) == 0 {
		note = req.Note
	} else {
		note = stageTask.Note + "\n" + req.Note
	}
	var updatesMap map[string]interface{} = map[string]interface{}{
		"status": req.Status,
		"note":   note,
	}
	db.Model(&model.UserPlanSchedule{}).Where("id = ?", stageTask.ID).Updates(updatesMap)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func DeleteStageTask(c *gin.Context) {
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
	idStr, exist := c.GetQuery("id")
	id := int64(0)
	if !exist {
		res.Code = codes.CODE_ERR_PARA_EMPTY
		res.Msg = "Please select task for deleting"
		c.JSON(http.StatusOK, res)
		return
	}
	id, _ = strconv.ParseInt(idStr, 10, 64)

	db := system.GetDb()
	var overview model.UserPlanOverview
	var stageTask model.UserPlanSchedule
	db.Model(&model.UserPlanSchedule{}).Where("id = ?", id).First(&stageTask)
	if stageTask.ID == 0 || stageTask.Flag == -1 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Task not found or be deleted"
		c.JSON(http.StatusOK, res)
		return
	}
	db.Model(&model.UserPlanOverview{}).Where("id = ?", stageTask.OverviewID).First(&overview)
	if overview.UserID != uint64(userID) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Task not found or be deleted"
		c.JSON(http.StatusOK, res)
		return
	}

	db.Model(&model.UserPlanSchedule{}).Where("id = ?", id).Update("flag", -1)
	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}
