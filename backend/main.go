package main

import (
	"github.com/joho/godotenv"
	router "github.com/langbridge/backend/api"
	"github.com/langbridge/backend/log"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	//topic.StartSubscription()

	router.Init()
}
