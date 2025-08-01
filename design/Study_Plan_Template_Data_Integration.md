# Study Plan Template Data Integration

## 概述
本文档说明了学习计划模板编辑器的数据对接完成情况，包括API数据结构解析和前端显示逻辑。

## API数据结构

### 返回数据格式
```json
{
    "code": 0,
    "msg": "success",
    "timestamp": 1754038464,
    "data": [
        {
            "id": 1,
            "add_time": "2025-07-31T11:11:59+08:00",
            "agent_record_id": 1,
            "user_id": 1,
            "score": "73",
            "result": "...",
            "assessments": [
                {
                    "id": 3,
                    "add_time": "2025-08-01T16:54:07+08:00",
                    "overview_id": 10,
                    "quiz_record_id": 1,
                    "user_id": 1,
                    "student_id": 1,
                    "init_level": 2,
                    "init_sub_level": 4,
                    "estimated_duration_days": 49,
                    "assess_score": "10",
                    "assess_max_score": "15",
                    "assess_level_estimate": "A2",
                    "assess_over_all_comment": "...",
                    "assess_strengths": "...",
                    "assess_weaknesses": "...",
                    "assess_suggestions": "...",
                    "assess_writing_evaluation": "...",
                    "study_plan_tpl": "[...]"
                }
            ]
        }
    ]
}
```

### 模板数据结构
```json
[
    {
        "week": 1,
        "objective": "Build vocabulary and practice identifying actions",
        "tasks": [
            {
                "content": "Learn 10 new action verbs and use them in sentences.",
                "id": "1-0",
                "priority": "high"
            },
            {
                "content": "Complete a worksheet on identifying actions in sentences.",
                "id": "1-1",
                "priority": "medium"
            },
            {
                "content": "Play a matching game with verbs and their meanings.",
                "id": "1-2",
                "priority": "low"
            }
        ]
    }
]
```

## 前端解析逻辑

### 数据获取和解析
```typescript
const fetchStudyPlanTemplate = async () => {
  const response = await apiClient.get(`/spwapi/auth/aiagent/assessment/view?overview_id=${overviewId}`);
  
  if (response && response.code === 0 && response.data && response.data.length > 0) {
    const data = response.data[0];
    
    if (data.assessments && data.assessments.length > 0) {
      const assessment = data.assessments[0];
      setEstimatedDuration(assessment.estimated_duration_days);
      
      if (assessment.study_plan_tpl) {
        const parsedTemplate = JSON.parse(assessment.study_plan_tpl);
        // 处理模板数据...
      }
    }
  }
};
```

### 模板数据转换
```typescript
const convertedTemplate: StudyPlanTemplate[] = parsedTemplate.map((week, index) => {
  let tasks: StudyPlanTask[] = [];
  
  if (Array.isArray(week.tasks)) {
    if (week.tasks.length > 0 && typeof week.tasks[0] === 'object') {
      // 新格式：对象数组，包含id, content, priority
      tasks = week.tasks.map((task: any) => ({
        id: task.id || `${index}-${Math.random()}`,
        content: task.content || '',
        priority: task.priority || 'medium'
      }));
    } else {
      // 旧格式：字符串数组
      tasks = week.tasks.map((task: string, taskIndex: number) => ({
        id: `${index}-${taskIndex}`,
        content: task,
        priority: 'medium' as const
      }));
    }
  }
  
  return {
    week: week.week || index + 1,
    objective: week.objective || '',
    tasks: tasks
  };
});
```

## 数据结构兼容性

### 支持的数据格式
1. **新格式（推荐）**：
   - `week`: 周数
   - `objective`: 学习目标
   - `tasks`: 对象数组，包含 `id`, `content`, `priority`

2. **旧格式（兼容）**：
   - `day`: 天数（自动转换为周数）
   - `objective`: 学习目标
   - `tasks`: 字符串数组（自动转换为对象格式）

### 自动转换逻辑
- **字段映射**: `day` → `week`
- **任务转换**: 字符串 → `{id, content, priority}`
- **默认值**: 缺失字段使用合理的默认值

## 界面显示

### 周计划显示
- **标题**: "Week 1 of 7" 而不是 "Day 1 of 7"
- **颜色编码**: 不同周数使用不同颜色
- **任务显示**: 显示任务内容、优先级和操作按钮

### 优先级显示
- **高优先级**: 红色星星
- **中优先级**: 黄色星星
- **低优先级**: 绿色空心星星

### 编辑功能
- **内联编辑**: 点击编辑按钮进入编辑模式
- **实时保存**: 编辑后立即更新本地状态
- **任务管理**: 添加、删除、修改任务

## API端点

### 获取模板数据
```
GET /spwapi/auth/aiagent/assessment/view?overview_id={overviewId}
```

### 更新模板
```
POST /spwapi/auth/aiagent/assessment/studyplan/template/update
{
  "overview_id": number,
  "template": StudyPlanTemplate[]
}
```

### 生成学习计划
```
POST /spwapi/auth/aiagent/assessment/studyplan/generate
{
  "overview_id": number,
  "template": StudyPlanTemplate[],
  "start_date": string,
  "end_date": string
}
```

## 错误处理

### 数据解析错误
- JSON解析失败时显示错误提示
- 使用默认值处理缺失字段
- 记录错误日志便于调试

### 网络错误
- API调用失败时显示友好错误信息
- 提供重试机制
- 保持用户界面响应性

### 验证错误
- 验证必要字段是否存在
- 检查数据格式是否正确
- 提供详细的错误信息

## 性能优化

### 数据加载
- 使用loading状态提供用户反馈
- 异步加载避免界面阻塞
- 错误边界处理异常情况

### 状态管理
- 使用React hooks管理组件状态
- 避免不必要的重新渲染
- 优化数据更新逻辑

## 测试建议

### 数据格式测试
1. 测试新格式模板数据解析
2. 测试旧格式模板数据兼容性
3. 测试缺失字段的默认值处理

### 功能测试
1. 测试模板编辑功能
2. 测试任务添加/删除功能
3. 测试优先级设置功能
4. 测试Update Template功能
5. 测试Generate Study Plan功能

### 错误处理测试
1. 测试网络错误处理
2. 测试数据解析错误处理
3. 测试验证错误处理 