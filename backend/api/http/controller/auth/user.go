package auth

import (
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
	"github.com/langbridge/backend/utils"
	"gorm.io/gorm"
)

type UpdateProfileRequest struct {
	NickName        string `json:"nick_name"`
	Avatar          string `json:"avatar"`
	LivingCountryID uint64 `json:"living_country_id"`
	Phone           string `json:"phone"`
	NativeLanguage  string `json:"native_language"`
}

type EmailCheckRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

type EmailSendRequest struct {
	Email string `json:"email"`
}

type UserResponse struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	LoginId   string    `gorm:"column:login_id;type:varchar(255);not null" json:"login_id"`
	Email     string    `gorm:"column:email" json:"email"`
	Name      string    `gorm:"column:name" json:"name"`
	CountryID uint64    `gorm:"column:country_id" json:"country_id"`
	Language  string    `gorm:"column:language" json:"language"`
	AddTime   time.Time `gorm:"column:add_time" json:"add_time"`
	Status    string    `gorm:"column:status" json:"status"`
	UserNo    string    `gorm:"column:user_no" json:"user_no"`
	Avatar    string    `gorm:"column:avatar" json:"avatar"`
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

	var userInfo model.UserInfo
	var userProfile model.UserProfile
	db.Model(&model.UserInfo{}).Where("id = ?", userID).First(&userInfo)
	db.Model(&model.UserProfile{}).Where("user_id = ?", userID).First(&userProfile)

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
		UpdatedUser         UserResponse             `json:"user_info"`
	}{
		LessonTotalCount:    lessonPastCount + lessonUpcomingCount,
		LessonUpcomingCount: lessonUpcomingCount,
		LessonPastCount:     lessonPastCount,
		CurrentWeekCourses:  currentWeekCourseList,
		UpdatedUser: UserResponse{
			ID:        userInfo.ID,
			LoginId:   userInfo.LoginId,
			Email:     userInfo.Email,
			Name:      userInfo.Name,
			CountryID: userInfo.CountryID,
			Language:  userInfo.Language,
			AddTime:   userInfo.AddTime,
			Status:    userInfo.Status,
			UserNo:    userInfo.UserNo,
			Avatar:    userProfile.Avatar,
		},
	}
	c.JSON(http.StatusOK, res)
}

func EmailSend(c *gin.Context) {
	var req EmailSendRequest
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
	userId, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "Invalid email format"
		c.JSON(http.StatusOK, res)
		return
	}

	err = utils.SendVerifyCodeMail(req.Email, string(codes.VerificationSortUser))
	if err != nil {
		log.Error("send email err", err)
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = "send email failed"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var userInfo model.UserInfo

	db.Model(&model.UserInfo{}).Where("id = ?", userId).First(&userInfo)
	if userInfo.Status == "20" && req.Email == userInfo.Email {
		res.Code = codes.CODE_ERR_REPEAT
		res.Msg = "unverified email or change email needs reverify"
		c.JSON(http.StatusOK, res)
		return
	}
	c.JSON(http.StatusOK, res)
}

func EmailCheck(c *gin.Context) {
	var req EmailCheckRequest
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

	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "Invalid email format"
		c.JSON(http.StatusOK, res)
		return
	}

	if len(req.Code) != 6 || !regexp.MustCompile(`^\d{6}$`).MatchString(req.Code) {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "Code must be a 6-digit number"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var userInfo model.UserInfo
	db.Model(&model.UserInfo{}).Where("id = ?", userID).First(&userInfo)

	if userInfo.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "user record not existed"
		c.JSON(http.StatusOK, res)
		return
	}

	if req.Email != userInfo.Email {
		// change email check
		var existEmailuser model.UserInfo
		err = db.Model(&model.UserInfo{}).Where("email = ?", req.Email).First(&existEmailuser).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			res.Code = codes.CODE_ERR_UNKNOWN
			res.Msg = "user email check error"
			log.Error("query user email err", err)
			c.JSON(http.StatusOK, res)
			return
		}
		if err == nil {
			res.Code = codes.CODE_ERR_EXIST_OBJ
			res.Msg = "Email already registered"
			c.JSON(http.StatusOK, res)
			return
		}
		userInfo.Email = req.Email
	}

	var verifyProcess model.VerificationProcess
	db.Model(&model.VerificationProcess{}).
		Where("target = ? and code = ? and type = ? and sort = ?", req.Email, req.Code, codes.VerificationTypeEmail, codes.VerificationSortUser).
		First(&verifyProcess)
	if verifyProcess.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "verification code not sent"
		c.JSON(http.StatusOK, res)
		return
	}

	if time.Now().After(verifyProcess.AddTime.Add(time.Duration(verifyProcess.ValidatePeriod) * time.Second)) {
		res.Code = codes.CODE_ERR_REQ_EXPIRED
		res.Msg = "verification code expired"
		c.JSON(http.StatusOK, res)
		return
	}

	userInfo.Status = "20"
	db.Save(&userInfo)
	verifyProcess.Status = "100"
	db.Save(&verifyProcess)
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
		Status          string `json:"status"`
	}{
		UserNo:          userInfo.UserNo,
		NickName:        userProfile.NickName,
		Email:           userInfo.Email,
		NationalityID:   userInfo.CountryID,
		LivingCountryID: userProfile.LivingCountryID,
		NativeLanguage:  userProfile.NativeLanguage,
		Avatar:          userProfile.Avatar,
		Phone:           userProfile.ContactPhone,
		Status:          userInfo.Status,
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

	userInfo.UpdateTime = time.Now()
	userInfo.CountryID = req.LivingCountryID
	userInfo.Name = req.NickName
	db.Save(&userInfo)

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
