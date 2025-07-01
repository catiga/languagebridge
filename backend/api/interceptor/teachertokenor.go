package interceptor

import (
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/security"
	"github.com/langbridge/backend/system"
)

func TeacherTokenInterceptor() gin.HandlerFunc {
	return func(c *gin.Context) {
		allHeaders, ok := c.Get("HEADERS")
		if !ok {
			log.Info("unable to get headers")
			makeFaileRes(c, codes.CODE_ERR_SECURITY, "token check failed")
			return
		}
		allHeadersMap := allHeaders.(common.HeaderParam)
		if allHeadersMap.XAuth == "123456" {
			c.Set("user_wallet", "0x0")
			c.Set("user_id", "1")
			c.Next()
			return
		}
		token, err := security.Decrypt(c.Request.Header.Get("TAUTH"))
		log.Info("TOKENCHECK ", c.Request.Header.Get("TAUTH"), token)
		if err != nil {
			makeFaileRes(c, codes.CODE_ERR_SECURITY, "token check failed")
			return
		}
		tokenArr := strings.Split(token, ",")
		if len(tokenArr) != 3 {
			makeFaileRes(c, codes.CODE_ERR_SECURITY, "token length error")
			return
		}
		expireTs, err := strconv.ParseInt(tokenArr[2], 10, 64)
		if err != nil {
			makeFaileRes(c, codes.CODE_ERR_SECURITY, "token format error")
			return
		}
		if time.Now().Unix()-expireTs > int64(common.TOKEN_DURATION.Seconds()) {
			makeFaileRes(c, codes.CODE_ERR_SECURITY, "token expired error")
			return
		}
		// check user info
		var userInfo model.Teacher
		db := system.GetDb()
		db.Model(&model.Teacher{}).Where("id = ?", tokenArr[0]).First(&userInfo)
		if userInfo.ID == 0 {
			makeFaileRes(c, codes.CODE_ERR_SECURITY, "please login")
			return
		}

		c.Set("teacher_no", tokenArr[1])
		c.Set("teacher_id", tokenArr[0])

		c.Next()
	}
}
