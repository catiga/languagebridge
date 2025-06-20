package utils

import (
	"fmt"
	"math/rand"
	"strconv"
	"time"
)

func GenerateBookNo(userID int64, t time.Time) string {
	datePart := t.Format("060102")

	seed := userID ^ time.Now().UnixNano()
	r := rand.New(rand.NewSource(seed))
	randomNum := r.Intn(100000)
	randomStr := fmt.Sprintf("%05d", randomNum)

	raw := datePart + randomStr

	sum := 0
	for _, ch := range raw {
		sum += int(ch - '0')
	}
	checkDigit := sum % 10

	return raw + strconv.Itoa(checkDigit)
}
