package auth

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
	"gorm.io/gorm"
)

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
