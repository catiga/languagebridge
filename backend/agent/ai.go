package agent

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// ModelType and SubModelType define supported model types
type ModelType string
type SubModelType string

const (
	ModelDeepSeek     ModelType    = "deepseek"
	ModelOpenAI       ModelType    = "openai"
	ModelDeepSeekChat SubModelType = "deepseek-chat"

	BaseDeepSeekURI string = "https://api.deepseek.com/v1"
)

// ResponseType defines how the result should be interpreted
type ResponseType string

const (
	ResponsePlainText    ResponseType = "plain_text"
	ResponseStructured   ResponseType = "structured_json"
	ResponseFunctionCall ResponseType = "function_call"
)

// PromptContext represents a prompt template
type PromptContext struct {
	PromptType     string // system, user, assistant
	GeneralContext string
	Sort           int
	Variables      map[string]string
	EnableFunc     bool
	FuncName       string
}

// AgentRequest contains all the options for a chat
type AgentRequest struct {
	apiKey       string
	Model        ModelType
	SubModel     SubModelType
	BaseURL      string
	EnableFunc   bool
	Functions    []openai.FunctionDefinition
	Messages     []openai.ChatCompletionMessage
	ResponseType ResponseType // plain_text, structured_json, function_call
	FuncName     string       // used for function call
}

// AgentResponse handles all possible responses
type AgentResponse struct {
	Content        string                 // for plain text
	StructuredJSON map[string]interface{} // for structured_json
	FunctionCall   *openai.FunctionCall   // for function_call
}

// Chat executes a chat request based on AgentRequest
func (req AgentRequest) Chat(ctx context.Context) (*AgentResponse, error) {
	if req.apiKey == "" {
		var apiKey string
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
		config.BaseURL = req.BaseURL
		if config.BaseURL == "" {
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
		tools := make([]openai.Tool, 0)
		for _, fn := range req.Functions {
			tools = append(tools, openai.Tool{
				Type:     openai.ToolTypeFunction,
				Function: &fn,
			})
		}
		chatReq.Tools = tools

		// 设置 ToolChoice（替代 FunctionCall）
		if req.FuncName != "" {
			chatReq.ToolChoice = &openai.ToolChoice{
				Type: openai.ToolTypeFunction,
				Function: openai.ToolFunction{
					Name: req.FuncName,
				},
			}
		} else {
			chatReq.ToolChoice = &openai.ToolChoice{
				Type: openai.ToolTypeFunction,
				Function: openai.ToolFunction{
					Name: "auto",
				},
			}
		}
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

// BuildMessagesFromPromptTemplates builds message list with prompt + user input
func BuildMessagesFromPromptTemplates(tpls []PromptContext, userInput string) []openai.ChatCompletionMessage {
	messages := make([]openai.ChatCompletionMessage, 0)
	for _, tpl := range tpls {
		var role string
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
		var tplContent = tpl.GeneralContext
		if len(tpl.Variables) > 0 {
			for r, k := range tpl.Variables {
				tplContent = strings.ReplaceAll(tplContent, fmt.Sprintf("{{%s}}", r), k)
			}
		}
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    role,
			Content: tplContent,
		})
	}
	// Append user's real input
	if len(userInput) > 0 {
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleUser,
			Content: userInput,
		})
	}
	return messages
}
