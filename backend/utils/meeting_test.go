package utils

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/subosito/gotenv"
)

func TestJWT(t *testing.T) {
	gotenv.Load("../.env")
	privateKeyData, err := os.ReadFile("/Users/jclee/Downloads/Key 2025_6_29 17_03_10.pk")
	const appId = "vpaas-magic-cookie-a72e88e466dd449c891fb37ea83a09ed"
	const kid = "vpaas-magic-cookie-a72e88e466dd449c891fb37ea83a09ed/9327f4"
	if err != nil {
		panic(err)
	}

	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM(privateKeyData)
	if err != nil {
		panic(err)
	}

	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"aud":  "jitsi",
		"iss":  "chat",
		"sub":  appId,
		"room": "*",
		"nbf":  now.Unix(),
		"exp":  now.Add(time.Hour).Unix(), // 1 hour expiry
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

	token.Header["kid"] = kid
	token.Header["alg"] = "RS256"
	token.Header["typ"] = "JWT"

	tokenString, err := token.SignedString(privateKey)
	if err != nil {
		panic(err)
	}

	fmt.Println(tokenString)
}
