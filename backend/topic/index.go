package topic

import "github.com/langbridge/backend/log"

func init() {
	// go ConsumeToken()
	go ConsumeFlow()
}

func StartSubscription() {
	log.Info("[Sub] system started")
}
