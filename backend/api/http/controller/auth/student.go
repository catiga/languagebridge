package auth

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/api/http/request"
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

type StudentProfileRequest struct {
	Avatar string `json:"avatar"`
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
			Avatar:  studentInfo.Avatar,
		},
	}
	c.JSON(http.StatusOK, res)
}

func StudentUpdateProfile(c *gin.Context) {
	var req StudentProfileRequest
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

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()

	if len(req.Avatar) > 0 {
		db.Model(&model.UserMember{}).Where("id = ?", student_id).Update("avatar", req.Avatar)
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

// study plan for student
func StudentCreateStageGoal(c *gin.Context) {
	var req request.CreatePlannerStageGoalRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
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

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	endDate, err := time.Parse("2006-01-02", req.EndDate)

	now := time.Now().Truncate(24 * time.Hour)
	today := time.Date(
		now.Year(), now.Month(), now.Day(),
		0, 0, 0, 0, now.Location(),
	)

	if startDate.Before(today) {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "stage date setting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	if startDate.After(endDate) {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "stage date setting invalid"
		c.JSON(http.StatusOK, res)
		return
	}

	db := system.GetDb()
	var userInfo model.UserInfo
	db.Table("user_info u").Select("u.*").Joins("JOIN user_member um ON u.id = um.user_id").Where("um.id = ?", studentId).Scan(&userInfo)
	if userInfo.ID == 0 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Can not find supervisor info"
		c.JSON(http.StatusOK, res)
		return
	}

	m := model.UserPlanOverview{
		Title:       req.Title,
		Description: req.Description,
		UserID:      userInfo.ID,
		Goal:        req.Goal,
		AddTime:     time.Now(),
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Flag:        0,
		StudentID:   uint64(studentId),
	}
	db.Save(&m)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func StudentPullStageGoal(c *gin.Context) {
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

	db := system.GetDb()

	var overviewList []model.UserPlanOverview
	var taskList []model.UserPlanSchedule
	var overIds []uint64

	err = db.Model(&model.UserPlanOverview{}).Where("student_id = ? and flag != ?", studentId, -1).Find(&overviewList).Error
	if err != nil {
		log.Error(err)
	}
	for _, v := range overviewList {
		overIds = append(overIds, v.ID)
	}
	if len(overIds) > 0 {
		err = db.Model(&model.UserPlanSchedule{}).Where("overview_id IN ? and flag != ?", overIds, -1).Order(("start_time DESC")).Find(&taskList).Error
		if err != nil {
			log.Error(err)
		}
	}

	var retOverviewList []UserPlanOverviewResponse
	for _, v := range overviewList {
		var taskDataSub []UserPlanScheduleResponse
		if len(taskList) > 0 {
			for _, s := range taskList {
				if v.ID == s.OverviewID {
					taskDataSub = append(taskDataSub, UserPlanScheduleResponse{
						ID:        s.ID,
						StudentID: s.StudentID,
						ExeDate:   s.ExeDate,
						StartTime: s.StartTime,
						EndTime:   s.EndTime,
						Duration:  s.Duration,
						Priority:  s.Priority,
						Content:   s.Content,
						Note:      s.Note,
						AddTime:   s.AddTime,
						Status:    s.Status,
					})
				}
			}
		}
		retOverviewList = append(retOverviewList, UserPlanOverviewResponse{
			ID:          v.ID,
			StudentID:   v.StudentID,
			Title:       v.Title,
			Description: v.Description,
			Goal:        v.Goal,
			AddTime:     v.AddTime,
			StartDate:   v.StartDate,
			EndDate:     v.EndDate,
			Tasks:       taskDataSub,
		})
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = retOverviewList

	c.JSON(http.StatusOK, res)
}

func StudentAddStageTask(c *gin.Context) {
	var req request.AddStageTaskRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
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

	var overview model.UserPlanOverview
	db.Model(&model.UserPlanOverview{}).Where("id = ?", req.OverviewID).First(&overview)
	if overview.ID == 0 || overview.StudentID != uint64(studentId) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Overview not found"
		c.JSON(http.StatusOK, res)
		return
	}

	var saveList []model.UserPlanSchedule
	if req.Repeat {
		var firstDateStr = req.ExeDate
		var endDateStr = overview.EndDate
		if _, err := time.Parse("2006-01-02", endDateStr); err != nil {
			res.Code = codes.CODE_ERR_SETTING
			res.Msg = "Can't loop task because overview end date empty"
			c.JSON(http.StatusOK, res)
			return
		}
		for {
			saveList = append(saveList, model.UserPlanSchedule{
				Content:    req.Content,
				Note:       req.Note,
				ExeDate:    firstDateStr,
				StartTime:  req.StartTime,
				EndTime:    req.EndTime,
				Duration:   req.Duration,
				Priority:   req.Priority,
				OverviewID: req.OverviewID,
				Flag:       0,
				StudentID:  uint64(studentId),
				AddTime:    time.Now(),
				Status:     common.StudyPlannerScheduleCreate,
			})
			if firstDateStr == endDateStr {
				break
			}
			var err error
			firstDateStr, err = utils.GetNextDate(firstDateStr)
			if err != nil {
				res.Code = codes.CODE_ERR_SETTING
				res.Msg = "Invalid repeat date sequence"
				c.JSON(http.StatusOK, res)
				return
			}
		}
	} else {
		saveList = append(saveList, model.UserPlanSchedule{
			Content:    req.Content,
			Note:       req.Note,
			ExeDate:    req.ExeDate,
			StartTime:  req.StartTime,
			EndTime:    req.EndTime,
			Duration:   req.Duration,
			Priority:   req.Priority,
			OverviewID: req.OverviewID,
			Flag:       0,
			StudentID:  uint64(studentId),
			AddTime:    time.Now(),
		})
	}

	db.CreateInBatches(&saveList, 30)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func StudentStatStageGoal(c *gin.Context) {
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
	overviewIdStr, exist := c.GetQuery("overview_id")
	overview_id := int64(0)
	if !exist {
		res.Code = codes.CODE_ERR_PARA_EMPTY
		res.Msg = "Please select overview"
		c.JSON(http.StatusOK, res)
		return
	}
	overview_id, _ = strconv.ParseInt(overviewIdStr, 10, 64)

	db := system.GetDb()

	var userOverView model.UserPlanOverview
	db.Model(&model.UserPlanOverview{}).Where("id = ?", overview_id).First(&userOverView)
	if userOverView.ID == 0 || userOverView.StudentID != uint64(studentId) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Study planner not found"
		c.JSON(http.StatusOK, res)
		return
	}
	var statResult []model.UserPlanSchedule
	db.Model(&model.UserPlanSchedule{}).Where("overview_id = ? and flag != ?", userOverView.ID, -1).Find(&statResult)

	type StatStruct struct {
		Create            int
		Ongoing           int
		Unfinished        int
		FullyComplete     int
		FewComplete       int
		MostlyComplete    int
		PartiallyComplete int
		LatelyComplete    int
	}
	var stat StatStruct
	for _, v := range statResult {
		switch v.Status {
		case common.StudyPlannerScheduleCreate:
			stat.Create += 1
		case common.StudyPlannerScheduleOngoing:
			stat.Ongoing += 1
		case common.StudyPlannerScheduleUnfinished:
			stat.Unfinished += 1
		case common.StudyPlannerScheduleFullyComplete:
			stat.FullyComplete += 1
		case common.StudyPlannerScheduleFewComplete:
			stat.FewComplete += 1
		case common.StudyPlannerScheduleMostlyComplete:
			stat.MostlyComplete += 1
		case common.StudyPlannerSchedulePartiallyComplete:
			stat.PartiallyComplete += 1
		case common.StudyPlannerScheduleLatelyComplete:
			stat.LatelyComplete += 1
		}
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = stat

	c.JSON(http.StatusOK, res)
}

func StudentUpdateStageTask(c *gin.Context) {
	var req request.UpdateStageTaskRequest
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	if err := c.ShouldBindJSON(&req); err != nil {
		res.Code = codes.CODE_ERR_REQFORMAT
		res.Msg = "invalid request" + err.Error()
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

	var overview model.UserPlanOverview
	var stageTask model.UserPlanSchedule
	db.Model(&model.UserPlanSchedule{}).Where("id = ?", req.ID).First(&stageTask)
	if stageTask.ID == 0 || stageTask.Flag == -1 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Task not found or be deleted"
		c.JSON(http.StatusOK, res)
		return
	}
	db.Model(&model.UserPlanOverview{}).Where("id = ?", stageTask.OverviewID).First(&overview)
	if overview.StudentID != uint64(studentId) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Task not found or be deleted"
		c.JSON(http.StatusOK, res)
		return
	}
	if !common.StatusCheck(req.Status) {
		res.Code = codes.CODE_ERR_BAD_PARAMS
		res.Msg = "Please select the correct status"
		c.JSON(http.StatusOK, res)
		return
	}

	var note string = stageTask.Note
	if len(note) == 0 {
		note = req.Note
	} else {
		note = stageTask.Note + "\n" + req.Note
	}
	var updatesMap map[string]interface{} = map[string]interface{}{
		"status": req.Status,
		"note":   note,
	}
	db.Model(&model.UserPlanSchedule{}).Where("id = ?", stageTask.ID).Updates(updatesMap)

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}

func StudentDeleteStageTask(c *gin.Context) {
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
	idStr, exist := c.GetQuery("id")
	id := int64(0)
	if !exist {
		res.Code = codes.CODE_ERR_PARA_EMPTY
		res.Msg = "Please select task for deleting"
		c.JSON(http.StatusOK, res)
		return
	}
	id, _ = strconv.ParseInt(idStr, 10, 64)

	db := system.GetDb()
	var overview model.UserPlanOverview
	var stageTask model.UserPlanSchedule
	db.Model(&model.UserPlanSchedule{}).Where("id = ?", id).First(&stageTask)
	if stageTask.ID == 0 || stageTask.Flag == -1 {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Task not found or be deleted"
		c.JSON(http.StatusOK, res)
		return
	}
	db.Model(&model.UserPlanOverview{}).Where("id = ?", stageTask.OverviewID).First(&overview)
	if overview.StudentID != uint64(studentId) {
		res.Code = codes.CODE_ERR_OBJ_NOT_FOUND
		res.Msg = "Task not found or be deleted"
		c.JSON(http.StatusOK, res)
		return
	}

	db.Model(&model.UserPlanSchedule{}).Where("id = ?", id).Update("flag", -1)
	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = nil

	c.JSON(http.StatusOK, res)
}
