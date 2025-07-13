package http

import (
	"github.com/gin-gonic/gin"

	"github.com/langbridge/backend/api/http/controller/auth"
	"github.com/langbridge/backend/api/http/controller/home"
	preauth "github.com/langbridge/backend/api/http/controller/preauth"
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
	homeGroup.GET("/teacher/fetch", home.TeacherFetchList)
	homeGroup.GET("/teacher/detail", home.TeacherFetchDetail)
	homeGroup.POST("/tpa/register", home.TeacherRegister)
	homeGroup.POST("/tpa/login", home.TeacherLogin)
	homeGroup.POST("/contact", home.SendSystemMessage)
	homeGroup.POST("/preauth/get_msg", preauth.GetAuthMsg)
	homeGroup.POST("/preauth/verify_msg", preauth.VerifyMessage)

	authGroup := e.Group("/auth", interceptor.TokenInterceptor())
	authGroup.GET("/overview", auth.Overview)
	authGroup.POST("/email/check", auth.EmailCheck)
	authGroup.POST("/email/send", auth.EmailSend)
	authGroup.POST("/profile/retrieve", auth.RetrieveProfile)
	authGroup.POST("/profile/update", auth.UpdateProfile)
	authGroup.POST("/profile/member/list", auth.FetchMemberList)
	authGroup.POST("/profile/member/add", auth.FetchMemberAdd)
	authGroup.GET("/settings/fetch", auth.FetchSettings)
	authGroup.POST("/settings/update", auth.UpdateSettings)
	authGroup.GET("/profile/member/del", auth.FetchMemberDelete)
	authGroup.GET("/course/join", auth.CourseJoin)
	authGroup.GET("/course/list", auth.CourseList)
	authGroup.GET("/course/detail", auth.CourseFetchDetail)
	authGroup.POST("/course/confirm", auth.CourseConfirm)
	authGroup.GET("/course/cancel", auth.CourseCancel)
	authGroup.GET("/course/time/list", auth.CourseTimeList)
	authGroup.GET("/course/time/range", auth.CourseTimeRange)
	authGroup.GET("/course/meeting/fetch", auth.CourseGetMeetingInfo)
	authGroup.GET("/course/review/fetch", auth.CourseGetReview)
	authGroup.POST("/course/review/add", auth.CourseAddReview)
	authGroup.GET("/course/histories", auth.CourseGetHistories)
	authGroup.POST("/course/meeting/note/add", auth.CourseMeetingNodeAdd)
	authGroup.GET("/course/meeting/note/fetch", auth.CourseMeetingNodeFetch)

	authGroup.POST("/security/check", auth.SecurityCheck)
	authGroup.POST("/security/set", auth.SecuritySet)

	authGroup.POST("/aiagent/selfassessment", auth.SelfAssessment)
	authGroup.POST("/aiagent/selfassessment/exam/generate", auth.SelfAssessmentExam)
	authGroup.POST("/aiagent/selfassessment/exam/mark", auth.SelfAssessmentExamMark)
	authGroup.GET("/aiagent/exam/history", auth.ExamRecordHistorical)

	authGroup.POST("/planner/add", auth.CreateStageGoal)
	authGroup.GET("/planner/pull", auth.PullStageGoal)
	authGroup.GET("/planner/stat", auth.StatStageGoal)
	authGroup.GET("/planner/bind", auth.BindStageGoal)
	authGroup.POST("/planner/task/add", auth.AddStageTask)
	authGroup.POST("/planner/task/update", auth.UpdateStageTask)
	authGroup.GET("/planner/task/delete", auth.DeleteStageTask)

	teacherAuthGroup := e.Group("/tpa/auth", interceptor.TeacherTokenInterceptor())
	teacherAuthGroup.GET("/overview", auth.TeacherOverview)
	teacherAuthGroup.GET("/profile/retrieve", auth.RetrieveTeacherProfile)
	teacherAuthGroup.POST("/profile/update", auth.UpdateTeacherProfile)
	teacherAuthGroup.GET("/certificate/retrieve", auth.RetrieveTeacherCertificate)
	teacherAuthGroup.POST("/certificate/update", auth.UpdateTeacherCertificate)
	teacherAuthGroup.GET("/certificate/del", auth.RemoveTeacherCertificate)
	teacherAuthGroup.GET("/course/bind", auth.TeacherBindCourse)
	teacherAuthGroup.GET("/course/mine", auth.TeacherCourseList)
	teacherAuthGroup.POST("/course/add", auth.AddCourse)
	teacherAuthGroup.GET("/course/unbind", auth.TeacherUnBindCourse)
	teacherAuthGroup.GET("/course/meeting/fetch", auth.TeacherGetMeetingInfo)

	teacherAuthGroup.POST("/course/meeting/note/add", auth.TeacherCourseMeetingNodeAdd)
	teacherAuthGroup.GET("/course/meeting/note/fetch", auth.TeacherCourseMeetingNodeFetch)

	teacherAuthGroup.GET("/timeslot/retrieve", auth.TeacherTimeSlotTemplate)
	teacherAuthGroup.POST("/timeslot/update", auth.TeacherTimeslotTemplateUpdate)
	teacherAuthGroup.GET("/schedule/time/range", auth.TeacherScheduleTimeRange)
	teacherAuthGroup.GET("/course/detail", auth.TeacherCourseFetchDetail)
	teacherAuthGroup.GET("/course/histories", auth.TeacherCourseGetHistories)
	teacherAuthGroup.GET("/course/review/fetch", auth.TeacherCourseGetReview)
	teacherAuthGroup.POST("/course/review/add", auth.TeacherCourseAddReview)
	teacherAuthGroup.POST("/email/check", auth.TeacherEmailCheck)
	teacherAuthGroup.POST("/email/send", auth.TeacherEmailSend)

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
