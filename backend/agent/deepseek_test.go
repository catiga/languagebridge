package agent

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"

	"github.com/langbridge/backend/config"
	"github.com/langbridge/backend/log"
	"github.com/sashabaranov/go-openai"
)

func TestAgent_Chat_DeepSeek(t *testing.T) {
	_ = config.GetConfig()
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	if apiKey == "" {
		t.Fatal("DEEPSEEK_API_KEY is not set")
	}

	// 构造 Prompt 模板
	prompts := []PromptContext{
		{
			PromptType: "system",
			GeneralContext: `You are an experienced English writing teacher. When a student submits their paragraph or essay, evaluate it carefully and provide:
1. A score from 0 to 100.
2. Specific feedback on:
   - Grammar
   - Vocabulary
   - Sentence structure
   - Coherence and logic
3. Suggestions for improvement.

Be clear, encouraging, and educational. The goal is to help the student become a better English writer.`,
			Sort: 1,
		},
	}

	// 模拟用户输入
	userInput := "I'm a student in Grade 3 from Primary school, and I love English very much."

	// 构造消息
	messages := BuildMessagesFromPromptTemplates(prompts, userInput)

	// 构造请求
	req := AgentRequest{
		Model:    ModelDeepSeek,
		Messages: messages,
	}

	// 执行调用
	resp, err := req.Chat(context.Background())
	if err != nil {
		t.Fatalf("Chat failed: %v", err)
	}

	if resp == nil || resp.Content == "" {
		t.Fatal("Empty response from AI")
	}

	t.Logf("AI Response:\n%s", resp.Content)
}

func TestDeepseekCall(t *testing.T) {
	_ = config.GetConfig()
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	if apiKey == "" {
		t.Fatal("DEEPSEEK_API_KEY is not set")
	}

	config := openai.DefaultConfig(apiKey)
	config.BaseURL = "https://api.deepseek.com/v1"

	client := openai.NewClientWithConfig(config)

	req := openai.ChatCompletionRequest{
		Model: "deepseek-chat",
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: "你是一个英语老师助理。"},
			{Role: openai.ChatMessageRoleUser, Content: "帮我根据小托福课程内容，生成10道选择题并附上正确答案和讲解。"},
		},
		Temperature: 0.7,
	}

	resp, err := client.CreateChatCompletion(context.Background(), req)
	if err != nil {
		t.Fatalf("调用 DeepSeek API 失败: %v", err)
	}

	fmt.Println("AI 回复内容：\n", resp.Choices[0].Message.Content)
}

func TestDeepCall(t *testing.T) {
	_ = config.GetConfig()
	url := "https://api.deepseek.com/v1/chat/completions"
	apiKey := os.Getenv("DEEPSEEK_API_KEY")

	payload := map[string]interface{}{
		"model": "deepseek-chat",
		"messages": []map[string]string{
			{"role": "system", "content": "你是一个英语老师助理。"},
			{"role": "user", "content": "帮我根据小托福课程内容，生成10道选择题并附上正确答案和讲解。"},
		},
		"temperature": 0.7,
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}

	dataStr := string(data)
	log.Info(dataStr)

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Println(result["choices"])
}
