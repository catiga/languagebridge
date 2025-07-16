package home

import (
	"crypto/sha256"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/security"
	"github.com/langbridge/backend/system"
	"gorm.io/gorm"
)

const fixedSysInviteCode = "HelloLangBridge"

type HomeRequest struct {
	Chain    string `json:"chain"`
	Interval string `json:"interval"`
	Page     int    `json:"pn" binding:"required,min=1"`
	PageSize int    `json:"ps" binding:"required,min=1"`
	Type     int    `json:"type"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,min=5"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required,min=2"`
	Country  uint64 `json:"country"`
	Language string `json:"language"`
}

type LoginRequest struct {
	LoginName string `json:"login_name"`
	Password  string `json:"password"`
}

type StudentLoginRequest struct {
	LoginRequest
	ParentNo string `json:"parent_no"`
}

type StudentProfileResponse struct {
	ID          uint64 `json:"id"`
	Name        string `json:"name"`
	Email       string `json:"email"`
	RelType     string `json:"rel_type"`
	RelDesc     string `json:"rel_desc"`
	Gender      string `json:"gender"`
	Personality string `json:"personality"`
	Character   string `json:"character"`
	LoginID     string `json:"login_id"`
}

type TeacherRegisterRequest struct {
	Email           string `json:"email" binding:"required,min=5"`
	Password        string `json:"password" binding:"required,min=8"`
	Name            string `json:"name" binding:"required,min=2"`
	FirstName       string `json:"first_name" binding:"required,min=1"`
	LastName        string `json:"last_name"`
	NationalityID   uint64 `json:"nationality_id"`
	LivingCountryID uint64 `json:"living_country_id"`
	Introduction    string `json:"introduction" binding:"required,min=6"`
	FirstLanguage   string `json:"first_language" binding:"required"`
	TeachLanguage   string `json:"teach_language" binding:"required"`
	InviteCode      string `json:"invite_code"`
}

type TeacherCertificateResponse struct {
	Title       string `json:"title"`
	Achievement string `json:"achievement"`
	GetDate     string `json:"get_date"`
	Document    string `json:"document"`
	IssueOrg    string `json:"issue_org"`
}

type TeacherResponse struct {
	ID                uint64                       `json:"id"`
	Name              string                       `json:"name"`
	FirstName         string                       `json:"first_name"`
	LastName          string                       `json:"last_name"`
	Introduction      string                       `json:"introduction"`
	Detail            string                       `json:"detail"`
	FirstLanguage     string                       `json:"first_language"`
	NationalityID     uint64                       `json:"nationality_id"`
	NationalityName   string                       `json:"nationality_name"`
	LivingCountryID   uint64                       `json:"living_country_id"`
	LivingCountryName string                       `json:"living_country_name"`
	TeacherNo         string                       `json:"teacher_no"`
	Avatar            string                       `json:"avatar"`
	Certificates      []TeacherCertificateResponse `json:"certificates"`
}

type CourseResponse struct {
	ID            uint64    `json:"id"`
	Name          string    `json:"name"`
	Introduction  string    `json:"introduction"`
	Detail        string    `json:"detail"`
	Language      string    `json:"language"`
	Level         int       `json:"level"`
	Goal          string    `json:"goal"`
	UpdateTime    time.Time `json:"update_time"`
	AddTime       time.Time `json:"add_time"`
	Status        string    `json:"status"`
	Duration      int       `json:"duration"`
	SessionNumber int       `json:"session_number"`
	CoursePicture string    `json:"course_picture"`
}

type TeacherSlotsResponse struct {
	WeekDay   int    `gorm:"column:week_day" json:"week_day"`
	StartTime string `gorm:"column:start_time" json:"start_time"`
	EndTime   string `gorm:"column:end_time" json:"end_time"`
	Enabled   bool   `gorm:"column:enabled" json:"enabled"`
}

type TeacherDetailResponse struct {
	TeacherResponse
	Courses []CourseResponse       `json:"courses"`
	Slots   []TeacherSlotsResponse `json:"slots"`
}

type SendSystemMessageRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Subject  string `json:"subject"`
	Message  string `json:"message"`
}

func Welcome(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()
	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func Register(c *gin.Context) {
	var req RegisterRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var userInfo model.UserInfo
	err := db.Model(&model.UserInfo{}).
		Where("email = ?", req.Email).
		First(&userInfo).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if userInfo.ID > 0 {
		res.Code = codes.CODE_ERR_EXIST_OBJ
		res.Msg = "email repeated"
		c.JSON(http.StatusOK, res)
		return
	}

	var countryObj model.DictCountry
	if req.Country > 0 {
		db.Model(&model.DictCountry{}).Where("id = ?", req.Country).First(&countryObj)
	}
	if countryObj.ID == 0 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please specify country code"
		c.JSON(http.StatusOK, res)
		return
	}

	passwordHash := fmt.Sprintf("%x", sha256.Sum256([]byte(req.Password)))

	userInfo = model.UserInfo{
		Email:      req.Email,
		Password:   passwordHash,
		Name:       req.Name,
		CountryID:  countryObj.ID,
		Language:   countryObj.LanguageCode,
		AddTime:    time.Now(),
		UpdateTime: time.Now(),
		LoginId:    "",
		UserNo:     system.GenerateUserNoNumberOnly(),
		Status:     "00", // waiting for email verification
	}
	err = db.Save(&userInfo).Error
	if err != nil {
		log.Error("create user info error: ", err)
		res.Code = codes.CODE_ERR_DB_ERROR
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}
	// create user profile
	userProfile := model.UserProfile{
		UserID:            userInfo.ID,
		LivingCountryID:   countryObj.ID,
		LivingCountryName: countryObj.Name,
		LivingCountryCode: countryObj.PhoneCode,
		UpdateTime:        time.Now(),
	}
	err = db.Save(&userProfile).Error
	log.Error("save profile error", err)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		UserNo string `json:"user_no"`
	}{
		UserNo: userInfo.UserNo,
	}
	c.JSON(http.StatusOK, res)
}

func Login(c *gin.Context) {
	var req LoginRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var userInfo model.UserInfo
	err := db.Model(&model.UserInfo{}).
		Where("(email = ? or login_id = ? or user_no = ?)", req.LoginName, req.LoginName, req.LoginName).
		First(&userInfo).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if userInfo.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "user information is not found"
		c.JSON(http.StatusOK, res)
		return
	}

	if req.Password != userInfo.Password {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "user password is incorrect"
		c.JSON(http.StatusOK, res)
		return
	}

	// if userInfo.Status != "20" {
	// 	res.Code = codes.CODE_STATUS_INVALID
	// 	res.Msg = "user status is invalid"
	// 	c.JSON(http.StatusOK, res)
	// 	return
	// }

	originalStr := fmt.Sprintf("%d,%s,%d", userInfo.ID, userInfo.UserNo, time.Now().Unix())
	token, err := security.Encrypt([]byte(originalStr))

	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "build login token failed"
		c.JSON(http.StatusOK, res)
		return
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		UserNo string `json:"user_no"`
		Email  string `json:"email"`
		Name   string `json:"name"`
		Token  string `json:"token"`
	}{
		UserNo: userInfo.UserNo,
		Email:  userInfo.Email,
		Name:   userInfo.Name,
		Token:  token,
	}
	c.JSON(http.StatusOK, res)
}

func CourseFetchList(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	pageNo, _ := strconv.ParseInt(c.Query("pn"), 10, 64)
	pageSize, _ := strconv.ParseInt(c.Query("ps"), 10, 64)

	if pageNo <= 0 {
		pageNo = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	db := system.GetDb()

	var courseList []model.CourseInfo
	var total int64

	// 统计总数
	db.Model(&model.CourseInfo{}).
		Where("status = ? AND flag != ?", "100", -1).
		Count(&total)

	// 获取当前页数据
	err := db.Model(&model.CourseInfo{}).
		Where("status = ? AND flag != ?", "100", -1).
		Order("id ASC").
		Offset(int((pageNo - 1) * pageSize)).
		Limit(int(pageSize)).
		Find(&courseList).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	totalPages := (total + pageSize - 1) / pageSize

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = gin.H{
		"list":        courseList,
		"pn":          pageNo,
		"ps":          pageSize,
		"total":       total,
		"total_pages": totalPages,
	}
	c.JSON(http.StatusOK, res)
}

func CourseFetchDetail(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	courseId, _ := strconv.ParseInt(c.Query("course_id"), 10, 64)

	db := system.GetDb()

	var course model.CourseInfo

	err := db.Model(&model.CourseInfo{}).Where("id = ?", courseId).First(&course).Error
	if err != nil {
		log.Error("[Course] fetch detail err", err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = course
	c.JSON(http.StatusOK, res)
}

func CourseFetchTeacherList(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	courseId, _ := strconv.ParseInt(c.Query("course_id"), 10, 64)

	db := system.GetDb()

	var teacherList []model.Teacher

	err := db.Table("teacher_info AS t").
		Select("t.*").
		Joins("JOIN course_teacher AS ct ON ct.teacher_id = t.id").
		Where("ct.course_id = ? and t.flag != ?", courseId, -1).
		Scan(&teacherList).Error

	if err != nil {
		log.Error("[Course] fetch teacher list err", err)
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	var teachers []TeacherResponse
	var ids []uint64
	for _, r := range teacherList {
		ids = append(ids, r.ID)
	}

	var teacherDbCerts []model.TeacherCertificate
	if len(ids) > 0 {
		db.Model(&model.TeacherCertificate{}).Where("teacher_id IN ?", ids).Find(&teacherDbCerts)
	}

	for _, r := range teacherList {
		var tdcs []TeacherCertificateResponse
		for _, s := range teacherDbCerts {
			if r.ID == s.TeacherID {
				tdcs = append(tdcs, TeacherCertificateResponse{
					Title:       s.Title,
					Achievement: s.Achievement,
					GetDate:     s.GetDate,
					Document:    s.Document,
					IssueOrg:    s.IssueOrg,
				})
			}
		}
		teachers = append(teachers, TeacherResponse{
			ID:                r.ID,
			Name:              r.Name,
			FirstName:         r.FirstName,
			LastName:          r.LastName,
			Introduction:      r.Introduction,
			Detail:            r.Detail,
			FirstLanguage:     r.FirstLanguage,
			NationalityID:     r.NationalityID,
			NationalityName:   r.NationalityName,
			LivingCountryID:   r.LivingCountryID,
			LivingCountryName: r.LivingCountryName,
			TeacherNo:         r.TeacherNo,
			Avatar:            r.Avatar,
			Certificates:      tdcs,
		})
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = teachers
	c.JSON(http.StatusOK, res)
}

func CourseFetchReviewList(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	courseId, _ := strconv.ParseInt(c.Query("course_id"), 10, 64)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = courseId
	c.JSON(http.StatusOK, res)
}

func CourseFetchTeacherTimeSlot(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	_, _ = strconv.ParseInt(c.Query("course_id"), 10, 64)
	teacherId, _ := strconv.ParseInt(c.Query("teacher_id"), 10, 64)

	log.Info("teacher requested id: ", teacherId)

	db := system.GetDb()

	var teacherSlotTpl []model.TeacherTimeSlotTemplate

	err := db.Model(&model.TeacherTimeSlotTemplate{}).Where("teacher_id = ?", teacherId).Find(&teacherSlotTpl).Error
	if err != nil {
		log.Error("teacher slot error:", err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = teacherSlotTpl
	c.JSON(http.StatusOK, res)
}

func TeacherRegister(c *gin.Context) {
	var req TeacherRegisterRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var teacherInfo model.Teacher
	err := db.Model(&model.Teacher{}).
		Where("email = ?", req.Email).
		First(&teacherInfo).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if teacherInfo.ID > 0 {
		res.Code = codes.CODE_ERR_EXIST_OBJ
		res.Msg = "email repeated"
		c.JSON(http.StatusOK, res)
		return
	}

	//find teacher by invitation code
	var masterTeacher model.Teacher
	if len(req.InviteCode) == 0 {
		req.InviteCode = fixedSysInviteCode
	}
	if req.InviteCode != fixedSysInviteCode {
		db.Model(&model.Teacher{}).Where("invite_code = ?", req.InviteCode).First(&masterTeacher)
		if masterTeacher.ID == 0 {
			res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
			res.Msg = "Invitation code is invalid"
			c.JSON(http.StatusOK, res)
			return
		}
	}

	var livingCountry model.DictCountry
	var nationality model.DictCountry
	if req.LivingCountryID > 0 {
		db.Model(&model.DictCountry{}).Where("id = ?", req.LivingCountryID).First(&livingCountry)
	}
	if req.NationalityID > 0 {
		db.Model(&model.DictCountry{}).Where("id = ?", req.NationalityID).First(&nationality)
	}
	if nationality.ID == 0 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please specify country code"
		c.JSON(http.StatusOK, res)
		return
	}

	passwordHash := fmt.Sprintf("%x", sha256.Sum256([]byte(req.Password)))

	teacherInfo = model.Teacher{
		Email:             req.Email,
		Password:          passwordHash,
		Name:              req.Name,
		LivingCountryID:   livingCountry.ID,
		LivingCountryName: livingCountry.Name,
		NationalityID:     nationality.ID,
		NationalityName:   nationality.Name,
		FirstLanguage:     req.FirstLanguage,
		Introduction:      req.Introduction,
		AddTime:           time.Now(),
		UpdateTime:        time.Now(),
		TeacherNo:         system.GenerateTeacherNo(),
		Status:            "00", // waiting for email verification
		FirstName:         req.FirstName,
		LastName:          req.LastName,
		InviteCode:        system.GenerateShortInviteCode(),
	}
	err = db.Save(&teacherInfo).Error
	if err != nil {
		log.Error("create teacher info error: ", err)
		res.Code = codes.CODE_ERR_DB_ERROR
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		TeacherNo string `json:"teacher_no"`
	}{
		TeacherNo: teacherInfo.TeacherNo,
	}

	inviteRecord := model.TeacherInvite{
		TeacherID:        masterTeacher.ID,
		InvitedTeacherID: teacherInfo.ID,
		AddTime:          time.Now(),
		Flag:             0,
	}
	err = db.Save(&inviteRecord).Error
	if err != nil {
		log.Errorf("Master teacher is %s - Invited teacher is - %s", masterTeacher.TeacherNo, teacherInfo.TeacherNo)
	}

	c.JSON(http.StatusOK, res)
}

func TeacherLogin(c *gin.Context) {
	var req LoginRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var teacherInfo model.Teacher
	err := db.Model(&model.Teacher{}).
		Where("(email = ? or teacher_no = ?)", req.LoginName, req.LoginName).
		First(&teacherInfo).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if teacherInfo.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "teacher information is not found"
		c.JSON(http.StatusOK, res)
		return
	}

	if req.Password != teacherInfo.Password {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "teacher password is incorrect"
		c.JSON(http.StatusOK, res)
		return
	}

	originalStr := fmt.Sprintf("%d,%s,%d", teacherInfo.ID, teacherInfo.TeacherNo, time.Now().Unix())
	token, err := security.Encrypt([]byte(originalStr))

	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "build login token failed"
		c.JSON(http.StatusOK, res)
		return
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		TeacherNo string `json:"teacher_no"`
		Email     string `json:"email"`
		Name      string `json:"name"`
		Token     string `json:"token"`
	}{
		TeacherNo: teacherInfo.TeacherNo,
		Email:     teacherInfo.Email,
		Name:      teacherInfo.Name,
		Token:     token,
	}
	c.JSON(http.StatusOK, res)
}

func TeacherFetchList(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	pageNo, _ := strconv.ParseInt(c.Query("pn"), 10, 64)
	pageSize, _ := strconv.ParseInt(c.Query("ps"), 10, 64)

	if pageNo <= 0 {
		pageNo = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	db := system.GetDb()

	var teacherList []model.Teacher
	var total int64

	// 统计总数
	db.Model(&model.Teacher{}).
		Where("status = ? AND flag != ?", "20", -1).
		Count(&total)

	// 获取当前页数据
	err := db.Model(&model.Teacher{}).
		Where("status = ? AND flag != ?", "20", -1).
		Order("id ASC").
		Offset(int((pageNo - 1) * pageSize)).
		Limit(int(pageSize)).
		Find(&teacherList).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	var teachResponseResult []TeacherResponse
	for _, r := range teacherList {
		teachResponseResult = append(teachResponseResult, TeacherResponse{
			ID:                r.ID,
			Name:              r.Name,
			FirstName:         r.FirstName,
			LastName:          r.LastName,
			Introduction:      r.Introduction,
			Detail:            r.Detail,
			FirstLanguage:     r.FirstLanguage,
			NationalityID:     r.NationalityID,
			NationalityName:   r.NationalityName,
			LivingCountryID:   r.LivingCountryID,
			LivingCountryName: r.LivingCountryName,
			TeacherNo:         r.TeacherNo,
			Avatar:            r.Avatar,
		})
	}

	totalPages := (total + pageSize - 1) / pageSize

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = gin.H{
		"list":        teachResponseResult,
		"pn":          pageNo,
		"ps":          pageSize,
		"total":       total,
		"total_pages": totalPages,
	}
	c.JSON(http.StatusOK, res)
}

func TeacherFetchDetail(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	teacherNo := c.Query("teacher_no")

	db := system.GetDb()

	var teacher model.Teacher

	err := db.Model(&model.Teacher{}).
		Where("teacher_no = ? AND flag != ?", teacherNo, -1).
		First(&teacher).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}
	if teacher.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "teacher not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var teacherCertificates []model.TeacherCertificate
	var teacherSlots []model.TeacherTimeSlotTemplate
	var teacherCourses []model.CourseInfo

	db.Model(&model.TeacherCertificate{}).Where("teacher_id = ?", teacher.ID).Find(&teacherCertificates)
	db.Model(&model.TeacherTimeSlotTemplate{}).Where("teacher_id = ?", teacher.ID).Find(&teacherSlots)

	db.Model(&model.CourseInfo{}).Where("id IN (select course_id from course_teacher where teacher_id = ? order by score desc)", teacher.ID).Find(&teacherCourses)

	var teacherCertRes []TeacherCertificateResponse
	var teacherCourseRes []CourseResponse
	var teacherSlotRes []TeacherSlotsResponse

	for _, r := range teacherCertificates {
		teacherCertRes = append(teacherCertRes, TeacherCertificateResponse{
			Title:       r.Title,
			Achievement: r.Achievement,
			GetDate:     r.GetDate,
			Document:    r.Document,
			IssueOrg:    r.IssueOrg,
		})
	}
	for _, r := range teacherCourses {
		teacherCourseRes = append(teacherCourseRes, CourseResponse{
			ID:            r.ID,
			Name:          r.Name,
			Introduction:  r.Introduction,
			Detail:        r.Detail,
			Language:      r.Language,
			Level:         r.Level,
			Goal:          r.Goal,
			UpdateTime:    r.UpdateTime,
			AddTime:       r.AddTime,
			Status:        r.Status,
			Duration:      r.Duration,
			SessionNumber: r.SessionNumber,
			CoursePicture: r.CoursePicture,
		})
	}

	for _, r := range teacherSlots {
		teacherSlotRes = append(teacherSlotRes, TeacherSlotsResponse{
			WeekDay:   r.WeekDay,
			StartTime: r.StartTime,
			EndTime:   r.EndTime,
			Enabled:   r.Enabled,
		})
	}

	var teachResponse TeacherDetailResponse = TeacherDetailResponse{
		TeacherResponse: TeacherResponse{
			ID:                teacher.ID,
			Name:              teacher.Name,
			FirstName:         teacher.FirstName,
			LastName:          teacher.LastName,
			Introduction:      teacher.Introduction,
			Detail:            teacher.Detail,
			FirstLanguage:     teacher.FirstLanguage,
			NationalityID:     teacher.NationalityID,
			NationalityName:   teacher.NationalityName,
			LivingCountryID:   teacher.LivingCountryID,
			LivingCountryName: teacher.LivingCountryName,
			TeacherNo:         teacher.TeacherNo,
			Avatar:            teacher.Avatar,
			Certificates:      teacherCertRes,
		},
		Courses: teacherCourseRes,
		Slots:   teacherSlotRes,
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = teachResponse
	c.JSON(http.StatusOK, res)
}

func SendSystemMessage(c *gin.Context) {
	var req SendSystemMessageRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if len(req.Message) > 500 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "message should less then 500 chars"
		c.JSON(http.StatusOK, res)
		return
	}
	if len(req.Email) > 100 || len(req.FullName) > 100 || len(req.Subject) > 100 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Some fields are too long"
		c.JSON(http.StatusOK, res)
		return
	}

	if len(req.Message) == 0 || len(req.FullName) == 0 || len(req.Email) == 0 || len(req.Subject) == 0 {
		res.Code = codes.CODE_ERR_PARA_EMPTY
		res.Msg = "All fields must be filled in"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	smg := model.SysMessage{
		AddTime:  time.Now(),
		Subject:  req.Subject,
		Message:  req.Message,
		FullName: req.FullName,
		Email:    req.Email,
	}
	db.Save(&smg)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"

	c.JSON(http.StatusOK, res)
}

func StudentLogin(c *gin.Context) {
	var req StudentLoginRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var userInfo []model.UserInfo
	db.Model(&model.UserInfo{}).Where("user_no = ?", req.ParentNo).Find(&userInfo)
	if len(userInfo) == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Please input correct parent number."
		c.JSON(http.StatusOK, res)
		return
	}
	if len(userInfo) > 1 {
		res.Code = codes.CODE_ERR_REPEAT
		res.Msg = "Please input correct parent number, it it invalid."
		c.JSON(http.StatusOK, res)
		return
	}

	var studentInfo model.UserMember
	err := db.Model(&model.UserMember{}).
		Where("user_id = ? and login_id = ?", userInfo[0].ID, req.LoginName).
		First(&studentInfo).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if studentInfo.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "student information is not found"
		c.JSON(http.StatusOK, res)
		return
	}

	if req.Password != studentInfo.Password {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "student password is incorrect"
		c.JSON(http.StatusOK, res)
		return
	}

	originalStr := fmt.Sprintf("%d,%s,%d", studentInfo.ID, studentInfo.UserID, time.Now().Unix())
	token, err := security.Encrypt([]byte(originalStr))

	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "build login token failed"
		c.JSON(http.StatusOK, res)
		return
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		UserID    uint64 `json:"user_id"`
		UserNo    string `json:"user_no"`
		StudentID uint64 `json:"student_id"`
		Email     string `json:"email"`
		Name      string `json:"name"`
		Token     string `json:"token"`
	}{
		UserID:    userInfo[0].ID,
		UserNo:    userInfo[0].UserNo,
		StudentID: studentInfo.ID,
		Email:     studentInfo.Email,
		Name:      studentInfo.Name,
		Token:     token,
	}
	c.JSON(http.StatusOK, res)
}
