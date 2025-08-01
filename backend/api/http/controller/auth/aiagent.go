package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/agent"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/api/http/request"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
	"github.com/langbridge/backend/utils"
	"github.com/sashabaranov/go-openai"
	"github.com/shopspring/decimal"
)

func SelfAssessment(c *gin.Context) {
	var req request.SelfAssessmentRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if len(req.Content) < 30 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "please input at least 30 characters"
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

	// query template for prompt context
	db := system.GetDb()
	categoryPath := "self-assessment/writing"
	categoryLevel := "free"

	var tpls []model.PromptContext
	db.Model(&model.PromptContext{}).
		Where("category_path = ? AND category_level = ? AND flag != ?", categoryPath, categoryLevel, -1).
		Order("sort ASC").
		Find(&tpls)

	if len(tpls) == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Agent service unavailable, due to internal configuration"
		c.JSON(http.StatusOK, res)
		return
	}

	messages := agent.BuildMessagesFromPromptTemplates(agent.ConvertPromptContext(tpls, nil), req.Content)
	if len(messages) == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Agent service unavailable, due to internal configuration"
		c.JSON(http.StatusOK, res)
		return
	}
	messages = append(messages, openai.ChatCompletionMessage{
		Role:    "user",
		Content: "Please evaluate the sentence above as my writing.",
	})
	agentReq := agent.AgentRequest{
		Model:    agent.ModelDeepSeek,
		Messages: messages,
	}

	agentResp, err := agentReq.Chat(c.Request.Context())
	if err != nil {
		res.Code = codes.CODE_ERR_GPT_COMPLETE
		res.Msg = "AI agent failed: " + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	examJson, err := agent.ExtractJSON(agentResp.Content)
	if err != nil {
		res.Code = codes.CODE_ERR_GPT_COMPLETE
		res.Msg = "AI agent failed: " + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}
	examRes, err := agent.CleanAndParse(examJson)
	if err != nil {
		res.Code = codes.CODE_ERR_GPT_COMPLETE
		res.Msg = "AI agent failed: " + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}
	objectForStore, err := json.Marshal(examRes)
	if err != nil {
		res.Code = codes.CODE_ERR_GPT_COMPLETE
		res.Msg = "AI agent failed: " + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}
	// insert record for user generation ai result
	ur := model.UserAgentRecord{
		AddTime:       time.Now(),
		Flag:          0,
		CategoryPath:  categoryPath,
		CategoryLevel: categoryLevel,
		Input:         req.Content,
		Result:        string(objectForStore),
		UserID:        uint64(userID),
	}
	db.Save(&ur)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = gin.H{
		"user_input": req.Content,
		"ai_reply":   agentResp.Content,
	}

	c.JSON(http.StatusOK, res)
}

func SelfAssessmentExam(c *gin.Context) {
	var req request.SelfAssessmentExamRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if req.Level < 1 || req.Level > 4 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please choose the correct level"
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

	// query template for prompt context
	db := system.GetDb()
	categoryPath := "self-assessment/exam"
	categoryLevel := "free"

	// query if there is generated data
	var generatedData model.UserAgentRecord
	db.Model(&model.UserAgentRecord{}).
		Where("user_id = ? AND category_path = ? AND category_level = ? AND DATE(add_time) = CURRENT_DATE", userID, categoryPath, categoryLevel).
		First(&generatedData)
	if generatedData.ID > 0 {
		var r agent.QuizGPTResponse
		err := json.Unmarshal([]byte(generatedData.Result), &r)
		if err != nil {
			log.Error(err)
		}
		res.Code = codes.CODE_SUCCESS
		res.Msg = "success"
		res.Data = gin.H{
			"exam_id":    generatedData.ID,
			"user_input": req.Level,
			"ai_reply":   r,
		}
		c.JSON(http.StatusOK, res)
		return
	}

	var tpls []model.PromptContext
	db.Model(&model.PromptContext{}).
		Where("category_path = ? AND category_level = ? AND flag != ?", categoryPath, categoryLevel, -1).
		Order("sort ASC").
		Find(&tpls)

	if len(tpls) == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Agent service unavailable, due to internal configuration"
		c.JSON(http.StatusOK, res)
		return
	}

	var vmap map[string]string = make(map[string]string)
	vmap["level"] = agent.LevelMap[req.Level]
	vmap["min_question_count"] = "20"

	messages := agent.BuildMessagesFromPromptTemplates(agent.ConvertPromptContext(tpls, vmap), "")
	if len(messages) == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Agent service unavailable, due to internal configuration"
		c.JSON(http.StatusOK, res)
		return
	}
	agentReq := agent.AgentRequest{
		Model:    agent.ModelDeepSeek,
		Messages: messages,
	}

	agentResp, err := agentReq.Chat(c.Request.Context())
	if err != nil {
		res.Code = codes.CODE_ERR_GPT_COMPLETE
		res.Msg = "AI agent failed: " + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	//handle content of response
	jsonContent := agentResp.Content

	responseData, err := agent.CleanAndParse(jsonContent)
	if err != nil {
		res.Code = codes.CODE_ERR_GPT_COMPLETE
		res.Msg = "AI agent complete error: " + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	responseJson, _ := agent.ExtractJSON(jsonContent)

	// insert record for user generation ai result
	ur := model.UserAgentRecord{
		AddTime:       time.Now(),
		Flag:          0,
		CategoryPath:  categoryPath,
		CategoryLevel: categoryLevel,
		Input:         agent.LevelMap[req.Level],
		Result:        responseJson,
		UserID:        uint64(userID),
	}
	db.Save(&ur)
	var uap []model.UserAgentPrompt
	for _, tpl := range tpls {
		uap = append(uap, model.UserAgentPrompt{
			PromptID:      tpl.ID,
			AgentRecordID: ur.ID,
		})
	}
	db.Save(&uap)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = gin.H{
		"exam_id":    ur.ID,
		"user_input": req.Level,
		"ai_reply":   responseData,
	}

	c.JSON(http.StatusOK, res)
}

func SelfAssessmentExamMark(c *gin.Context) {
	var req request.ExamMarkRequest
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

	// query template for prompt context
	db := system.GetDb()
	// query if there is generated data
	var recordedData model.UserAgentRecord
	err = db.Model(&model.UserAgentRecord{}).
		Where("user_id = ? AND id = ?", userID, req.ExamID).
		First(&recordedData).Error
	if err != nil {
		log.Error(err)
	}

	if recordedData.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "there is no quiz record found"
		c.JSON(http.StatusOK, res)
		return
	}

	var score = decimal.NewFromInt(0)
	var step = decimal.NewFromInt(1)
	var _100 = decimal.NewFromInt(100)
	var size = decimal.NewFromInt(int64(len(req.Questions)))
	for _, r := range req.Questions {
		if r.Correct {
			score = score.Add(step)
		}
	}

	v, e := json.Marshal(req.Questions)
	var vs string
	if e == nil {
		vs = string(v)
	}
	saveRecord := model.ExamQuizRecord{
		UserID:        uint64(userID),
		AgentRecordID: recordedData.ID,
		AddTime:       time.Now(),
		Score:         score.Div(size).Mul(_100).Round(0),
		Result:        vs,
	}
	db.Save(&saveRecord)

	// handle agent record overview data
	if recordedData.OverviewID > 0 {
		var overview model.UserPlanOverview
		db.Model(&model.UserPlanOverview{}).Where("id = ?", recordedData.OverviewID).First(&overview)
		if overview.ID > 0 {
			overview.Status = common.StudyPlannerOverviewStatusAIProcessing
			db.Save(&overview)
			go agent.HandleAssessment(&saveRecord)
		}
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func ExamRecordHistorical(c *gin.Context) {
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

	// query template for prompt context
	db := system.GetDb()
	// query if there is generated data
	var recordedData []model.UserAgentRecordHistorical

	err = db.Table("exam_quiz_record as b").
		Select(`b.score as score, b.add_time as add_time, b.agent_record_id as arid, c.category_path, c.category_level, c.input`).
		Joins("JOIN user_agent_record c ON b.agent_record_id = c.id").
		Where("b.user_id = ? AND c.category_path = ?", userID, "self-assessment/exam").
		Order("b.add_time asc").
		Scan(&recordedData).Error
	if err != nil {
		log.Error("overview-fetch week course list error", err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = recordedData

	c.JSON(http.StatusOK, res)
}

func GenerateAssessment(c *gin.Context) {
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
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select trial lesson to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	overviewId, err := strconv.ParseUint(overviewIdStr, 10, 64)

	db := system.GetDb()
	var overview model.UserPlanOverview
	db.Model(&model.UserPlanOverview{}).Where("id = ? AND user_id = ?", overviewId, userID).First(&overview)
	if overview.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "there is no overview record found"
		c.JSON(http.StatusOK, res)
		return
	}

	var age = "not sure"
	if overview.StudentID > 0 {
		var userMember model.UserMember
		db.Model(&model.UserMember{}).Where("id = ?", overview.StudentID).First(&userMember)
		if userMember.ID > 0 && len(userMember.Birthday) > 0 {
			realAge, err := utils.CalculateAge(userMember.Birthday)
			if err == nil {
				age = fmt.Sprintf("%d years old", realAge+1)
			}
		}
	}

	categoryPath := "goal/assessment/exam"
	categoryLevel := "free"

	var userAgentRecord model.UserAgentRecord
	db.Model(&model.UserAgentRecord{}).Where("overview_id = ? AND user_id = ? AND category_path = ? AND category_level = ?", overviewId, userID, categoryPath, categoryLevel).First(&userAgentRecord)
	if userAgentRecord.ID > 0 {
		responseData, err := agent.CleanAndParse(userAgentRecord.Result)
		if err != nil {
			res.Code = codes.CODE_ERR_GPT_COMPLETE
			res.Msg = "Failed to parse AI reply: " + err.Error()
			c.JSON(http.StatusOK, res)
			return
		}

		res.Code = codes.CODE_SUCCESS
		res.Msg = "success"
		res.Data = gin.H{
			"exam_id":    userAgentRecord.ID,
			"user_input": "",
			"ai_reply":   responseData,
		}
		c.JSON(http.StatusOK, res)
		return
	}

	if !utils.TryLock(overviewId, utils.CategoryOverviewAssessment) {
		res.Code = codes.CODE_ERR_REPEAT
		res.Msg = "AI is already processing your assessment. Please wait..."
		c.JSON(http.StatusOK, res)
		return
	}
	defer utils.Unlock(overviewId, utils.CategoryOverviewAssessment)

	var tpls []model.PromptContext
	db.Model(&model.PromptContext{}).
		Where("category_path = ? AND category_level = ? AND flag != ?", categoryPath, categoryLevel, -1).
		Order("sort ASC").
		Find(&tpls)

	if len(tpls) == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Agent service unavailable, due to internal configuration"
		c.JSON(http.StatusOK, res)
		return
	}

	vmap := map[string]string{
		"level":       fmt.Sprintf("%d", overview.TargetLevel),
		"goal":        overview.Goal,
		"goal_term":   overview.GoalPeriodType,
		"description": overview.Description,
		"age":         age,
	}

	messages := agent.BuildMessagesFromPromptTemplates(agent.ConvertPromptContext(tpls, vmap), "")
	if len(messages) == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Agent service unavailable, due to internal configuration"
		c.JSON(http.StatusOK, res)
		return
	}
	agentReq := agent.AgentRequest{
		Model:    agent.ModelDeepSeek,
		Messages: messages,
	}

	agentResp, err := agentReq.Chat(c.Request.Context())
	if err != nil {
		res.Code = codes.CODE_ERR_GPT_COMPLETE
		res.Msg = "AI agent failed: " + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	//handle content of response
	jsonContent := agentResp.Content

	responseData, err := agent.CleanAndParse(jsonContent)
	if err != nil {
		res.Code = codes.CODE_ERR_GPT_COMPLETE
		res.Msg = "AI agent complete error: " + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	responseJson, _ := agent.ExtractJSON(jsonContent)

	// insert record for user generation ai result
	ur := model.UserAgentRecord{
		AddTime:       time.Now(),
		Flag:          0,
		CategoryPath:  categoryPath,
		CategoryLevel: categoryLevel,
		Result:        responseJson,
		UserID:        uint64(userID),
		OverviewID:    overview.ID,
	}

	db.Save(&ur)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = gin.H{
		"exam_id":    ur.ID,
		"user_input": "",
		"ai_reply":   responseData,
	}
	c.JSON(http.StatusOK, res)
}

func EvaluateAssessment(c *gin.Context) {
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
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select study plan to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	overviewId, err := strconv.ParseUint(overviewIdStr, 10, 64)

	db := system.GetDb()
	var overview model.UserPlanOverview
	db.Model(&model.UserPlanOverview{}).Where("id = ? AND user_id = ?", overviewId, userID).First(&overview)
	if overview.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "there is no overview record found"
		c.JSON(http.StatusOK, res)
		return
	}

	if overview.Status != common.StudyPlannerOverviewStatusCreate && overview.Status != common.StudyPlannerOverviewStatusWaitingAIAssessment && overview.Status != common.StudyPlannerOverviewStatusAIError {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "all evaluation has been completed"
		c.JSON(http.StatusOK, res)
		return
	}
	db.Model(&model.UserPlanOverview{}).Where("id = ?", overviewId).Update("status", common.StudyPlannerOverviewStatusAIProcessing)

	var quizRecord model.ExamQuizRecord
	err = db.Table("exam_quiz_record eqr").Joins("JOIN user_agent_record uar ON eqr.agent_record_id = uar.id").
		Where("uar.overview_id = ?", overviewId).Select("eqr.*").Scan(&quizRecord).Error
	if err != nil {
		log.Error(err)
	}
	if quizRecord.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "there is no quiz record found"
		c.JSON(http.StatusOK, res)
		return
	}

	go func(qr *model.ExamQuizRecord, overviewId uint64) {
		log.Info("[AI] evaluate assessment start, quiz record id: ", qr.ID)
		err := agent.HandleAssessment(qr)
		if err != nil {
			db.Model(&model.UserPlanOverview{}).Where("id = ?", overview.ID).Update("status", common.StudyPlannerOverviewStatusAIError)
		}
		log.Info("[AI] evaluate assessment end, quiz record id: ", qr.ID, err)
	}(&quizRecord, overviewId)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	c.JSON(http.StatusOK, res)
}

func ViewAssessment(c *gin.Context) {
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
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select study plan to confirm"
		c.JSON(http.StatusOK, res)
		return
	}

	overviewId, err := strconv.ParseUint(overviewIdStr, 10, 64)

	db := system.GetDb()
	var overview model.UserPlanOverview
	db.Model(&model.UserPlanOverview{}).Where("id = ? AND user_id = ?", overviewId, userID).First(&overview)
	if overview.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "there is no overview record found"
		c.JSON(http.StatusOK, res)
		return
	}

	if overview.Status != common.StudyPlannerOverviewStatusAIComplete && overview.Status != common.StudyPlannerOverviewStatusOngoing && overview.Status != common.StudyPlannerOverviewStatusFinished {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "evaluation is not completed"
		c.JSON(http.StatusOK, res)
		return
	}

	var quizRecord []model.ExamQuizRecord
	err = db.Table("exam_quiz_record eqr").Joins("JOIN user_agent_record uar ON eqr.agent_record_id = uar.id").
		Where("uar.overview_id = ?", overviewId).Select("eqr.*").Scan(&quizRecord).Error
	if err != nil {
		log.Error(err)
	}
	if len(quizRecord) == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "there is no quiz record found"
		c.JSON(http.StatusOK, res)
		return
	}

	var uids []uint64
	for _, v := range quizRecord {
		uids = append(uids, v.ID)
	}

	var quizAssessment []model.ExamQuizAssessment
	db.Model(&model.ExamQuizAssessment{}).Where("quiz_record_id IN ?", uids).Find(&quizAssessment)

	for i := range quizRecord {
		for j := range quizAssessment {
			if quizRecord[i].ID == quizAssessment[j].QuizRecordID {
				quizRecord[i].Assessments = append(quizRecord[i].Assessments, quizAssessment[j])
			}
		}
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = quizRecord
	c.JSON(http.StatusOK, res)
}

func GenerateStudyPlan(c *gin.Context) {
	type GenerateStudyPlanRequest struct {
		OverviewID uint64 `json:"overview_id"`
		StartDate  string `json:"start_date"`
	}

	var req GenerateStudyPlanRequest
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
	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "invalid start date"
		c.JSON(http.StatusOK, res)
		return
	}

	if startDate.Before(time.Now()) {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "start date must be in the future"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var overview model.UserPlanOverview
	db.Model(&model.UserPlanOverview{}).Where("id = ? AND user_id = ?", req.OverviewID, userID).First(&overview)
	if overview.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "there is no overview record found"
		c.JSON(http.StatusOK, res)
		return
	}

	if overview.Status != common.StudyPlannerOverviewStatusAIComplete {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "please wait for AI assessment to complete"
		c.JSON(http.StatusOK, res)
		return
	}

	// Get the assessment data to extract study plan template
	var assessment model.ExamQuizAssessment
	db.Model(&model.ExamQuizAssessment{}).Where("overview_id = ?", req.OverviewID).First(&assessment)
	if assessment.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "assessment data not found"
		c.JSON(http.StatusOK, res)
		return
	}

	// Parse the study plan template
	var studyPlanTemplate []agent.DailyPlan
	if err := json.Unmarshal([]byte(assessment.StudyPlanTpl), &studyPlanTemplate); err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "failed to parse study plan template"
		c.JSON(http.StatusOK, res)
		return
	}

	// Calculate total weeks needed based on duration
	totalWeeks := (assessment.EstimatedDurationDays + 6) / 7 // Round up to nearest week

	// Calculate end date based on duration
	endDate := startDate.AddDate(0, 0, assessment.EstimatedDurationDays-1)
	endDateStr := endDate.Format("2006-01-02")

	// Update overview with start date, end date, and status
	overviewUpdates := map[string]interface{}{
		"start_date": req.StartDate,
		"end_date":   endDateStr,
		"status":     common.StudyPlannerOverviewStatusOngoing,
	}

	if err := db.Model(&model.UserPlanOverview{}).Where("id = ?", req.OverviewID).Updates(overviewUpdates).Error; err != nil {
		res.Code = codes.CODE_ERR_DB_ERROR
		res.Msg = "failed to update overview"
		c.JSON(http.StatusOK, res)
		return
	}

	// Generate actual study plan with dates - repeat weekly template
	var actualStudyPlan []map[string]interface{}
	var scheduleRecords []model.UserPlanSchedule
	planDay := 0

	for week := 0; week < totalWeeks; week++ {
		for i, day := range studyPlanTemplate {
			// Calculate the actual date for this day
			dayDate := startDate.AddDate(0, 0, planDay)

			// Get the day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
			dayOfWeek := int(dayDate.Weekday())
			if dayOfWeek == 0 {
				dayOfWeek = 7 // Convert Sunday from 0 to 7
			}

			// Convert day number to week number for display
			weekNumber := week + 1
			dayInWeek := i + 1

			// Create schedule record for each task in the day
			for _, task := range day.Tasks {
				// Convert priority string to int
				priority := 2 // default medium
				switch task.Priority {
				case "high":
					priority = 1
				case "low":
					priority = 3
				}

				// Create schedule record
				scheduleRecord := model.UserPlanSchedule{
					OverviewID: req.OverviewID,
					StudentID:  overview.StudentID,
					ExeDate:    dayDate.Format("2006-01-02"),
					StartTime:  "09:00", // Default start time
					EndTime:    "10:00", // Default end time
					Duration:   60,      // Default 60 minutes
					Priority:   priority,
					Content:    task.Content,
					Note:       fmt.Sprintf("Week %d, Day %d - %s", weekNumber, dayInWeek, day.Objective),
					AddTime:    time.Now(),
					Flag:       1,
					Status:     common.StudyPlannerScheduleCreate,
				}

				scheduleRecords = append(scheduleRecords, scheduleRecord)
			}

			// Prepare response data
			actualDay := map[string]interface{}{
				"week":        weekNumber,
				"day_in_week": dayInWeek,
				"date":        dayDate.Format("2006-01-02"),
				"objective":   day.Objective,
				"tasks":       day.Tasks,
				"status":      common.StudyPlannerScheduleCreate,
				"overview_id": req.OverviewID,
				"user_id":     userID,
				"student_id":  overview.StudentID,
			}
			actualStudyPlan = append(actualStudyPlan, actualDay)
			planDay++
		}
	}

	// Save all schedule records to database
	if len(scheduleRecords) > 0 {
		if err := db.Create(&scheduleRecords).Error; err != nil {
			res.Code = codes.CODE_ERR_DB_ERROR
			res.Msg = "failed to save study plan schedule"
			c.JSON(http.StatusOK, res)
			return
		}
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "study plan generated successfully"
	res.Data = map[string]interface{}{
		"study_plan":     actualStudyPlan,
		"overview_id":    req.OverviewID,
		"start_date":     req.StartDate,
		"end_date":       endDateStr,
		"total_days":     len(actualStudyPlan),
		"total_weeks":    totalWeeks,
		"template_weeks": len(studyPlanTemplate),
		"schedule_count": len(scheduleRecords),
	}
	c.JSON(http.StatusOK, res)
}

func UpdateStudyPlanTemplate(c *gin.Context) {
	type SaveStudyPlanTemplateRequest struct {
		OverviewID uint64            `json:"overview_id"`
		Template   []agent.DailyPlan `json:"template"`
	}

	var req SaveStudyPlanTemplateRequest
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
	db.Model(&model.UserPlanOverview{}).Where("id = ? AND user_id = ?", req.OverviewID, userID).First(&overview)
	if overview.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "there is no overview record found"
		c.JSON(http.StatusOK, res)
		return
	}

	// Get the assessment data to update study plan template
	var assessment model.ExamQuizAssessment
	db.Model(&model.ExamQuizAssessment{}).Where("overview_id = ?", req.OverviewID).First(&assessment)
	if assessment.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "assessment data not found"
		c.JSON(http.StatusOK, res)
		return
	}

	// Convert template to JSON string
	templateJson, err := json.Marshal(req.Template)
	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "failed to serialize template"
		c.JSON(http.StatusOK, res)
		return
	}

	// Update the study plan template
	if err := db.Model(&model.ExamQuizAssessment{}).Where("id = ?", assessment.ID).Update("study_plan_tpl", string(templateJson)).Error; err != nil {
		res.Code = codes.CODE_ERR_DB_ERROR
		res.Msg = "failed to save template"
		c.JSON(http.StatusOK, res)
		return
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "study plan template saved successfully"
	res.Data = map[string]interface{}{
		"overview_id": req.OverviewID,
		"template":    req.Template,
	}
	c.JSON(http.StatusOK, res)
}
