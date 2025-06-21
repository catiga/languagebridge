package http

import (
	"github.com/gin-gonic/gin"

	"github.com/langbridge/backend/api/http/controller/auth"
	"github.com/langbridge/backend/api/http/controller/home"
	"github.com/langbridge/backend/api/interceptor"
)

func Routers(e *gin.RouterGroup) {

	homeGroup := e.Group("/")
	homeGroup.GET("/public", home.Public)
	homeGroup.GET("/public/countries", home.PublicCountries)
	homeGroup.GET("/welcome", home.Welcome)
	homeGroup.POST("/register", home.Register)
	homeGroup.POST("/login", home.Login)
	homeGroup.GET("/course/fetch", home.CourseFetchList)
	homeGroup.GET("/course/detail", home.CourseFetchDetail)
	homeGroup.GET("/course/teachers", home.CourseFetchTeacherList)
	homeGroup.GET("/course/reviews", home.CourseFetchReviewList)
	homeGroup.GET("/course/teacher/slots", home.CourseFetchTeacherTimeSlot)

	authGroup := e.Group("/auth", interceptor.TokenInterceptor())
	authGroup.POST("/profile/retrieve", auth.RetrieveProfile)
	authGroup.POST("/profile/update", auth.UpdateProfile)
	authGroup.POST("/profile/member/list", auth.FetchMemberList)
	authGroup.POST("/profile/member/add", auth.FetchMemberAdd)
	authGroup.GET("/profile/member/del", auth.FetchMemberDelete)
	authGroup.GET("/course/join", auth.CourseJoin)
	authGroup.GET("/course/list", auth.CourseList)
	authGroup.POST("/course/confirm", auth.CourseConfirm)
	authGroup.GET("/course/time/list", auth.CourseTimeList)
	authGroup.GET("/course/time/range", auth.CourseTimeRange)
	authGroup.GET("/course/meeting/fetch", auth.CourseGetMeetingInfo)

	// homeGroup.GET("/search/:key", home.Search)
	// homeGroup.POST("/trans/quote", auth.Quote)
	// preAuthGroup := e.Group("/preauth")
	// preAuthGroup.POST("get_msg", preauth.GetAuthMsg)
	// preAuthGroup.POST("verify_msg", preauth.VerifyMessage)

	// authGroup.POST("ref_uri", auth.Ref)
	// authGroup.POST("/ref/stat", auth.RefCount)
	// authGroup.POST("/ref/list", auth.RefList)
	// authGroup.POST("/daily/checkin", auth.DailyCheckin)
	// authGroup.GET("/daily/checkin", auth.DailyCheckinRecord)

	// authGroup.POST("/trans/swap", auth.Trans)
	// authGroup.POST("/trans/signed", auth.Notify)

	// authGroup.POST("/asset/board", auth.AssetView)
	// authGroup.POST("/asset/list", auth.AssetList)
	// authGroup.POST("/asset/trans", auth.AssetTrans)

	// v2Group := e.Group("/v2")
	// v2Group.POST("index", homev2.UpdateLeaderboard)
	// v2Group.GET("/k/:chain/:ca", homev2.K)
	// v2Group.GET("/token/holders/:chain/:ca", homev2.TokenHolders)
	// v2Group.GET("/search/:key", homev2.Search)
	// v2Group.GET("/token/:chain/:ca", homev2.TokenInfoV2)

	// v2Group.GET("/pair/:chain/:ca", homev2.PairFlowV2)
	// v2Group.GET("/token/:chain/newlist", homev2.TokenNewList)

	// v2Group.GET("/token/chgs/:chain/:ca", homev2.TokenChgV2)
	// v2AuthGroup := v2Group.Group("/auth", interceptor.TokenInterceptor())
	// v2AuthGroup.GET("/asset-token/trans", authv2.AssetTokenTrans)
	// v2AuthGroup.GET("/asset/list", authv2.AssetList)

	// log.Info(preAuthGroup, authGroup)
}
