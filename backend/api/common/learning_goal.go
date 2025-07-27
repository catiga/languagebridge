package common

// LearningGoal 学习目标数据结构
type LearningGoal struct {
	ID           uint64 `json:"id" db:"id"`
	StudentID    uint64 `json:"student_id" db:"student_id"`
	GoalType     string `json:"goal_type" db:"goal_type"` // long_term, medium_term, short_term
	Title        string `json:"title" db:"title"`
	Description  string `json:"description" db:"description"`
	TargetDate   string `json:"target_date" db:"target_date"`
	TargetLevel  int    `json:"target_level" db:"target_level"`
	CurrentLevel int    `json:"current_level" db:"current_level"`
	Status       string `json:"status" db:"status"`     // active, completed, paused
	Progress     int    `json:"progress" db:"progress"` // 0-100
	CreatedAt    string `json:"created_at" db:"created_at"`
	UpdatedAt    string `json:"updated_at" db:"updated_at"`
}

// CreateLearningGoalRequest 创建学习目标请求
type CreateLearningGoalRequest struct {
	StudentID    uint64 `json:"student_id" validate:"required"`
	GoalType     string `json:"goal_type" validate:"required,oneof=long_term medium_term short_term"`
	Title        string `json:"title" validate:"required,min=1,max=200"`
	Description  string `json:"description" validate:"required,min=1,max=1000"`
	TargetDate   string `json:"target_date" validate:"required"`
	TargetLevel  int    `json:"target_level" validate:"required,min=1,max=5"`
	CurrentLevel int    `json:"current_level" validate:"required,min=1,max=5"`
}

// UpdateLearningGoalRequest 更新学习目标请求
type UpdateLearningGoalRequest struct {
	ID          uint64 `json:"id" validate:"required"`
	Title       string `json:"title" validate:"required,min=1,max=200"`
	Description string `json:"description" validate:"required,min=1,max=1000"`
	TargetDate  string `json:"target_date" validate:"required"`
	TargetLevel int    `json:"target_level" validate:"required,min=1,max=5"`
	Status      string `json:"status" validate:"required,oneof=active completed paused"`
}

// LearningGoalProgress 学习目标进度
type LearningGoalProgress struct {
	GoalID         uint64 `json:"goal_id"`
	GoalTitle      string `json:"goal_title"`
	GoalType       string `json:"goal_type"`
	Progress       int    `json:"progress"` // 0-100
	CompletedTasks int    `json:"completed_tasks"`
	TotalTasks     int    `json:"total_tasks"`
	StudyHours     int    `json:"study_hours"`
	DaysRemaining  int    `json:"days_remaining"`
	IsOnTrack      bool   `json:"is_on_track"`
	NextMilestone  string `json:"next_milestone"`
}

// StudentLearningStats 学生学习统计
type StudentLearningStats struct {
	StudentID       uint64 `json:"student_id"`
	TotalStudyHours int    `json:"total_study_hours"`
	CompletedTasks  int    `json:"completed_tasks"`
	TotalTasks      int    `json:"total_tasks"`
	UpcomingLessons int    `json:"upcoming_lessons"`
	LastStudyDate   string `json:"last_study_date"`
	CurrentLevel    int    `json:"current_level"`
	TargetLevel     int    `json:"target_level"`
	LevelProgress   int    `json:"level_progress"` // 0-100
	ActiveGoals     int    `json:"active_goals"`
	CompletedGoals  int    `json:"completed_goals"`
}

// RecommendedCourse 基于学习目标推荐的课程
type RecommendedCourse struct {
	CourseID       uint64   `json:"course_id"`
	CourseName     string   `json:"course_name"`
	Description    string   `json:"description"`
	Level          int      `json:"level"`
	Duration       int      `json:"duration"`        // 分钟
	RelevanceScore float64  `json:"relevance_score"` // 0-1, 与学习目标的相关性
	GoalAlignment  string   `json:"goal_alignment"`  // 如何帮助实现学习目标
	Prerequisites  []string `json:"prerequisites"`
	SkillsCovered  []string `json:"skills_covered"`
}
