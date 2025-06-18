package router

import (
	"fmt"
	"net/http"

	"github.com/gin-contrib/cors"
	general "github.com/langbridge/backend/api/http"
	"github.com/langbridge/backend/api/interceptor"
	"github.com/langbridge/backend/api/ws"
	"github.com/langbridge/backend/config"

	"github.com/gin-gonic/gin"
)

type Option func(*gin.RouterGroup)

var options = []Option{}

func Include(opts ...Option) {
	options = append(options, opts...)
}

func Init() *gin.Engine {
	Include(general.Routers)

	r := gin.New()

	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "APPID", "SIG", "TS", "VER", "REQUESTID", "XAUTH"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.GET("/index", helloHandler) //Default welcome api

	wsGroup := r.Group("/ws", interceptor.WSInterceptor())
	wsGroup.GET("chat", ws.Chat)

	apiGroup := r.Group("/spwapi", interceptor.HttpInterceptor()) // total interceptor stack
	for _, opt := range options {
		opt(apiGroup)
	}
	r.Run(fmt.Sprintf(":%d", config.GetConfig().Http.Port))
	return r
}

func helloHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Hello Language Bridge",
	})
}
