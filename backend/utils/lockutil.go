package utils

import (
	"fmt"
	"sync"
)

const (
	CategoryOverviewAssessment = "goal/assessment/exam"
)

// 内部结构体：带超时锁和状态
type overviewLock struct {
	mu     *sync.Mutex
	active bool
}

// 全局锁映射
var overviewLocks = sync.Map{} // map[uint64]*overviewLock

// TryLock 尝试对 overviewId 加锁，如果正在处理中则返回 false
func TryLock(overviewId uint64, category string) bool {
	var key string = fmt.Sprintf("%s-%d", category, overviewId)
	raw, _ := overviewLocks.LoadOrStore(key, &overviewLock{
		mu:     &sync.Mutex{},
		active: false,
	})
	lock := raw.(*overviewLock)

	if lock.active {
		return false
	}

	// 设置 active=true，进入锁定状态
	lock.active = true
	lock.mu.Lock()
	return true
}

// Unlock 解锁，并重置 active 状态
func Unlock(overviewId uint64, category string) {
	var key string = fmt.Sprintf("%s-%d", category, overviewId)
	raw, ok := overviewLocks.Load(key)
	if !ok {
		return
	}
	lock := raw.(*overviewLock)
	lock.active = false
	lock.mu.Unlock()
}
