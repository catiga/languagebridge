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

func TestChatWithDeepSeek(t *testing.T) {
	_ = config.GetConfig()
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	if apiKey == "" {
		t.Fatal("请设置环境变量 DEEPSEEK_API_KEY")
	}

	req := AgentRequest{
		Model:     ModelDeepSeek,
		APIKey:    apiKey,
		SystemMsg: "你是一个英语老师助理。",
		Prompt:    "帮我根据小托福课程内容，生成10道选择题并附上正确答案和讲解。",
	}

	resp, err := Chat(context.Background(), req)
	if err != nil {
		t.Fatalf("调用失败: %v", err)
	}

	if resp == nil {
		t.Fatal("返回内容为空")
	}

	fmt.Println("AI 回复：\n", resp)
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
