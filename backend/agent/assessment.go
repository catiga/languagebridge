package agent

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
)

type AssessmentGPTResponse struct {
	InitLevel             int         `json:"initLevel"`             // 剑桥主等级：1~5
	InitSubLevel          int         `json:"initSubLevel"`          // 子等级：1~10
	TargetLevel           int         `json:"targetLevel"`           // 用户目标主等级
	TargetSubLevel        int         `json:"targetSubLevel"`        // 用户目标子等级
	EstimatedDurationDays int         `json:"estimatedDurationDays"` // 建议学习时长（天）
	AssessmentResult      Assessment  `json:"assessmentResult"`      // 测评总结
	StudyPlan             []DailyPlan `json:"studyPlan"`             // 学习计划（按天）
}

type Assessment struct {
	Score             int               `json:"score"`
	MaxScore          int               `json:"maxScore"`
	LevelEstimate     string            `json:"levelEstimate"` // 文本说明（如“接近 Level 2 下游”）
	Strengths         []string          `json:"strengths"`
	Weaknesses        []string          `json:"weaknesses"`
	Suggestions       []string          `json:"suggestions"`
	OverallComment    string            `json:"overallComment"` // 总体评价（新增）
	WritingEvaluation WritingEvaluation `json:"writingEvaluation"`
}

type WritingEvaluation struct {
	Task1 WritingTaskScore `json:"task1"`
	Task2 WritingTaskScore `json:"task2"`
}

type WritingTaskScore struct {
	Coherence string `json:"coherence"` // 连贯性
	Grammar   string `json:"grammar"`   // 语法表现
	Score     int    `json:"score"`     // 单项评分
}

type DailyPlan struct {
	Day       int      `json:"day"`       // 第几天
	Objective string   `json:"objective"` // 当天学习目标
	Tasks     []string `json:"tasks"`     // 学习任务列表
}

// quiz gpt response
type QuizQuestion struct {
	Type        string   `json:"type"`
	Question    string   `json:"question"`
	Options     []string `json:"options"`
	Answer      string   `json:"answer"`
	Explanation string   `json:"explanation"`
}

type QuizGPTResponse struct {
	Questions []QuizQuestion `json:"questions"`
}

func CleanAndParse(raw string) (*QuizGPTResponse, error) {
	// 清理前后多余空格
	raw = strings.TrimSpace(raw)

	// 若字符串中包含 JSON code block，则提取它；否则直接尝试解析整个内容
	re := regexp.MustCompile("(?s)```json\\s*(\\{.*?\\})\\s*```")
	matches := re.FindStringSubmatch(raw)

	var jsonStr string
	if len(matches) >= 2 {
		jsonStr = matches[1]
	} else {
		jsonStr = raw
	}

	// 解析成 GPTResponse
	var parsed QuizGPTResponse
	if err := json.Unmarshal([]byte(jsonStr), &parsed); err != nil {
		return nil, fmt.Errorf("json parse error: %w", err)
	}

	return &parsed, nil
}

func ExtractJSON(raw string) (string, error) {
	raw = strings.TrimSpace(raw)

	// 优先匹配 ```json ... ``` 格式
	reJSONBlock := regexp.MustCompile("(?s)```json\\s*(\\{.*?\\}|\\$begin:math:display$.*?\\$end:math:display$)\\s*```")
	if matches := reJSONBlock.FindStringSubmatch(raw); len(matches) >= 2 {
		return matches[1], nil
	}

	// 尝试匹配 ``` ... ``` 但没有 json 标记的情况
	reCodeBlock := regexp.MustCompile("(?s)```\\s*(\\{.*?\\}|\\$begin:math:display$.*?\\$end:math:display$)\\s*```")
	if matches := reCodeBlock.FindStringSubmatch(raw); len(matches) >= 2 {
		return matches[1], nil
	}

	// 直接是 JSON（没有代码块包裹）
	if strings.HasPrefix(raw, "{") || strings.HasPrefix(raw, "[") {
		return raw, nil
	}

	return "", errors.New("no valid JSON content found")
}

func HandleAssessment(quiz *model.ExamQuizRecord) {
	var agentRecordId = quiz.AgentRecordID
	var quizString = quiz.Result

	var overview model.UserPlanOverview
	var agentRecord model.UserAgentRecord
	var db = system.GetDb()

	db.Model(&model.UserAgentRecord{}).Where("id = ?", agentRecordId).First(&agentRecord)
	if agentRecord.ID == 0 {
		return
	}

	db.Model(&model.UserPlanOverview{}).Where("id = ?", agentRecord.OverviewID).First(&overview)
	if overview.ID == 0 {
		return
	}
	if overview.Status != common.StudyPlannerOverviewStatusAIError && overview.Status != common.StudyPlannerOverviewStatusAIError {
		return
	}
	db.Model(&model.UserPlanOverview{}).Where("id = ?", overview.ID).Update("status", common.StudyPlannerOverviewStatusAIProcessing)
}
