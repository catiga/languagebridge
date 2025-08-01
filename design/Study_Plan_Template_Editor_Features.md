# Study Plan Template Editor Features

## 概述
学习计划模板编辑器是一个增强的功能，允许用户编辑、自定义和保存AI生成的学习计划模板，然后基于这些模板生成实际的学习计划。现在支持按周计划模式，使用duration来计算结束时间，并提供两种不同的操作模式。

## 主要功能

### 1. 编辑功能
- **编辑学习目标**: 用户可以点击编辑按钮修改每周的学习目标
- **编辑任务内容**: 每个任务都可以直接编辑内容
- **实时保存**: 编辑后立即保存到本地状态

### 2. 添加功能
- **添加新周数**: 用户可以添加新的学习周数到计划中
- **添加新任务**: 每周都可以添加新的学习任务
- **自动编号**: 添加新周数后自动重新编号

### 3. 删除功能
- **删除周数**: 可以删除不需要的学习周数
- **删除任务**: 可以删除单个任务
- **自动重新编号**: 删除周数后自动重新编号剩余周数

### 4. 优先级管理
- **三级优先级**: 支持高、中、低三个优先级级别
- **视觉标识**: 使用不同颜色的星星图标表示优先级
- **下拉选择**: 通过下拉菜单快速设置优先级

### 5. 两种操作模式

#### 5.1 Update Template（更新模板）
- **功能**: 只更新模板，不生成具体的学习计划
- **数据提交**: 只提交模板JSON数据
- **不需要**: start_date（不是必填）
- **按钮**: 橙色"Update Template"按钮
- **API**: `/spwapi/auth/aiagent/assessment/studyplan/template/update`

#### 5.2 Generate Study Plan（生成学习计划）
- **功能**: 生成完整的学习计划
- **数据提交**: 模板JSON + start_date + end_date
- **需要**: 开始日期（必填）
- **按钮**: 绿色"Generate Study Plan"按钮
- **API**: `/spwapi/auth/aiagent/assessment/studyplan/generate`

### 6. 时间计算（基于Duration）
- **开始日期**: 用户选择学习计划的开始日期
- **Duration计算**: 使用AI评估的estimatedDuration来计算结束时间
- **自动计算**: 根据duration自动计算结束日期
- **日期显示**: 在界面上显示计算出的结束日期

### 7. 按周计划模式
- **周循环**: 模板按周循环生成，支持长期学习计划
- **周一到周日**: 每周包含7天的学习安排
- **循环生成**: 根据duration自动计算需要重复的周数

## 技术实现

### 前端组件
- **StudyPlanTemplateModal.tsx**: 主要的模板编辑器组件
- **状态管理**: 使用React hooks管理编辑状态
- **数据格式**: 支持新旧两种数据格式的兼容
- **周计划显示**: 将"Day"改为"Week"显示
- **双模式操作**: 支持Update Template和Generate Study Plan两种模式

### 后端API
- **UpdateTemplate**: 更新模板的API端点（待实现）
- **GenerateStudyPlan**: 生成学习计划的API端点
- **Duration计算**: 使用estimatedDuration计算总周数
- **数据兼容**: 支持旧格式字符串数组和新格式对象数组

### 数据结构
```typescript
interface StudyPlanTask {
  id: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
}

interface StudyPlanTemplate {
  week: number;  // 改为week
  objective: string;
  tasks: StudyPlanTask[];
}
```

### API调用示例

#### Update Template
```javascript
const templateData = {
  overview_id: overviewId,
  template: studyPlanTemplate  // 只提交模板数据
};

await apiClient.post('/spwapi/auth/aiagent/assessment/studyplan/template/update', templateData);
```

#### Generate Study Plan
```javascript
const generateData = {
  overview_id: overviewId,
  template: studyPlanTemplate,  // 提交模板数据
  start_date: startDate,        // 开始日期
  end_date: endDate            // 结束日期
};

await apiClient.post('/spwapi/auth/aiagent/assessment/studyplan/generate', generateData);
```

### 生成逻辑
```go
// 计算总周数
totalWeeks := (assessment.EstimatedDurationDays + 6) / 7

// 按周循环生成计划
for week := 0; week < totalWeeks; week++ {
    for i, day := range studyPlanTemplate {
        // 生成每周的计划
        weekNumber := week + 1
        dayInWeek := i + 1
        // ...
    }
}
```

## 用户体验

### 界面设计
- **现代化UI**: 使用Tailwind CSS构建的现代化界面
- **响应式设计**: 支持不同屏幕尺寸
- **直观操作**: 清晰的按钮和图标指示操作
- **周计划显示**: 显示"Week 1 of 7"而不是"Day 1 of 7"
- **双按钮设计**: 橙色Update Template按钮和绿色Generate Study Plan按钮

### 交互流程
1. 用户点击"Study Plan Template"按钮
2. 系统加载现有的学习计划模板
3. 用户可以编辑、添加、删除内容
4. 用户可以设置任务优先级
5. 用户选择操作模式：
   - **Update Template**: 只保存模板更改
   - **Generate Study Plan**: 选择开始日期，系统根据duration自动计算结束日期，生成完整计划

### 错误处理
- **加载错误**: 显示友好的错误信息
- **保存错误**: 提供重试机制
- **验证**: 确保必要字段不为空
- **模式区分**: 不同模式有不同的验证规则

## 兼容性

### 数据格式兼容
- **向后兼容**: 支持旧的字符串数组格式
- **自动转换**: 将旧格式自动转换为新格式
- **无缝升级**: 用户无需手动迁移数据
- **字段兼容**: 支持day和week字段的兼容

### API兼容
- **现有API**: 保持现有API的兼容性
- **新增API**: 添加新的更新模板API
- **错误处理**: 统一的错误处理机制

## 时间计算逻辑

### Duration计算
- **使用estimatedDuration**: 不再使用模板天数，而是使用AI评估的duration
- **向上取整**: 将天数转换为周数时向上取整
- **循环生成**: 根据duration自动计算需要重复的周数

### 示例
- Duration: 60天
- 模板: 7天（1周）
- 总周数: (60 + 6) / 7 = 9.4 → 10周
- 生成计划: 10周 × 7天 = 70天的学习计划

## 未来扩展

### 可能的功能增强
- **模板版本管理**: 支持多个版本的模板
- **模板分享**: 允许分享模板给其他用户
- **批量操作**: 支持批量编辑和删除
- **导入导出**: 支持模板的导入导出功能
- **模板分类**: 按主题或难度分类模板
- **自定义循环**: 支持自定义循环周期（如每2周、每月等）
- **模板预览**: 在生成前预览完整的学习计划

### 性能优化
- **懒加载**: 对于大型模板实现懒加载
- **缓存**: 实现模板缓存机制
- **压缩**: 优化数据传输大小 