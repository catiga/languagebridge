package agent

import (
	"context"
	"errors"
	"fmt"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

// ModelType defines the supported models
type ModelType string
type SubModelType string

const (
	ModelDeepSeek     ModelType    = "deepseek"
	ModelOpenAI       ModelType    = "openai"
	ModelDeepSeekChat SubModelType = "deepseek-chat"

	BaseDeepSeekURI string = "https://api.deepseek.com/v1"
)

// PromptContext represents a template from DB
// You can place this in model package if needed
type PromptContext struct {
	PromptType     string // system, user, assistant
	GeneralContext string
	Sort           int
}

type AgentRequest struct {
	apiKey     string
	Model      ModelType
	SubModel   SubModelType
	BaseURL    string                         // Optional override for base URL
	EnableFunc bool                           // Enable function call in future
	Functions  []openai.FunctionDefinition    // Future: support function calling
	Messages   []openai.ChatCompletionMessage // Full messages including prompt templates + user input
}

type AgentResponse struct {
	Content string
}

type Agent interface {
	Chat(ctx context.Context, req AgentRequest) (*AgentResponse, error)
}

// Chat routes the request to the proper model implementation
func (req AgentRequest) Chat(ctx context.Context) (*AgentResponse, error) {
	if req.apiKey == "" {
		var apiKey string = ""
		if req.Model == ModelDeepSeek {
			apiKey = os.Getenv("DEEPSEEK_API_KEY")
		} else if req.Model == ModelOpenAI {
			apiKey = os.Getenv("CHATGPT_API_KEY")
		}
		req.apiKey = apiKey
	}
	if req.apiKey == "" {
		return nil, errors.New("API Key is missing")
	}

	config := openai.DefaultConfig(req.apiKey)

	var subModel SubModelType
	switch req.Model {
	case ModelDeepSeek:
		if req.BaseURL != "" {
			config.BaseURL = req.BaseURL
		} else {
			config.BaseURL = BaseDeepSeekURI
		}
		subModel = ModelDeepSeekChat
	case ModelOpenAI:
		if req.BaseURL != "" {
			config.BaseURL = req.BaseURL
		}
	default:
		return nil, fmt.Errorf("unsupported model: %s", req.Model)
	}

	client := openai.NewClientWithConfig(config)

	chatReq := openai.ChatCompletionRequest{
		Model:       string(subModel),
		Messages:    req.Messages,
		Temperature: 0.7,
	}

	if req.EnableFunc && len(req.Functions) > 0 {
		chatReq.Functions = req.Functions
	}

	resp, err := client.CreateChatCompletion(ctx, chatReq)
	if err != nil {
		return nil, fmt.Errorf("API error: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, errors.New("no response from model")
	}

	return &AgentResponse{Content: resp.Choices[0].Message.Content}, nil
}

// BuildMessagesFromPromptTemplates builds the full message list from templates and user input
func BuildMessagesFromPromptTemplates(tpls []PromptContext, userInput string) []openai.ChatCompletionMessage {
	messages := make([]openai.ChatCompletionMessage, 0)
	for _, tpl := range tpls {
		role := ""
		switch tpl.PromptType {
		case "system":
			role = openai.ChatMessageRoleSystem
		case "user":
			role = openai.ChatMessageRoleUser
		case "assistant":
			role = openai.ChatMessageRoleAssistant
		default:
			continue
		}
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    role,
			Content: tpl.GeneralContext,
		})
	}
	// Append actual user input last
	messages = append(messages, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleUser,
		Content: userInput,
	})
	return messages
}
