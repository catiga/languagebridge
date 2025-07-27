# Study Planner 集成指南

## 🎯 集成策略

完全复用现有的Study Planner功能，将我们的学习目标系统与现有的Stage Goal系统无缝对接。

## 📊 数据映射关系

### 学习目标 ↔ Stage Goal 映射

| 学习目标字段 | Stage Goal字段 | 说明 |
|-------------|---------------|------|
| `title` | `title` | 目标标题 |
| `description` | `description` | 目标描述 |
| `target_date` | `end_date` | 目标完成日期 |
| `goal_type` | - | 新增字段，用于区分长期/中期/短期目标 |
| `target_level` | - | 新增字段，目标等级 |
| `current_level` | - | 新增字段，当前等级 |
| `status` | - | 新增字段，目标状态 |

### 任务 ↔ Task 映射

| 学习任务字段 | Task字段 | 说明 |
|-------------|---------|------|
| `content` | `content` | 任务内容 |
| `exe_date` | `exe_date` | 执行日期 |
| `status` | `status` | 任务状态 |
| `stageGoalId` | `stageGoalId` | 关联的Stage Goal ID |

## 🔌 现有接口复用

### 1. Stage Goal 管理接口

#### 创建Stage Goal (学习目标)
```
POST /spwapi/auth/planner/add
Content-Type: application/json

{
    "title": "Master Business English for International Meetings",
    "description": "Develop professional vocabulary and presentation skills",
    "goal": "Master Business English for International Meetings",
    "startDate": "2024-12-27",
    "endDate": "2025-03-31",
    "student_id": 123
}
```

#### 获取Stage Goal列表
```
GET /spwapi/auth/planner/pull?student_id=123

Response:
{
    "code": 0,
    "msg": "success",
    "data": [
        {
            "id": 456,
            "title": "Master Business English for International Meetings",
            "description": "Develop professional vocabulary and presentation skills",
            "goal": "Master Business English for International Meetings",
            "start_date": "2024-12-27",
            "end_date": "2025-03-31",
            "student_id": 123,
            "tasks": [...]
        }
    ]
}
```

#### 更新Stage Goal
```
PUT /spwapi/auth/planner/update
Content-Type: application/json

{
    "id": 456,
    "title": "Updated Goal Title",
    "description": "Updated description",
    "goal": "Updated goal",
    "startDate": "2024-12-27",
    "endDate": "2025-06-30"
}
```

#### 删除Stage Goal
```
DELETE /spwapi/auth/planner/delete
Content-Type: application/json

{
    "id": 456
}
```

### 2. 任务管理接口

#### 添加任务
```
POST /spwapi/auth/planner/task/add
Content-Type: application/json

{
    "stageGoalId": 456,
    "content": "Practice business meeting vocabulary",
    "exe_date": "2024-12-28",
    "category": "Vocabulary",
    "priority": "High"
}
```

#### 更新任务状态
```
PUT /spwapi/auth/planner/task/update
Content-Type: application/json

{
    "id": 789,
    "status": "done"
}
```

#### 删除任务
```
DELETE /spwapi/auth/planner/task/delete
Content-Type: application/json

{
    "id": 789
}
```

### 3. 统计接口

#### 获取学习计划详细数据
```
GET /spwapi/auth/planner/view?overview_id=456

Response:
{
    "code": 0,
    "msg": "success",
    "data": [
        {
            "id": 456,
            "student_id": 123,
            "title": "Master Business English",
            "description": "Develop professional vocabulary",
            "goal": "Master Business English for International Meetings",
            "start_date": "2024-12-27",
            "end_date": "2025-03-31",
            "tasks": [
                {
                    "id": 789,
                    "student_id": 123,
                    "exe_date": "2024-12-28",
                    "start_time": "09:00",
                    "end_time": "10:00",
                    "duration": 60,
                    "priority": 1,
                    "content": "Practice business meeting vocabulary",
                    "note": "Focus on presentation skills",
                    "add_time": "2024-12-27T10:00:00Z",
                    "status": "done"
                }
            ],
            "goal_period_type": "medium_term",
            "target_level": 3,
            "init_level": 1,
            "status": "00"
        }
    ]
}
```

## 🔄 前端集成方案

### 1. LearningGoalModal 集成

```typescript
// 创建学习目标时调用现有接口
const stageGoalData = {
    title: formData.title,
    description: formData.description,
    goal: formData.title,
    startDate: new Date().toISOString().split('T')[0],
    endDate: formData.target_date,
    student_id: student.id
};

const res = await apiClient.post('/spwapi/auth/planner/add', stageGoalData);
```

### 2. StudentCenteredOverview 集成

```typescript
// 获取学生数据时同时获取Study Planner数据
const plannerRes = await apiClient.get(`/spwapi/auth/planner/pull?student_id=${member.id}`);
if (plannerRes && plannerRes.code === 0 && Array.isArray(plannerRes.data)) {
    const stageGoals = plannerRes.data;
    const tasks = stageGoals.flatMap(goal => goal.tasks || []);
    
    // 计算真实进度
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const totalTasks = tasks.length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}
```

### 3. Study Planner 页面集成

```typescript
// V2版本的Study Planner直接复用现有组件
export default function V2StudyPlannerPage() {
    const studentId = useSearchParams().get('student_id');
    
    // 直接使用现有的Study Planner组件
    return <StudyPlannerPage />;
}
```

## 🎨 UI/UX 优化建议

### 1. 学习目标类型标识

在现有的Stage Goal界面中添加目标类型标识：

```typescript
const getGoalTypeBadge = (goalType: string) => {
    const badges = {
        'long_term': { label: 'Long-term', color: 'purple' },
        'medium_term': { label: 'Medium-term', color: 'blue' },
        'short_term': { label: 'Short-term', color: 'green' }
    };
    return badges[goalType] || badges['medium_term'];
};
```

### 2. 进度可视化增强

在Study Planner中添加更丰富的进度展示：

```typescript
// 在Stage Goal卡片中显示目标类型和等级信息
<div className="flex items-center space-x-2 mb-2">
    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${goalTypeBadge.color}-100 text-${goalTypeBadge.color}-800`}>
        {goalTypeBadge.label}
    </span>
    <span className="text-xs text-gray-500">
        Level {currentLevel} → {targetLevel}
    </span>
</div>
```

## 🚀 实施步骤

### 阶段1：基础集成（已完成）
- [x] LearningGoalModal 调用现有接口
- [x] StudentCenteredOverview 获取真实数据
- [x] V2 Study Planner 页面创建

### 阶段2：数据增强（进行中）
- [ ] 在Stage Goal表中添加目标类型字段
- [ ] 在Stage Goal表中添加等级字段
- [ ] 更新相关接口支持新字段

### 阶段3：UI优化（待实施）
- [ ] 在Study Planner中显示目标类型
- [ ] 增强进度可视化
- [ ] 添加目标等级显示

### 阶段4：功能扩展（待实施）
- [ ] 基于目标类型的智能推荐
- [ ] 目标完成度预测
- [ ] 学习路径优化

## 💡 优势

1. **零重复开发**：完全复用现有的Study Planner功能
2. **数据一致性**：使用同一套数据结构和接口
3. **功能完整性**：保持所有现有功能不变
4. **渐进式升级**：可以逐步添加新功能而不影响现有功能
5. **维护简单**：只需要维护一套代码

## 🔧 注意事项

1. **数据兼容性**：确保新字段不影响现有功能
2. **接口稳定性**：保持现有接口的向后兼容性
3. **用户体验**：确保新功能与现有UI风格一致
4. **性能优化**：避免重复请求，合理缓存数据

这个集成方案完美地复用了现有的Study Planner功能，同时为我们的学习目标系统提供了坚实的基础。 