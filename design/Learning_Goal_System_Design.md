# 学习目标系统设计文档

## 🎯 系统概述

学习目标系统是V2版本的核心功能，它将学习目标作为驱动整个学习体验的中心，实现个性化、目标导向的学习路径。

## 🏗️ 系统架构

### 1. 学习目标层级结构
```
长期目标 (Long-term Goal) - 6-12个月
├── 中期目标 (Medium-term Goal) - 2-6个月
│   ├── 短期目标 (Short-term Goal) - 2-8周
│   └── 短期目标 (Short-term Goal) - 2-8周
└── 中期目标 (Medium-term Goal) - 2-6个月
    ├── 短期目标 (Short-term Goal) - 2-8周
    └── 短期目标 (Short-term Goal) - 2-8周
```

### 2. 数据流向
```
学习目标设置 → AI评估 → 学习计划生成 → Study Planner → 进度跟踪 → 目标调整
```

## 📊 数据结构设计

### 学习目标表 (learning_goals)
```sql
CREATE TABLE learning_goals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    goal_type ENUM('long_term', 'medium_term', 'short_term') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    target_date DATE NOT NULL,
    target_level INT NOT NULL,
    current_level INT NOT NULL,
    status ENUM('active', 'completed', 'paused') DEFAULT 'active',
    progress INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_goal_type (goal_type)
);
```

### 学习目标进度表 (learning_goal_progress)
```sql
CREATE TABLE learning_goal_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    goal_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    completed_tasks INT DEFAULT 0,
    total_tasks INT DEFAULT 0,
    study_hours INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES learning_goals(id),
    INDEX idx_goal_id (goal_id),
    INDEX idx_student_id (student_id)
);
```

## 🔌 API接口设计

### 1. 学习目标管理接口

#### 创建学习目标
```
POST /spwapi/auth/student/goal/create
Content-Type: application/json

{
    "student_id": 123,
    "goal_type": "medium_term",
    "title": "Master Business English for International Meetings",
    "description": "Develop professional vocabulary and presentation skills for international business communication",
    "target_date": "2025-03-31",
    "target_level": 4,
    "current_level": 2
}

Response:
{
    "code": 0,
    "msg": "success",
    "data": {
        "id": 456,
        "student_id": 123,
        "goal_type": "medium_term",
        "title": "Master Business English for International Meetings",
        "description": "Develop professional vocabulary and presentation skills for international business communication",
        "target_date": "2025-03-31",
        "target_level": 4,
        "current_level": 2,
        "status": "active",
        "progress": 0,
        "created_at": "2024-12-27T10:30:00Z"
    }
}
```

#### 获取学生学习目标列表
```
GET /spwapi/auth/student/goals/{student_id}

Response:
{
    "code": 0,
    "msg": "success",
    "data": [
        {
            "id": 456,
            "student_id": 123,
            "goal_type": "long_term",
            "title": "Achieve Business English B2 Level",
            "description": "Master professional English for international business communication",
            "target_date": "2025-12-31",
            "target_level": 4,
            "current_level": 2,
            "status": "active",
            "progress": 35,
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

#### 更新学习目标
```
PUT /spwapi/auth/student/goal/update
Content-Type: application/json

{
    "id": 456,
    "title": "Updated Goal Title",
    "description": "Updated description",
    "target_date": "2025-06-30",
    "target_level": 4,
    "status": "active"
}
```

### 2. 学习统计接口

#### 获取学生学习统计
```
GET /spwapi/auth/student/stats/{student_id}

Response:
{
    "code": 0,
    "msg": "success",
    "data": {
        "student_id": 123,
        "total_study_hours": 28,
        "completed_tasks": 15,
        "total_tasks": 25,
        "upcoming_lessons": 3,
        "last_study_date": "2024-12-27",
        "current_level": 2,
        "target_level": 4,
        "level_progress": 65,
        "active_goals": 2,
        "completed_goals": 1
    }
}
```

#### 获取学习目标进度
```
GET /spwapi/auth/student/goal/progress/{goal_id}

Response:
{
    "code": 0,
    "msg": "success",
    "data": {
        "goal_id": 456,
        "goal_title": "Master Business English for International Meetings",
        "goal_type": "medium_term",
        "progress": 35,
        "completed_tasks": 7,
        "total_tasks": 20,
        "study_hours": 12,
        "days_remaining": 45,
        "is_on_track": true,
        "next_milestone": "Complete vocabulary module"
    }
}
```

### 3. 课程推荐接口

#### 基于学习目标推荐课程
```
GET /spwapi/auth/student/recommended-courses/{student_id}

Response:
{
    "code": 0,
    "msg": "success",
    "data": [
        {
            "course_id": 789,
            "course_name": "Business Meeting English",
            "description": "Learn essential vocabulary and phrases for professional meetings",
            "level": 3,
            "duration": 120,
            "relevance_score": 0.95,
            "goal_alignment": "Directly supports your goal of mastering business English for meetings",
            "prerequisites": ["Basic English conversation skills"],
            "skills_covered": ["Meeting vocabulary", "Presentation skills", "Professional communication"]
        }
    ]
}
```

## 🔄 与Study Planner的集成

### 1. 学习计划生成
- 基于学习目标自动生成学习计划
- 将计划任务分配到Study Planner
- 设置任务优先级和截止日期

### 2. 进度同步
- Study Planner任务完成情况反馈到学习目标进度
- 实时更新目标完成百分比
- 根据进度调整后续学习计划

### 3. 智能推荐
- 基于当前学习目标推荐相关课程
- 根据学习进度调整推荐内容
- 提供个性化的学习路径建议

## 🤖 AI集成策略

### 1. 目标评估
- 分析学习目标的可实现性
- 提供目标调整建议
- 预测完成时间

### 2. 学习路径规划
- 基于目标生成最优学习路径
- 考虑学生当前水平和学习偏好
- 动态调整学习计划

### 3. 进度预测
- 基于历史学习数据预测完成时间
- 识别潜在的学习障碍
- 提供改进建议

## 📱 前端实现要点

### 1. 学习目标设置流程
1. 选择目标类型（长期/中期/短期）
2. 输入目标标题和详细描述
3. 设置目标日期和期望等级
4. 系统生成个性化学习计划

### 2. 进度可视化
- 目标完成进度条
- 学习时长统计图表
- 任务完成情况展示
- 里程碑标记

### 3. 智能推荐展示
- 基于目标的课程推荐
- 相关性评分显示
- 学习路径建议
- 个性化学习提示

## 🚀 实施计划

### 阶段1：基础功能（1-2周）
- [x] 学习目标数据结构设计
- [x] 前端学习目标设置界面
- [ ] 后端学习目标CRUD接口
- [ ] 基础进度跟踪功能

### 阶段2：统计功能（1周）
- [ ] 学习统计接口开发
- [ ] 进度计算逻辑
- [ ] 数据可视化组件

### 阶段3：智能推荐（2周）
- [ ] 课程推荐算法
- [ ] 与Study Planner集成
- [ ] AI评估功能

### 阶段4：优化完善（1周）
- [ ] 性能优化
- [ ] 用户体验改进
- [ ] 测试和调试

## 💡 创新特点

1. **目标驱动学习**：以学习目标为中心，所有功能围绕目标展开
2. **层级化目标管理**：支持长期、中期、短期目标的层级管理
3. **智能推荐系统**：基于学习目标提供个性化课程推荐
4. **实时进度跟踪**：动态更新学习进度和目标完成情况
5. **AI辅助规划**：利用AI技术优化学习路径和进度预测

这个系统将彻底改变传统的学习模式，从被动学习转变为主动、目标导向的学习体验。 