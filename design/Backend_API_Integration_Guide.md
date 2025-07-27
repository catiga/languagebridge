# 后端API接口对接指南

## 学习目标创建接口对接

### 接口信息
- **接口路径**: `POST /spwapi/auth/planner/add`
- **接口名称**: `CreateStageGoal`
- **功能**: 创建学习阶段目标

### 请求数据结构

#### 前端发送数据格式
```typescript
interface CreatePlannerStageGoalRequest {
  title: string;              // 目标标题
  description: string;        // 目标描述
  goal: string;              // 目标内容（使用description）
  start_date: string;        // 开始日期（YYYY-MM-DD）
  end_date: string;          // 结束日期（YYYY-MM-DD）
  goal_period_type: string;  // 目标周期类型（long_term/medium_term/short_term）
  target_level: number;      // 目标等级（1-5）
  init_level: number;        // 初始等级（默认1）
  student_id: number;        // 学生ID
}
```

#### 后端接收数据格式
```go
type CreatePlannerStageGoalRequest struct {
  Title          string `json:"title"`
  Description    string `json:"description"`
  Goal           string `json:"goal"`
  StartDate      string `json:"start_date"`
  EndDate        string `json:"end_date"`
  GoalPeriodType string `json:"goal_period_type"`
  TargetLevel    int    `json:"target_level"`
  InitLevel      int    `json:"init_level"`
  StudentID      uint64 `json:"student_id"`
}
```

### 响应数据结构

#### 后端返回数据格式
```go
{
  "code": 0,
  "msg": "success",
  "timestamp": 1234567890,
  "data": {
    "id": 123,
    "title": "Master Business English",
    "description": "Learn business English for international meetings",
    "goal": "Learn business English for international meetings",
    "start_date": "2024-01-15",
    "end_date": "2024-04-15",
    "student_id": 456,
    "status": "00",
    "add_time": "2024-01-15T10:30:00Z"
  }
}
```

#### 前端处理数据格式
```typescript
interface LearningGoal {
  id?: number;
  student_id: number;
  goal_type: 'long_term' | 'medium_term' | 'short_term';
  title: string;
  description: string;
  target_date: string;
  target_level?: number;
  current_level?: number;
  status: 'active' | 'completed' | 'paused';
  created_at?: string;
  updated_at?: string;
}
```

### 数据转换逻辑

#### 前端到后端
1. **goal**: 使用 `description` 的值
2. **start_date**: 使用当前日期
3. **end_date**: 使用AI分析生成的 `target_date`
4. **goal_period_type**: 使用AI分析生成的 `goal_type`
5. **target_level**: 使用AI分析生成的等级
6. **init_level**: 固定为1
7. **student_id**: 使用传入的学生ID

#### 后端到前端
1. **id**: 使用后端返回的ID
2. **student_id**: 使用后端返回的student_id
3. **title**: 使用后端返回的title
4. **description**: 使用后端返回的description
5. **target_date**: 使用后端返回的end_date
6. **created_at**: 使用后端返回的add_time
7. **status**: 固定为'active'

### AI分析功能

#### 触发条件
- 用户输入目标描述超过20个字符时自动触发

#### 分析逻辑
1. **目标类型分析**:
   - 包含"long"、"year"、"advanced"、"master" → 长期目标
   - 包含"short"、"week"、"basic"、"quick" → 短期目标
   - 其他 → 中期目标

2. **等级分析**:
   - 包含"beginner"、"basic"、"start" → Level 1
   - 包含"elementary"、"foundation" → Level 2
   - 包含"intermediate" → Level 3
   - 包含"upper"、"advanced" → Level 4
   - 包含"expert"、"master"、"professional" → Level 5

3. **日期计算**:
   - 长期目标: 当前日期 + 365天
   - 中期目标: 当前日期 + 90天
   - 短期目标: 当前日期 + 30天

### 错误处理

#### 前端错误处理
1. **表单验证**: 检查必填字段（title、description）
2. **API错误**: 显示后端返回的错误信息
3. **网络错误**: 显示通用错误信息

#### 后端错误处理
1. **请求格式错误**: 返回 `CODE_ERR_REQFORMAT`
2. **认证失败**: 返回 `CODE_ERR_AUTHTOKEN_FAIL`
3. **日期验证**: 检查结束日期不能早于当前日期

### 测试用例

#### 成功创建目标
```typescript
// 输入
{
  title: "Master Business English",
  description: "Learn business English for international meetings and presentations",
  student_id: 123
}

// 预期AI分析结果
{
  goal_type: "medium_term",
  target_level: 3,
  target_date: "2024-04-15"
}

// 预期后端请求
{
  title: "Master Business English",
  description: "Learn business English for international meetings and presentations",
  goal: "Learn business English for international meetings and presentations",
  start_date: "2024-01-15",
  end_date: "2024-04-15",
  goal_period_type: "medium_term",
  target_level: 3,
  init_level: 1,
  student_id: 123
}
```

### 注意事项

1. **数据一致性**: 确保前端和后端的数据字段名称完全匹配
2. **日期格式**: 统一使用 "YYYY-MM-DD" 格式
3. **类型转换**: 注意数字类型的转换（前端number → 后端int/uint64）
4. **默认值**: 为可选字段提供合理的默认值
5. **错误信息**: 提供用户友好的错误提示

### 后续扩展

1. **AI接口集成**: 可以替换模拟的AI分析为真实的AI接口调用
2. **数据验证**: 增加更严格的前端和后端数据验证
3. **缓存机制**: 为AI分析结果添加缓存以提高性能
4. **批量操作**: 支持批量创建学习目标 