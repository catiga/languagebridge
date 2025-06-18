package system

import (
	"fmt"
	"math/rand"
	"time"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

func GenerateNonce(length int) string {
	letters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func GenerateUserNoNumberOnly() string {
	now := time.Now()
	year := now.Year() % 100
	month := int(now.Month())
	randomPart := ""
	for i := 0; i < 5; i++ {
		randomPart += fmt.Sprintf("%d", rand.Intn(10))
	}
	base := fmt.Sprintf("%02d%02d%s", year, month, randomPart)
	sum := 0
	for _, c := range base {
		sum += int(c - '0')
	}
	checkDigit := sum % 10
	return base + fmt.Sprintf("%d", checkDigit)
}
