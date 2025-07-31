package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
	"github.com/langbridge/backend/utils"
	"github.com/shopspring/decimal"
)

var LevelMap = map[int]string{
	1: "Beginner (KET Level, Grades 1–4)",
	2: "Intermediate (PET Level, Grades 5–8)",
	3: "TOEFL Junior (Middle School Focus)",
	4: "IELTS Practice (Advanced/High School)",
}

func ConvertPromptContext(tpls []model.PromptContext, vmap map[string]string) []PromptContext {
	var result []PromptContext
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
			result = append(result, PromptContext{
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

func HandleAssessment(quiz *model.ExamQuizRecord) error {
	var agentRecordId = quiz.AgentRecordID
	var quizString = quiz.Result

	var overview model.UserPlanOverview
	var agentRecord model.UserAgentRecord

	var db = system.GetDb()

	db.Model(&model.UserAgentRecord{}).Where("id = ?", agentRecordId).First(&agentRecord)
	if agentRecord.ID == 0 {
		return errors.New("agent record not found")
	}

	db.Model(&model.UserPlanOverview{}).Where("id = ?", agentRecord.OverviewID).First(&overview)
	if overview.ID == 0 {
		return errors.New("overview not found")
	}
	if overview.Status != common.StudyPlannerOverviewStatusAIError && overview.Status != common.StudyPlannerOverviewStatusAIProcessing {
		return errors.New("overview status is not ai error or ai processing")
	}
	db.Model(&model.UserPlanOverview{}).Where("id = ?", overview.ID).Update("status", common.StudyPlannerOverviewStatusAIProcessing)

	categoryPath := "goal/assessment/evaluate"
	categoryLevel := "free"
	var tpls []model.PromptContext
	db.Model(&model.PromptContext{}).Where("category_path = ? and category_level = ?", categoryPath, categoryLevel).Find(&tpls)

	if len(tpls) == 0 {
		return errors.New("prompt context not found")
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

	var vmap map[string]string = make(map[string]string)
	vmap["target_level"] = LevelMap[overview.TargetLevel]
	vmap["goal_title"] = overview.Goal
	vmap["goal_term"] = overview.GoalPeriodType
	vmap["description"] = overview.Description
	vmap["age"] = age
	vmap["test_submission_json"] = quizString

	messages := BuildMessagesFromPromptTemplates(ConvertPromptContext(tpls, vmap), "")
	if len(messages) == 0 {
		return errors.New("messages not found")
	}
	agentReq := AgentRequest{
		Model:    ModelDeepSeek,
		Messages: messages,
	}

	agentResp, err := agentReq.Chat(context.Background())
	if err != nil {
		return err
	}

	jsonContent, err := ExtractJSON(agentResp.Content)
	if err != nil {
		return err
	}

	// 将responseData转换为AssessmentGPTResponse
	var assessment AssessmentGPTResponse
	if err := json.Unmarshal([]byte(jsonContent), &assessment); err != nil {
		return fmt.Errorf("failed to unmarshal assessment response: %w", err)
	}

	// 更新UserPlanOverview的状态和初始等级
	updates := map[string]interface{}{
		"status":     common.StudyPlannerOverviewStatusAIComplete,
		"init_level": assessment.InitLevel,
	}
	if err := db.Model(&model.UserPlanOverview{}).Where("id = ?", overview.ID).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update overview: %w", err)
	}

	// 创建ExamQuizAssessment记录
	assessmentRecord := model.ExamQuizAssessment{
		AddTime:               time.Now(),
		OverviewID:            overview.ID,
		QuizRecordID:          quiz.ID,
		UserID:                overview.UserID,
		StudentID:             overview.StudentID,
		InitLevel:             assessment.InitLevel,
		InitSubLevel:          assessment.InitSubLevel,
		EstimatedDurationDays: assessment.EstimatedDurationDays,
		AssessScore:           decimal.NewFromInt(int64(assessment.AssessmentResult.Score)),
		AssessMaxScore:        decimal.NewFromInt(int64(assessment.AssessmentResult.MaxScore)),
		AssessLevelEstimate:   assessment.AssessmentResult.LevelEstimate,
		AssessOverAllComment:  assessment.AssessmentResult.OverallComment,
		AssessStrengths:       strings.Join(assessment.AssessmentResult.Strengths, "|"),
		AssessWeaknesses:      strings.Join(assessment.AssessmentResult.Weaknesses, "|"),
		AssessSuggestions:     strings.Join(assessment.AssessmentResult.Suggestions, "|"),
		AssessWritingEvaluation: func() string {
			if jsonData, err := json.Marshal(assessment.AssessmentResult.WritingEvaluation); err == nil {
				return string(jsonData)
			}
			return ""
		}(),
	}

	// 序列化学习计划
	if studyPlanJson, err := json.Marshal(assessment.StudyPlan); err == nil {
		assessmentRecord.StudyPlanTpl = string(studyPlanJson)
	}

	// 保存评估记录
	if err := db.Save(&assessmentRecord).Error; err != nil {
		return fmt.Errorf("failed to save assessment record: %w", err)
	}

	db.Model(&model.UserPlanOverview{}).Where("id = ?", overview.ID).Update("status", common.StudyPlannerOverviewStatusAIComplete)

	return nil
}
