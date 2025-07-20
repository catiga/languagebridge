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

func StudentTokenInterceptor() gin.HandlerFunc {
	return func(c *gin.Context) {
		headers, ok := c.Get("HEADERS")
		if !ok {
			log.Info("unable to get headers")
			makeFaileRes(c, codes.CODE_ERR_SECURITY, "token check failed")
			return
		}
		log.Info(headers)
		sauth := c.Request.Header.Get("SAUTH")
		token, err := security.Decrypt(sauth)
		log.Info("STUDENT TOKENCHECK ", sauth, token)
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
		var userInfo model.UserMember
		db := system.GetDb()
		db.Model(&model.UserMember{}).Where("id = ?", tokenArr[0]).First(&userInfo)
		if userInfo.ID == 0 {
			makeFaileRes(c, codes.CODE_ERR_SECURITY, "please login")
			return
		}

		c.Set("student_id", tokenArr[0])

		c.Next()
	}
}
