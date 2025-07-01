package auth

import (
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
	"github.com/sashabaranov/go-openai"
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
	log.Info("userID:", userID)

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

	messages := agent.BuildMessagesFromPromptTemplates(convertPromptContext(tpls), req.Content)
	messages = append(messages, openai.ChatCompletionMessage{
		Role:    "user",
		Content: "Please evaluate the sentence above as my writing.",
	})
	agentReq := agent.AgentRequest{
		Model:    agent.ModelDeepSeek,
		Messages: messages,
	}

	// 调用 Agent
	agentResp, err := agentReq.Chat(c.Request.Context())
	if err != nil {
		res.Code = codes.CODE_ERR_GPT_COMPLETE
		res.Msg = "AI agent failed: " + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = gin.H{
		"user_input": req.Content,
		"ai_reply":   agentResp.Content,
	}
	c.JSON(http.StatusOK, res)
}

func convertPromptContext(tpls []model.PromptContext) []agent.PromptContext {
	var result []agent.PromptContext
	if len(tpls) > 0 {
		for _, r := range tpls {
			result = append(result, agent.PromptContext{
				PromptType:     r.PromptType,
				GeneralContext: r.GeneralContext,
				Sort:           r.Sort,
			})
		}
	}
	return result
}
