package auth

import (
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
	"github.com/langbridge/backend/service"
	"github.com/langbridge/backend/system"
	"github.com/langbridge/backend/utils"
	"gorm.io/gorm"
)

type CourseSelectTimeSlot struct {
	WeekDay   int    `json:"week_day"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

type CourseConfirmRequest struct {
	CourseID  uint64                 `json:"course_id"`
	TeacherID uint64                 `json:"teacher_id"`
	StartDate string                 `json:"start_date"`
	EndDate   string                 `json:"end_date"`
	TimeSlots []CourseSelectTimeSlot `json:"time_slots"`
}

type CourseBookedTran struct {
	ID         uint64    `json:"id"`
	BookingNo  string    `gorm:"column:booking_no" json:"booking_no"`
	TeacherID  uint64    `gorm:"column:teacher_id" json:"teacher_id"`
	CourseID   uint64    `gorm:"column:course_id" json:"course_id"`
	UserID     uint64    `gorm:"column:user_id" json:"user_id"`
	LessonDate time.Time `gorm:"column:lesson_date" json:"lesson_date"`
	StartTime  string    `gorm:"column:start_time" json:"start_time"`
	EndTime    string    `gorm:"column:end_time" json:"end_time"`
	Status     string    `gorm:"column:status" json:"status"`
	Ongoing    int       `gorm:"column:ongoing" json:"ongoing"`
}

type CourseWithJoinStatus struct {
	model.CourseInfo
	Joined           bool               `json:"joined"`
	UserCourseStatus string             `json:"uc_ss"`
	UcID             uint64             `json:"uc_id"`
	JoinTime         time.Time          `json:"join_time"`
	BookedTrans      []CourseBookedTran `json:"booked_trans"`
}

type CourseReviewAddRequest struct {
	Comment string `json:"comment"`
	Rate    int8   `json:"rate"`
	BTID    uint64 `json:"btid"`
}

type SecurityCheckRequest struct {
	Passcode string `json:"passcode"`
}

type CourseMeetingNoteAddRequest struct {
	Note string `json:"note"`
	BtID uint64 `json:"btid"`
}

type CourseBindStudentRequest struct {
	StudentID    uint64 `json:"student_id"`
	UserCourseID uint64 `json:"user_course_id"`
}

type CourseLeaveRequest struct {
	Note         string `json:"note"`
	NewDate      string `json:"new_date"`
	NewStartTime string `json:"new_start_time"`
	NewEndTime   string `json:"new_end_time"`
	BookID       uint64 `json:"book_id"`
}

func CourseJoin(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	courseId, _ := strconv.ParseInt(c.Query("course_id"), 10, 64)

	db := system.GetDb()

	var userInfo model.UserInfo
	db.Model(&model.UserInfo{}).Where("id = ?", userID).First(&userInfo)
	if userInfo.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "user not found"
		c.JSON(http.StatusOK, res)
		return
	}
	if !userInfo.IsChecked() {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "user status invalid, please verify email at first"
		c.JSON(http.StatusOK, res)
		return
	}

	var course model.CourseInfo

	err = db.Model(&model.CourseInfo{}).Where("id = ?", courseId).First(&course).Error
	if err != nil {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var unavailableUserCourseStatus []string
	unavailableUserCourseStatus = append(unavailableUserCourseStatus, string(codes.CourseMineInactive))
	unavailableUserCourseStatus = append(unavailableUserCourseStatus, string(codes.CourseMineWatingConfirm))
	unavailableUserCourseStatus = append(unavailableUserCourseStatus, string(codes.CourseMineOngoing))

	var userCourseSelected model.UserCourse
	err = db.Model(&model.UserCourse{}).Where("user_id = ? and course_id = ? and flag != ? and status IN ?", userID, course.ID, -1, unavailableUserCourseStatus).First(&userCourseSelected).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			userCourseSelected.AddTime = time.Now()
			userCourseSelected.CourseID = course.ID
			userCourseSelected.UserID = uint64(userID)
			userCourseSelected.Flag = 0
			userCourseSelected.Status = "00"
			err = db.Model(&model.UserCourse{}).Save(&userCourseSelected).Error
			if err != nil {
				log.Error("[Course] save user course", err)
			}
		} else {
			// ❌ 查询出错
			log.Error("[Course] user course query error:", err)
		}
	} else {
		// ✅ 数据存在
		log.Info("userCourse found:", userCourseSelected)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = userCourseSelected
	c.JSON(http.StatusOK, res)
}

func CourseList(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("user_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	status := c.Query("status")
	if status != "all" && status != "inactive" && status != "ongoing" && status != "complete" && status != "waitingconfirm" && status != "canceled" {
		status = "all"
	}
	var statusList []string
	if status == "all" {
		statusList = append(statusList,
			string(codes.CourseMineComplete),
			string(codes.CourseMineInactive),
			string(codes.CourseMineOngoing),
			string(codes.CourseMineWatingConfirm),
			string(codes.CourseMineCanceled))
	} else if status == "inactive" {
		statusList = append(statusList, string(codes.CourseMineInactive))
	} else if status == "ongoing" {
		statusList = append(statusList, string(codes.CourseMineOngoing))
	} else if status == "complete" {
		statusList = append(statusList, string(codes.CourseMineComplete))
	} else if status == "waitingconfirm" {
		statusList = append(statusList, string(codes.CourseMineWatingConfirm))
	} else if status == "canceled" {
		statusList = append(statusList, string(codes.CourseMineCanceled))
	}
	currentUserStr, _ := currentUser.(string)
	userID, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var result []model.UserCourseWithCourse

	err = db.Table("user_course AS uc").
		Joins("JOIN course_info AS c ON c.id = uc.course_id").
		Joins("LEFT JOIN user_member AS um on uc.student_id = um.id").
		Select(`
		uc.id AS uc_id,
		uc.user_id,
		uc.course_id,
		uc.status AS uc_status,
		uc.add_time AS uc_add_time,
		c.name,
		c.introduction,
		c.detail,
		c.language,
		c.level,
		c.goal,
		c.course_picture,
		c.add_time AS course_add_time,
		c.update_time AS course_update_time,
		c.status AS course_status,
		c.flag AS course_flag,
		uc.student_id AS student_id,
		um.name AS student_name
	`).
		Where("uc.user_id = ? AND uc.flag != ? AND c.flag != ? and uc.status IN ?", userID, -1, -1, statusList).
		Order("uc.add_time DESC").
		Scan(&result).Error

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = result
	c.JSON(http.StatusOK, res)
}

func CourseFetchDetail(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	userCourseId, _ := strconv.ParseInt(c.Query("uc_id"), 10, 64)

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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var userCourse model.UserCourse
	err = db.Model(&model.UserCourse{}).Where("id = ?", userCourseId).First(&userCourse).Error
	if err != nil {
		log.Error("[Course] fetch detail judge user join status", err)
	}
	if userCourse.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Can not find course you joined"
		c.JSON(http.StatusOK, res)
		return
	}
	if userCourse.UserID != uint64(userID) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Can not find course you joined, please check"
		c.JSON(http.StatusOK, res)
		return
	}

	var course model.CourseInfo
	err = db.Model(&model.CourseInfo{}).Where("id = ?", userCourse.CourseID).First(&course).Error
	if err != nil {
		log.Error("[Course] fetch detail err", err)
	}

	var bookTrans []model.CourseBookTrans
	db.Model(&model.CourseBookTrans{}).Where("uc_id = ?", userCourse.ID).Find(&bookTrans)
	var courseBooked []CourseBookedTran
	for _, r := range bookTrans {
		courseBooked = append(courseBooked, CourseBookedTran{
			ID:         r.ID,
			BookingNo:  r.BookingNo,
			TeacherID:  r.TeacherID,
			CourseID:   r.CourseID,
			UserID:     r.UserID,
			LessonDate: r.LessonDate,
			StartTime:  r.StartTime,
			EndTime:    r.EndTime,
			Status:     r.Status,
			Ongoing:    r.Ongoing,
		})
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = CourseWithJoinStatus{
		CourseInfo:       course,
		UcID:             userCourse.ID,
		Joined:           true,
		JoinTime:         userCourse.AddTime,
		UserCourseStatus: userCourse.Status,
		BookedTrans:      courseBooked,
	}
	c.JSON(http.StatusOK, res)
}

func CourseConfirm(c *gin.Context) {
	var req CourseConfirmRequest
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	// check user course status
	var userCourse model.UserCourse
	db.Model(&model.UserCourse{}).Where("user_id = ? and course_id = ? and status = ?", userID, req.CourseID, codes.CourseMineInactive).First(&userCourse)

	if userCourse.ID == 0 {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "You need to join this course before accessing it."
		c.JSON(http.StatusOK, res)
		return
	}

	layout := "2006-01-02"
	start, _ := time.Parse(layout, req.StartDate)
	end, _ := time.Parse(layout, req.EndDate)
	var internalResult []service.InternalComputeBookDatetime
	var allDate []string

	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		weekday := int(d.Weekday())
		if weekday == 0 {
			weekday = 7 // Sunday fix
		}
		allDate = append(allDate, d.Format("2006-01-02"))
		for _, slot := range req.TimeSlots {
			if slot.WeekDay == weekday {
				internalResult = append(internalResult, service.InternalComputeBookDatetime{
					LessonDate: d.Format(layout),
					StartTime:  slot.StartTime,
					EndTime:    slot.EndTime,
				})
			}
		}
	}

	if len(internalResult) == 0 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "empty request params"
		c.JSON(http.StatusOK, res)
		return
	}

	var existResult []model.CourseBookTrans
	// query can book?
	err = db.Model(&model.CourseBookTrans{}).
		Where("teacher_id = ? = ? and lesson_date IN ?", req.TeacherID, allDate).
		Find(&existResult).
		Error
	if err != nil {
		log.Error("error query result set", err)
	}

	if len(existResult) > 0 {
		for _, want := range internalResult {
			for _, exist := range existResult {
				targetDate := exist.LessonDate.Format("2006-01-02")
				if want.LessonDate == targetDate {
					// parse time string to time.Time (only HH:mm)
					newStart, _ := time.Parse("15:04", want.StartTime)
					newEnd, _ := time.Parse("15:04", want.EndTime)
					existStart, _ := time.Parse("15:04:00", exist.StartTime)
					existEnd, _ := time.Parse("15:04:00", exist.EndTime)

					hasConflict := newStart.Before(existEnd) && newEnd.After(existStart)
					if hasConflict {
						weekDay, _ := utils.GetWeekdayNumber(want.LessonDate)
						weekDayStr, _ := utils.GetWeekdayStr(weekDay)
						res.Code = codes.CODE_BOOKING_CONFLICT
						res.Msg = fmt.Sprintf("booking conflict on [%s] %s–%s", weekDayStr, want.StartTime, want.EndTime)
						c.JSON(http.StatusOK, res)
						return
					}
				}
			}
		}
	}

	bookNo := utils.GenerateBookNo(userID, time.Now())

	auTime := time.Now()

	var saveResult []model.CourseBookTrans

	for _, r := range internalResult {
		ledate, err := time.Parse("2006-01-02", r.LessonDate)
		if err != nil {
			res.Code = codes.CODE_ERR_BAD_PARAMS
			res.Msg = fmt.Sprintf("booking date error %s", r.LessonDate)
			c.JSON(http.StatusOK, res)
			return
		}

		saveResult = append(saveResult, model.CourseBookTrans{
			UcID:       userCourse.ID,
			BookingNo:  bookNo,
			TeacherID:  req.TeacherID,
			CourseID:   req.CourseID,
			UserID:     uint64(userID),
			LessonDate: ledate,
			StartTime:  r.StartTime,
			EndTime:    r.EndTime,
			Status:     "000",
			AddTime:    auTime,
			UpdateTime: auTime,
		})

	}

	err = db.CreateInBatches(&saveResult, 200).Error
	if err != nil {
		log.Error(err)
	}
	//update user course status
	db.Model(&model.UserCourse{}).Where("id = ?", userCourse.ID).Update("status", codes.CourseMineWatingConfirm)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil
	c.JSON(http.StatusOK, res)
}

func CourseCancel(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	userCourseId, _ := strconv.ParseInt(c.Query("uc_id"), 10, 64)

	db := system.GetDb()
	// check user course status
	var userCourse model.UserCourse
	db.Model(&model.UserCourse{}).Where("id = ?", userCourseId).First(&userCourse)

	if userCourse.ID == 0 {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "You need to join this course before accessing it."
		c.JSON(http.StatusOK, res)
		return
	}

	if userCourse.UserID != uint64(userID) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Can not find bookings."
		c.JSON(http.StatusOK, res)
		return
	}

	if userCourse.Status != string(codes.CourseMineInactive) && userCourse.Status != string(codes.CourseMineWatingConfirm) {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "Can not execute under current status."
		c.JSON(http.StatusOK, res)
		return
	}

	db.Model(&model.CourseBookTrans{}).
		Where("uc_id = ?", userCourse.ID).
		Update("status", "001")

	db.Model(&model.UserCourse{}).Where("id = ?", userCourse.ID).Update("status", codes.CourseMineCanceled)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil
	c.JSON(http.StatusOK, res)
}

func CourseTimeList(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	pageNo, _ := strconv.ParseInt(c.Query("pn"), 10, 64)
	pageSize, _ := strconv.ParseInt(c.Query("ps"), 10, 64)

	if pageNo <= 0 {
		pageNo = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	chooseStatus, exist := c.GetQuery("status")

	if chooseStatus != common.BookTransStatusNormal && chooseStatus != common.BookTransStatusRequestLeave {
		chooseStatus = ""
	}

	db := system.GetDb()

	var querySql = "course_book_trans.user_id = ?"
	var querySqlParam = []interface{}{userID}
	if chooseStatus != "" {
		querySql = querySql + " and course_book_trans.status = ?"
		querySqlParam = append(querySqlParam, chooseStatus)
	}

	var total int64
	db.Model(&model.CourseBookTrans{}).
		Where("user_id = ?", userID).
		Count(&total)

	var result []model.CourseBookWithJoin

	err = db.Table("course_book_trans").
		Joins("LEFT JOIN teacher_info ON course_book_trans.teacher_id = teacher_info.id").
		Joins("LEFT JOIN course_info ON course_book_trans.course_id = course_info.id").
		Joins("LEFT JOIN user_course uc on course_book_trans.uc_id = uc.id").
		Joins("LEFT JOIN user_member um on uc.student_id = um.id").
		Where(querySql, querySqlParam...).
		Select("course_book_trans.*, teacher_info.name AS teacher_name, course_info.name AS course_name, um.name AS student_name").
		Order("lesson_date, start_time ASC").
		Offset(int((pageNo - 1)) * int(pageSize)).
		Limit(int(pageSize)).
		Scan(&result).Error
	if err != nil {
		log.Error(err)
	}

	totalPages := (total + pageSize - 1) / pageSize

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = gin.H{
		"list":        result,
		"pn":          pageNo,
		"ps":          pageSize,
		"total":       total,
		"total_pages": totalPages,
	}
	c.JSON(http.StatusOK, res)
}

func CourseTimeRange(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	layout := "2006-01-02"
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	startDate, err1 := time.Parse(layout, startDateStr)
	endDate, err2 := time.Parse(layout, endDateStr)

	if err1 != nil || startDate.Format(layout) != startDateStr {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "start_date must be in yyyy-MM-dd format"
		c.JSON(http.StatusOK, res)
		return
	}

	if err2 != nil || endDate.Format(layout) != endDateStr {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "end_date must be in yyyy-MM-dd format"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var total int64
	db.Model(&model.CourseBookTrans{}).
		Where("user_id = ? and lesson_date >= ? and lesson_date <= ?", userID, startDate, endDate).
		Count(&total)

	var result []model.CourseBookWithJoin

	err = db.Table("course_book_trans").
		Joins("LEFT JOIN teacher_info ON course_book_trans.teacher_id = teacher_info.id").
		Joins("LEFT JOIN course_info ON course_book_trans.course_id = course_info.id").
		Where("course_book_trans.user_id = ? and course_book_trans.lesson_date >= ? and course_book_trans.lesson_date <= ?", userID, startDateStr, endDateStr).
		Select("course_book_trans.*, teacher_info.name AS teacher_name, course_info.name AS course_name").
		Order("lesson_date, start_time ASC").
		Scan(&result).Error
	if err != nil {
		log.Error(err)
	}

	if len(result) == 0 {
		result = []model.CourseBookWithJoin{}
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = result
	c.JSON(http.StatusOK, res)
}

func CourseTimeRequestLeave(c *gin.Context) {
	var req CourseLeaveRequest
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	layout := "2006-01-02"
	layoutTime := "15:04:00"

	newDate, err1 := time.Parse(layout, req.NewDate)
	newStartTime, err2 := time.Parse(layoutTime, req.NewStartTime)
	newEndTime, err2 := time.Parse(layoutTime, req.NewEndTime)

	if err1 != nil || newDate.Format(layout) != req.NewDate {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "New date must be in yyyy-MM-dd format"
		c.JSON(http.StatusOK, res)
		return
	}

	if err2 != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "New time must be in HH:mm format"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var bookTran model.CourseBookTrans
	db.Model(&model.CourseBookTrans{}).
		Where("user_id = ? and id = ?", userID, req.BookID).
		First(&bookTran)

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Booking not found"
		c.JSON(http.StatusOK, res)
		return
	}
	if bookTran.Ongoing != 0 {
		res.Code = codes.CODE_STATUS_INVALID
		res.Msg = "This course had been taken, should not been requested"
		c.JSON(http.StatusOK, res)
		return
	}

	/*
		bookTran.LessonDate = newDate
		bookTran.StartTime = newStartTime.Format(layoutTime)
		bookTran.EndTime = newEndTime.Format(layoutTime)

		db.Updates(bookTran)
	*/
	var bookLeave model.CourseBookLeave
	err = db.Model(&model.CourseBookLeave{}).Where("book_id = ? and status = ?", bookTran.ID, common.BookLeaveStatusApply).First(&bookLeave).Error
	if err != nil {
		log.Error(err)
	}
	if bookLeave.ID > 0 {
		res.Code = codes.CODE_ERR_REPEAT
		res.Msg = "Requesting leave for this book is found"
		c.JSON(http.StatusOK, res)
		return
	}

	bookLeave.AddTime = time.Now()
	bookLeave.BookID = bookTran.ID
	bookLeave.PendingDate = newDate
	bookLeave.PendingStartTime = newStartTime.Format(layoutTime)
	bookLeave.PendingEndTime = newEndTime.Format(layoutTime)
	bookLeave.Status = common.BookLeaveStatusApply
	bookLeave.Source = common.BookLeaveSourceUser
	bookLeave.OriginalDate = bookTran.LessonDate
	bookLeave.OriginalStartTime = bookTran.StartTime
	bookLeave.OriginalEndTime = bookTran.EndTime
	err = db.Save(&bookLeave).Error
	if err != nil {
		res.Code = codes.CODE_ERR_UNKNOWN
		res.Msg = "Err happened for requesting leave"
		log.Error("request leave error", err)
		c.JSON(http.StatusOK, res)
		return
	}
	bookTran.Status = common.BookTransStatusRequestLeave
	db.Updates(&bookTran)

	var teacherInfo model.Teacher
	var userInfo model.UserInfo
	var courseInfo model.CourseInfo
	db.Model(&model.Teacher{}).Where("id = ?", bookTran.TeacherID).First(&teacherInfo)
	db.Model(&model.UserInfo{}).Where("id = ?", bookTran.UserID).First(&userInfo)
	db.Model(&model.CourseInfo{}).Where("id = ?", bookTran.CourseID).First(&courseInfo)
	if len(teacherInfo.Email) > 0 {
		utils.SendLeaveRequestToTeacherMail(teacherInfo.Email, userInfo.Name, courseInfo.Name, bookTran.LessonDate.Format(layout), bookTran.StartTime, bookTran.EndTime)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil
	c.JSON(http.StatusOK, res)
}

func CourseTimeLeaveDetail(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	bookIdStr, exist := c.GetQuery("book_id")
	if !exist {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please pass book id"
		c.JSON(http.StatusOK, res)
		return
	}

	bookId, err := strconv.ParseUint(bookIdStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please pass book id"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var bookTran model.CourseBookTrans
	db.Model(&model.CourseBookTrans{}).
		Where("user_id = ? and id = ?", userID, bookId).
		First(&bookTran)

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Booking not found"
		c.JSON(http.StatusOK, res)
		return
	}
	var bookLeavies []model.CourseBookLeave
	db.Model(&model.CourseBookLeave{}).Where("book_id = ?", bookTran.ID).Find(&bookLeavies)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = bookLeavies
	c.JSON(http.StatusOK, res)
}

func CourseGetMeetingInfo(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	btidStr := c.Query("btid")
	btid, err := strconv.ParseInt(btidStr, 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "course meeting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var bookTran model.CourseBookTrans
	err = db.Model(&model.CourseBookTrans{}).Where("id = ? and user_id = ?", btid, userID).First(&bookTran).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	// 解析字符串成 time.Time
	lessonDate := bookTran.LessonDate

	// 当前日期，只保留年月日部分
	today := time.Now().Format("2006-01-02")
	_, _ = time.Parse("2006-01-02", today)

	lessonDateStr := lessonDate.Format("2006-01-02")

	log.Info("Judge here: ", lessonDateStr, " === ", today)
	// 比较日期
	if lessonDateStr < today {
		res.Code = codes.CODE_ERR_METHOD_UNSUPPORT
		res.Msg = "course date already passed"
		c.JSON(http.StatusOK, res)
		return
	} else if lessonDateStr > today {
		res.Code = codes.CODE_ERR_METHOD_UNSUPPORT
		res.Msg = "course not starting"
		c.JSON(http.StatusOK, res)
		return
	}

	if bookTran.Ongoing == 0 {
		// res.Code = codes.CODE_ERR_METHOD_UNSUPPORT
		// res.Msg = "please waiting for teacher start the classroom"
		// c.JSON(http.StatusOK, res)
		// return
		db.Model(&model.CourseBookTrans{}).Where("id = ?", bookTran.ID).Update("ongoing", 1)
	}

	// roomURI := fmt.Sprintf("https://meet.jit.si/%s_%s_%d", "langbridge", bookTran.BookingNo, bookTran.ID)
	bridgeMeeting := fmt.Sprintf("%s%d_%s_%d", "langbridge", bookTran.UcID, bookTran.BookingNo, bookTran.ID)
	roomURI := GenerateRoomName(bridgeMeeting)

	var courseLog model.CourseLogRecord
	db.Model(&model.CourseLogRecord{}).Where("book_id = ?", bookTran.ID).First(&courseLog)

	if courseLog.ID == 0 {
		courseLog.AddTime = time.Now()
		courseLog.BookID = bookTran.ID
		courseLog.MeetingURI = roomURI
		courseLog.StartFrom = "U"
		db.Model(&model.CourseLogRecord{}).Save(&courseLog)
	}

	var courseInfo model.CourseInfo
	var teacherInfo model.Teacher
	var studentInfo model.UserMember
	db.Model(&model.CourseInfo{}).Where("id = ?", bookTran.CourseID).First(&courseInfo)
	db.Model(&model.Teacher{}).Where("id = ?", bookTran.TeacherID).First(&teacherInfo)
	err = db.Table("user_member as um").
		Joins("JOIN user_course as uc ON um.id = uc.student_id").
		Where("uc.id = ?", bookTran.UcID).Scan(&studentInfo).Error

	token, err := utils.GenerateJWT(bookTran.LessonDate, 24*time.Hour)
	if err != nil {
		log.Error(err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		MeetingURI    string `json:"meeting_uri"`
		BookID        uint64 `json:"book_id"`
		CourseName    string `json:"course_name"`
		CourseDetail  string `json:"course_detail"`
		CourseID      uint64 `json:"course_id"`
		TeacherName   string `json:"teacher_name"`
		TeacherID     uint64 `json:"teacher_id"`
		TeacherDetail string `json:"teacher_detail"`
		LessonDate    string `json:"lesson_date"`
		StartTime     string `json:"start_time"`
		EndTime       string `json:"end_time"`
		Token         string `json:"token"`
		StudentID     uint64 `json:"student_id"`
		StudentName   string `json:"student_name"`
	}{
		MeetingURI:    roomURI,
		BookID:        bookTran.ID,
		CourseName:    courseInfo.Name,
		CourseID:      courseInfo.ID,
		CourseDetail:  courseInfo.Detail,
		TeacherName:   teacherInfo.Name,
		TeacherID:     teacherInfo.ID,
		TeacherDetail: teacherInfo.Detail,
		LessonDate:    bookTran.LessonDate.Format("2006-01-02"),
		StartTime:     bookTran.StartTime,
		EndTime:       bookTran.EndTime,
		Token:         token,
		StudentID:     studentInfo.ID,
		StudentName:   studentInfo.Name,
	}
	c.JSON(http.StatusOK, res)
}

func CourseGetMeetingEnd(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	btidStr := c.Query("btid")
	btid, err := strconv.ParseInt(btidStr, 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "course meeting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var bookTran model.CourseBookTrans
	err = db.Model(&model.CourseBookTrans{}).Where("id = ? and user_id = ?", btid, userID).First(&bookTran).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var courseLog model.CourseLogRecord
	db.Model(&model.CourseLogRecord{}).Where("book_id = ?", bookTran.ID).First(&courseLog)

	if courseLog.ID > 0 && courseLog.EndTime == nil {
		now := time.Now()
		courseLog.EndTime = &now
		courseLog.EndFrom = "U"
		err = db.Model(&model.CourseLogRecord{}).Where("id = ?", courseLog.ID).Updates(&courseLog).Error
		if err != nil {
			log.Error(err)
		}
	}
	db.Model(&model.CourseBookTrans{}).Where("id = ?", bookTran.ID).Update("ongoing", 2)

	c.JSON(http.StatusOK, res)
}

func CourseGetReview(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	btidStr := c.Query("btid")
	btid, err := strconv.ParseInt(btidStr, 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "course spec invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var bookTran model.CourseBookTrans
	err = db.Model(&model.CourseBookTrans{}).Where("id = ? and user_id = ?", btid, userID).First(&bookTran).Error

	if err != nil {
		log.Error("fetch course info error", err)
	}

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var reviews []model.CourseReview
	db.Model(&model.CourseReview{}).Where("book_id = ? and user_id = ?", bookTran.ID, userID).Order("add_time DESC").Find(&reviews)

	res.Data = reviews
	c.JSON(http.StatusOK, res)
}

func CourseAddReview(c *gin.Context) {
	var req CourseReviewAddRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if len(req.Comment) == 0 || len(req.Comment) > 500 {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "Comment should not be empty, and less than 500 chars"
		c.JSON(http.StatusOK, res)
		return
	}
	if req.Rate < 0 || req.Rate > 5 {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "Rate should be between 0 to 5"
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	btidStr := c.Query("btid")
	btid, err := strconv.ParseUint(btidStr, 10, 64)
	if err != nil {
		btid = req.BTID
		if btid > 0 {
			err = nil
		}
	}

	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "course meeting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var bookTran model.CourseBookTrans
	err = db.Model(&model.CourseBookTrans{}).Where("id = ? and user_id = ?", btid, userID).First(&bookTran).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var review = model.CourseReview{
		BookID:    bookTran.ID,
		TeacherID: bookTran.TeacherID,
		UserID:    uint64(userID),
		Comment:   req.Comment,
		Rate:      int(req.Rate),
		AddTime:   time.Now(),
		Direction: 1,
		Flag:      0,
	}
	db.Save(&review)

	c.JSON(http.StatusOK, res)
}

func CourseGetHistories(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	pageNo, _ := strconv.ParseInt(c.Query("pn"), 10, 64)
	pageSize, _ := strconv.ParseInt(c.Query("ps"), 10, 64)

	if pageNo <= 0 {
		pageNo = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	db := system.GetDb()

	var total int64
	db.Model(&model.CourseBookTrans{}).
		Where("user_id = ?", userID).
		Count(&total)

	totalPages := (total + pageSize - 1) / pageSize

	var result []model.CourseBookWithJoin

	err = db.Table("course_book_trans").
		Joins("JOIN course_log_record clr on clr.book_id = course_book_trans.id").
		Joins("LEFT JOIN teacher_info ON course_book_trans.teacher_id = teacher_info.id").
		Joins("LEFT JOIN course_info ON course_book_trans.course_id = course_info.id").
		Where("course_book_trans.user_id = ?", userID).
		Select("course_book_trans.*, teacher_info.name AS teacher_name, course_info.name AS course_name").
		Order("lesson_date, start_time DESC").
		Offset(int((pageNo - 1)) * int(pageSize)).
		Limit(int(pageSize)).
		Scan(&result).Error
	if err != nil {
		log.Error(err)
	}

	res.Data = gin.H{
		"list":        result,
		"pn":          pageNo,
		"ps":          pageSize,
		"total":       total,
		"total_pages": totalPages,
	}
	c.JSON(http.StatusOK, res)
}

func SecurityCheck(c *gin.Context) {
	var req SecurityCheckRequest
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	var passSetting model.UserSetting
	db := system.GetDb()
	db.Model(&model.UserSetting{}).Where("user_id = ? and spec_name = ?", userID, "security.passcode").First(&passSetting)

	if passSetting.ID > 0 && passSetting.SpecValue != req.Passcode {
		res.Code = codes.CODE_ERR_PASSCODE
		res.Msg = "Passcode check failed"
		c.JSON(http.StatusOK, res)
		return
	}

	c.JSON(http.StatusOK, res)
}

func SecuritySet(c *gin.Context) {
	var req SecurityCheckRequest
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	var passSetting model.UserSetting
	db := system.GetDb()
	db.Model(&model.UserSetting{}).Where("user_id = ? and spec_name = ?", userID, "security.passcode").First(&passSetting)

	if passSetting.ID == 0 {
		passSetting = model.UserSetting{
			UserID:    uint64(userID),
			SpecName:  "security.passcode",
			SpecValue: req.Passcode,
		}
		db.Save(&passSetting)
	} else {
		passSetting.SpecValue = req.Passcode
		db.Save(&passSetting)
	}

	c.JSON(http.StatusOK, res)
}

func CourseMeetingNodeAdd(c *gin.Context) {
	var req CourseMeetingNoteAddRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	if len(req.Note) == 0 {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please enter note"
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var bookTran model.CourseBookTrans
	err = db.Model(&model.CourseBookTrans{}).Where("id = ? and user_id = ?", req.BtID, userID).First(&bookTran).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}
	var studentInfo model.UserMember
	err = db.Table("user_member as um").
		Joins("JOIN user_course as uc ON um.id = uc.student_id").
		Where("uc.id = ?", bookTran.UcID).Scan(&studentInfo).Error

	var note = model.CourseMeetingNote{
		BtID:      bookTran.ID,
		UserID:    bookTran.UserID,
		TeacherID: bookTran.TeacherID,
		StudentID: studentInfo.ID,
		Note:      req.Note,
		AddTime:   time.Now(),
		Source:    "0",
	}
	db.Save(&note)

	c.JSON(http.StatusOK, res)
}

func CourseMeetingNodeFetch(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	btidStr := c.Query("btid")
	btid, err := strconv.ParseInt(btidStr, 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "course meeting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var notes []model.CourseMeetingNote
	err = db.Model(&model.CourseMeetingNote{}).Where("bt_id = ? and user_id = ? and source = ?", btid, userID, 0).Order("add_time DESC").Find(&notes).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	type NoteResponse struct {
		ID      uint64    `json:"id"`
		Note    string    `json:"note"`
		AddTime time.Time `json:"add_time"`
	}
	var retData []NoteResponse
	for _, r := range notes {
		retData = append(retData, NoteResponse{
			ID:      r.ID,
			Note:    r.Note,
			AddTime: r.AddTime,
		})
	}
	res.Data = retData

	c.JSON(http.StatusOK, res)
}

func CourseMeetingNodeFetchAll(c *gin.Context) {
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	btidStr := c.Query("btid")
	btid, err := strconv.ParseInt(btidStr, 10, 64)

	if err != nil {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "course meeting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var notes []model.CourseMeetingNote
	err = db.Model(&model.CourseMeetingNote{}).Where("bt_id = ? and user_id = ?", btid, userID).Order("add_time DESC").Find(&notes).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	type NoteResponse struct {
		ID      uint64    `json:"id"`
		Note    string    `json:"note"`
		AddTime time.Time `json:"add_time"`
		Source  string    `json:"source"`
	}
	var retData []NoteResponse
	for _, r := range notes {
		retData = append(retData, NoteResponse{
			ID:      r.ID,
			Note:    r.Note,
			AddTime: r.AddTime,
			Source:  r.Source,
		})
	}
	res.Data = retData

	c.JSON(http.StatusOK, res)
}

func CourseBindStudent(c *gin.Context) {
	var req CourseBindStudentRequest
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
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var userCourse model.UserCourse
	var userMember model.UserMember
	err = db.Model(&model.UserCourse{}).Where("id = ? and user_id = ?", req.UserCourseID, userID).First(&userCourse).Error
	if err != nil {
		log.Error("fetch UserCourse error", err)
	}
	err = db.Model(&model.UserMember{}).Where("id = ? and user_id = ?", req.StudentID, userID).First(&userMember).Error
	if err != nil {
		log.Error("fetch UserMember error", err)
	}

	if userCourse.ID == 0 || userMember.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Course or Student not found"
		c.JSON(http.StatusOK, res)
		return
	}

	userCourse.StudentID = userMember.ID
	db.Updates(&userCourse)

	c.JSON(http.StatusOK, res)
}
