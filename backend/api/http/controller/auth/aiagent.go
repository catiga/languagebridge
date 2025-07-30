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

var levelMap = map[int]string{
	1: "Beginner (KET Level, Grades 1–4)",
	2: "Intermediate (PET Level, Grades 5–8)",
	3: "TOEFL Junior (Middle School Focus)",
	4: "IELTS Practice (Advanced/High School)",
}

func convertPromptContext(tpls []model.PromptContext, vmap map[string]string) []agent.PromptContext {
	var result []agent.PromptContext
	if len(tpls) > 0 {
		for _, r := range tpls {
			var vars []string
			json.Unmarshal([]byte(r.PromptVariables), &vars)
			var varmap map[string]string = make(map[string]string)
			if len(vars) > 0 {
				for _, v := range vars {
					if ok, exist := vmap[v]; exist {
						varmap[v] = ok
					}
				}
			}
			var enableFunc bool = false
			var funcName string = ""
			if len(r.FuncName) > 0 {
				enableFunc = true
				funcName = r.FuncName
			}
			result = append(result, agent.PromptContext{
				PromptType:     r.PromptType,
				GeneralContext: r.GeneralContext,
				Sort:           r.Sort,
				Variables:      varmap,
				EnableFunc:     enableFunc,
				FuncName:       funcName,
			})
		}
	}
	return result
}

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

	messages := agent.BuildMessagesFromPromptTemplates(convertPromptContext(tpls, nil), req.Content)
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
	vmap["level"] = levelMap[req.Level]
	vmap["min_question_count"] = "20"

	messages := agent.BuildMessagesFromPromptTemplates(convertPromptContext(tpls, vmap), "")
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
		Input:         levelMap[req.Level],
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

	messages := agent.BuildMessagesFromPromptTemplates(convertPromptContext(tpls, vmap), "")
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
