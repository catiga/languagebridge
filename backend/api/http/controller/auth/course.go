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

type internalComputeBookDatetime struct {
	LessonDate string
	StartTime  string
	EndTime    string
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

	var course model.CourseInfo

	err = db.Model(&model.CourseInfo{}).Where("id = ?", courseId).First(&course).Error
	if err != nil {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var userCourseSelected model.UserCourse
	err = db.Model(&model.UserCourse{}).Where("user_id = ? and course_id = ? and flag != ?", userID, course.ID, -1).First(&userCourseSelected).Error
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
		c.cost_price,
		c.display_price,
		c.goal,
		c.add_time AS course_add_time,
		c.update_time AS course_update_time,
		c.status AS course_status,
		c.flag AS course_flag
	`).
		Where("uc.user_id = ? AND uc.flag != ? AND c.flag != ?", userID, -1, -1).
		Order("uc.add_time DESC").
		Scan(&result).Error

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = result
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

	layout := "2006-01-02"
	start, _ := time.Parse(layout, req.StartDate)
	end, _ := time.Parse(layout, req.EndDate)
	var internalResult []internalComputeBookDatetime
	var allDate []string

	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		weekday := int(d.Weekday())
		if weekday == 0 {
			weekday = 7 // Sunday fix
		}
		allDate = append(allDate, d.Format("2006-01-02"))
		for _, slot := range req.TimeSlots {
			if slot.WeekDay == weekday {
				internalResult = append(internalResult, internalComputeBookDatetime{
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

	db := system.GetDb()

	var existResult []model.CourseBookTrans
	// query can book?
	err = db.Model(&model.CourseBookTrans{}).
		Where("teacher_id = ? and course_id = ? and lesson_date IN ?", req.TeacherID, req.CourseID, allDate).
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
						res.Code = codes.CODE_BOOKING_CONFLICT
						res.Msg = fmt.Sprintf("booking conflict on %s %s–%s", want.LessonDate, want.StartTime, want.EndTime)
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
		ledate, err := time.Parse("2025-01-02", r.LessonDate)
		if err != nil {
			saveResult = append(saveResult, model.CourseBookTrans{
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
	}

	db.CreateInBatches(&saveResult, 200)

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

	db := system.GetDb()
	var result []model.CourseBookTrans
	err = db.Model(&model.CourseBookTrans{}).
		Where("user_id = ?", userID).
		Order("lesson_date, start_time ASC").
		Offset(int(pageNo) - 1).
		Limit(int(pageSize)).
		Find(&result).Error
	if err != nil {
		log.Error(err)
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = result
	c.JSON(http.StatusOK, res)
}
