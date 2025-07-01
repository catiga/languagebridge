package agent

import (
	"context"
	"errors"
	"fmt"

	openai "github.com/sashabaranov/go-openai"
)

// ModelType defines the supported models
type ModelType string

const (
	ModelDeepSeek ModelType = "deepseek"
	ModelOpenAI   ModelType = "openai"
)

type AgentRequest struct {
	Model     ModelType
	APIKey    string
	Prompt    string
	SystemMsg string
	BaseURL   string // Optional override for base URL
}

type AgentResponse struct {
	Content string
}

type Agent interface {
	Chat(ctx context.Context, req AgentRequest) (*AgentResponse, error)
}

// DefaultAgent is a simple implementation that supports multiple model backends
func Chat(ctx context.Context, req AgentRequest) (*AgentResponse, error) {
	if req.APIKey == "" {
		return nil, errors.New("API Key is required")
	}

	config := openai.DefaultConfig(req.APIKey)

	switch req.Model {
	case ModelDeepSeek:
		config.BaseURL = req.BaseURL
		if config.BaseURL == "" {
			config.BaseURL = "https://api.deepseek.com/v1"
		}
	case ModelOpenAI:
		// use default base
		if req.BaseURL != "" {
			config.BaseURL = req.BaseURL
		}
	default:
		return nil, fmt.Errorf("unsupported model: %s", req.Model)
	}

	client := openai.NewClientWithConfig(config)

	chatReq := openai.ChatCompletionRequest{
		Model: string(req.Model) + "-chat",
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: req.SystemMsg},
			{Role: openai.ChatMessageRoleUser, Content: req.Prompt},
		},
		Temperature: 0.7,
	}

	resp, err := client.CreateChatCompletion(ctx, chatReq)
	if err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, errors.New("no response from model")
	}

	return &AgentResponse{Content: resp.Choices[0].Message.Content}, nil
}
