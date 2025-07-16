package auth

import (
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
)

type StudentResponse struct {
	ID      uint64    `json:"id"`
	Email   string    `gorm:"column:email" json:"email"`
	Name    string    `gorm:"column:name" json:"name"`
	AddTime time.Time `json:"add_time"`
	Avatar  string    `gorm:"column:avatar" json:"avatar"`
}

func StudentOverview(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()
	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"

	currentUser, exist := c.Get("student_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	student_id, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	var studentCourseCount int64
	var lessonUpcomingCount int64
	var lessonPastCount int64
	var totalStudentCount int64

	var studentInfo model.UserMember
	var currentWeekCourseList []SimpleCourseBookObject

	db.Model(&model.UserMember{}).Where("id = ?", student_id).First(&studentInfo)

	err = db.Model(&model.UserCourse{}).
		Where("student_id = ?", student_id).
		Count(&studentCourseCount).Error
	if err != nil {
		log.Error("overview-fetch total course error", err)
	}

	err = db.Table("course_book_trans ct").Joins("JOIN user_course uc ON ct.uc_id = uc.id").
		Where("uc.student_id = ? and ct.lesson_date > ?", studentInfo.ID, time.Now()).Count(&lessonUpcomingCount).Error
	if err != nil {
		log.Error("overview-fetch upcoming lession error", err)
	}

	err = db.Table("course_book_trans ct").Joins("JOIN user_course uc ON ct.uc_id = uc.id").
		Where("uc.student_id = ? and ct.lesson_date < ?", studentInfo.ID, time.Now()).Count(&lessonPastCount).Error

	err = db.Table("course_book_trans ct").Joins("JOIN user_course uc ON ct.uc_id = uc.id").
		Where("uc.student_id = ?", studentInfo.ID).Select("DISTINCT uc.student_id").Count(&totalStudentCount).Error

	currentWeekStart, currentWeekEnd := utils.GetCurrentWeekRange()
	err = db.Table("course_book_trans as b").
		Select(`b.id as book_id, b.booking_no as book_no, b.lesson_date, b.start_time, b.end_time, 
			b.course_id, c.name as course_name, b.teacher_id, t.name AS teacher_name, b.user_id`).
		Joins("JOIN user_course uc ON b.uc_id = uc.id").
		Joins("LEFT JOIN course_info c ON b.course_id = c.id").
		Joins("LEFT JOIN teacher_info t ON b.teacher_id = t.id").
		Where("uc.student_id = ? AND b.lesson_date >= ? AND b.lesson_date <= ?", student_id, currentWeekStart, currentWeekEnd).
		Order("b.lesson_date, b.start_time asc").
		Scan(&currentWeekCourseList).Error
	if err != nil {
		log.Error("overview-fetch week course list error", err)
	}

	res.Data = struct {
		MyCourseCount       int64                    `json:"my_course_count"`
		LessonUpcomingCount int64                    `json:"lesson_upcoming_count"`
		LessonPastCount     int64                    `json:"lesson_past_count"`
		TotalStudentCount   int64                    `json:"total_student_count"`
		CurrentWeekCourses  []SimpleCourseBookObject `json:"current_week_courses"`
		UpdatedStudent      StudentResponse          `json:"updated_student"`
	}{
		MyCourseCount:       studentCourseCount,
		LessonUpcomingCount: lessonUpcomingCount,
		LessonPastCount:     lessonPastCount,
		TotalStudentCount:   totalStudentCount,
		CurrentWeekCourses:  currentWeekCourseList,
		UpdatedStudent: StudentResponse{
			ID:      studentInfo.ID,
			Email:   studentInfo.Email,
			Name:    studentInfo.Name,
			AddTime: studentInfo.AddTime,
			Avatar:  "",
		},
	}
	c.JSON(http.StatusOK, res)
}

func StudentCourseGetMeetingInfo(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("student_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	studentId, err := strconv.ParseInt(currentUserStr, 10, 64)
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
	// err = db.Model(&model.CourseBookTrans{}).Where("id = ? and user_id = ?", btid, userID).First(&bookTran).Error
	err = db.Table("course_book_trans ct").Select("ct.*").
		Joins("JOIN user_course uc on ct.uc_id = uc.id").
		Where("uc.student_id = ? and ct.id = ?", studentId, btid).Scan(&bookTran).Error

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
	db.Model(&model.UserMember{}).Where("id = ?", studentId).First(&studentInfo)

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

func StudentCourseGetMeetingEnd(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("student_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	studentId, err := strconv.ParseInt(currentUserStr, 10, 64)
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
	err = db.Table("course_book_trans ct").Select("ct.*").
		Joins("JOIN user_course uc on ct.uc_id = uc.id").
		Where("uc.student_id = ? and ct.id = ?", studentId, btid).Scan(&bookTran).Error

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

func StudentCourseMeetingNodeAdd(c *gin.Context) {
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

	currentUser, exist := c.Get("student_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	studentId, err := strconv.ParseInt(currentUserStr, 10, 64)
	if err != nil {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var bookTran model.CourseBookTrans
	// err = db.Model(&model.CourseBookTrans{}).Where("id = ? and user_id = ?", req.BtID, userID).First(&bookTran).Error

	err = db.Table("course_book_trans ct").Select("ct.*").
		Joins("JOIN user_course uc on ct.uc_id = uc.id").
		Where("uc.student_id = ? and ct.id = ?", studentId, req.BtID).Scan(&bookTran).Error

	if err != nil {
		log.Error("fetch course meeting error", err)
	}

	if bookTran.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "course not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var note = model.CourseMeetingNote{
		BtID:      bookTran.ID,
		UserID:    bookTran.UserID,
		TeacherID: bookTran.TeacherID,
		StudentID: uint64(studentId),
		Note:      req.Note,
		AddTime:   time.Now(),
		Source:    "0",
	}
	db.Save(&note)

	c.JSON(http.StatusOK, res)
}

func StudentCourseMeetingNodeFetch(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	currentUser, exist := c.Get("student_id")

	if !exist {
		res.Code = codes.CODE_ERR_AUTHTOKEN_FAIL
		res.Msg = "token invalid, please relogin"
		c.JSON(http.StatusOK, res)
		return
	}
	currentUserStr, _ := currentUser.(string)
	studentId, err := strconv.ParseInt(currentUserStr, 10, 64)
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
	err = db.Model(&model.CourseMeetingNote{}).Where("bt_id = ? and student_id = ? and source = ?", btid, studentId, 0).Order("add_time DESC").Find(&notes).Error

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
