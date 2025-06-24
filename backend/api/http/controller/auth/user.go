package auth

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
	"github.com/langbridge/backend/utils"
)

type UpdateProfileRequest struct {
	NickName        string `json:"nick_name"`
	Avatar          string `json:"avatar"`
	LivingCountryID uint64 `json:"living_country_id"`
	Phone           string `json:"phone"`
	NativeLanguage  string `json:"native_language"`
}

func Overview(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()
	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"

	currentUser, exist := c.Get("user_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var myCourseCount int64
	var lessonUpcomingCount int64
	var lessonPastCount int64

	var currentWeekCourseList []SimpleCourseBookObject

	err = db.Model(&model.UserCourse{}).
		Where("user_id = ?", userID).
		Count(&myCourseCount).Error
	if err != nil {
		log.Error("overview-fetch total course error", err)
	}

	err = db.Model(&model.CourseBookTrans{}).Where("user_id = ? and lesson_date >= ?", userID, time.Now()).Count(&lessonUpcomingCount).Error
	if err != nil {
		log.Error("overview-fetch upcoming lession error", err)
	}

	err = db.Model(&model.CourseBookTrans{}).Where("user_id = ? and lesson_date < ?", userID, time.Now()).Count(&lessonPastCount).Error
	if err != nil {
		log.Error("overview-fetch past lession error", err)
	}

	if err != nil {
		log.Error("overview-fetch Count distinct user_id error:", err)
	}

	currentWeekStart, currentWeekEnd := utils.GetCurrentWeekRange()
	err = db.Table("course_book_trans as b").
		Select(`b.id as book_id, b.booking_no as book_no, b.lesson_date, b.start_time, b.end_time, 
			b.course_id, c.name as course_name, b.teacher_id, d.name as teacher_name, b.user_id`).
		Joins("LEFT JOIN course_info c ON b.course_id = c.id").
		Joins("LEFT JOIN teacher_info d ON b.teacher_id = d.id").
		Where("b.user_id = ? AND b.lesson_date >= ? AND b.lesson_date <= ?", userID, currentWeekStart, currentWeekEnd).
		Order("b.lesson_date, b.start_time asc").
		Scan(&currentWeekCourseList).Error
	if err != nil {
		log.Error("overview-fetch week course list error", err)
	}

	res.Data = struct {
		LessonTotalCount    int64                    `json:"lesson_total_count"`
		LessonUpcomingCount int64                    `json:"lesson_upcoming_count"`
		LessonPastCount     int64                    `json:"lesson_past_count"`
		CurrentWeekCourses  []SimpleCourseBookObject `json:"current_week_courses"`
	}{
		LessonTotalCount:    lessonPastCount + lessonUpcomingCount,
		LessonUpcomingCount: lessonUpcomingCount,
		LessonPastCount:     lessonPastCount,
		CurrentWeekCourses:  currentWeekCourseList,
	}
	c.JSON(http.StatusOK, res)
}

func RetrieveProfile(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("user_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var userInfo model.UserInfo
	var userProfile model.UserProfile
	db.Model(&model.UserInfo{}).Where("id = ?", userID).First(&userInfo)
	if userInfo.ID == 0 {
		res.Code = codes.CODE_ERR_TX
		res.Msg = "please login"
		c.JSON(http.StatusOK, res)
		return
	}

	db.Model(&model.UserProfile{}).Where("user_id = ?", userInfo.ID).First(&userProfile)

	res.Data = struct {
		UserNo          string `json:"user_no"`
		Email           string `json:"email"`
		NationalityID   uint64 `json:"nationality_id"`
		LivingCountryID uint64 `json:"living_country_id"`
		NativeLanguage  string `json:"native_language"`
		Avatar          string `json:"avatar"`
		Phone           string `json:"phone"`
		NickName        string `json:"nick_name"`
	}{
		UserNo:          userInfo.UserNo,
		NickName:        userProfile.NickName,
		Email:           userInfo.Email,
		NationalityID:   userInfo.CountryID,
		LivingCountryID: userProfile.LivingCountryID,
		NativeLanguage:  userProfile.NativeLanguage,
		Avatar:          userProfile.Avatar,
		Phone:           userProfile.ContactPhone,
	}
	c.JSON(http.StatusOK, res)
}

func UpdateProfile(c *gin.Context) {
	var req UpdateProfileRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	currentUser, exist := c.Get("user_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var userInfo model.UserInfo
	db.Model(&model.UserInfo{}).Where("id = ?", userID).First(&userInfo)
	if userInfo.ID == 0 {
		res.Code = codes.CODE_ERR_TX
		res.Msg = "please login"
		c.JSON(http.StatusOK, res)
		return
	}

	var userProfile model.UserProfile
	db.Model(&model.UserProfile{}).Where("user_id = ?", userInfo.ID).First(&userProfile)

	if userProfile.ID > 0 {
		if len(req.Avatar) > 0 {
			userProfile.Avatar = req.Avatar
		}
		if len(req.NativeLanguage) > 0 {
			userProfile.NativeLanguage = req.NativeLanguage
		}
		if len(req.Phone) > 0 {
			userProfile.ContactPhone = req.Phone
		}
		if len(req.NickName) > 0 {
			userProfile.NickName = req.NickName
		}
		if req.LivingCountryID > 0 {
			var countryObj model.DictCountry
			db.Model(&model.DictCountry{}).Where("id = ?", req.LivingCountryID).First(&countryObj)
			if countryObj.ID > 0 {
				userProfile.LivingCountryCode = countryObj.PhoneCode
				userProfile.LivingCountryID = countryObj.ID
				userProfile.LivingCountryName = countryObj.Name
			}
		}
		db.Model(&model.UserProfile{}).Where("id = ?", userProfile.ID).Updates(&userProfile)
	}

	c.JSON(http.StatusOK, res)
}
