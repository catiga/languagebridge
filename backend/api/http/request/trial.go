package request

import "time"

type TrialLessonApplyRequest struct {
	CourseID  uint64 `json:"course_id"`
	TeacherID uint64 `json:"teacher_id"`
}

type TrialLessonAssignRequest struct {
	ID        uint64    `json:"id"`
	ApplyTime time.Time `json:"apply_time"`
}
