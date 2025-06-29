package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateJWT(timeStart time.Time, duration time.Duration) (string, error) {
	jitsiPrivateKey := os.Getenv("JITSI_PRIVATE_KEY")
	jitisiAppID := os.Getenv("JITSI_APP_ID")
	jitsiApiID := os.Getenv("JITSI_API_ID")

	privateKeyData, err := os.ReadFile(jitsiPrivateKey)
	if err != nil {
		return "", err
	}

	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM(privateKeyData)
	if err != nil {
		return "", err
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"aud":  "jitsi",
		"iss":  "chat",
		"sub":  jitisiAppID,
		"room": "*",
		"nbf":  timeStart.Unix(),
		"exp":  timeStart.Add(duration).Unix(),
		"context": map[string]interface{}{
			"user": map[string]interface{}{
				"hidden-from-recorder": false,
				"moderator":            true,
				"name":                 "langbridge1215",
				"id":                   "langbridge1215",
				"avatar":               "",
				"email":                "langbridge1215@gmail.com",
			},
			"features": map[string]interface{}{
				"livestreaming":     true,
				"outbound-call":     true,
				"sip-outbound-call": false,
				"transcription":     true,
				"recording":         true,
				"flip":              false,
			},
			"room": map[string]interface{}{
				"regex": false,
			},
		},
	})

	token.Header["kid"] = jitsiApiID
	token.Header["alg"] = "RS256"
	token.Header["typ"] = "JWT"

	tokenString, err := token.SignedString(privateKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
