# LangBridge 平台 UI 设计规范

## 1. 设计系统

### 1.1 配色方案
- 主色调：#4F46E5（靛蓝色）- 代表专业、智慧、国际化
- 辅助色：#34D399（薄荷绿）- 代表活力、成长、健康
- 强调色：#FBBF24（温暖黄）- 代表阳光、活力、友好
- 中性色：
  - 背景色：#F8FAFC（纯净白）
  - 文字主色：#1E293B（深邃灰）
  - 文字次要色：#64748B（柔和灰）
- 点缀色：
  - #F472B6（粉红）- 用于强调和装饰
  - #818CF8（淡紫）- 用于特殊元素

### 1.2 字体系统
- 主要字体：PingFang SC
- 英文字体：SF Pro Display
- 字号规范：
  - 大标题：32px/28px - 用于重要标题
  - 标题：24px/20px - 用于页面标题
  - 副标题：18px - 用于分类标题
  - 正文：16px - 用于主要内容
  - 辅助文字：14px - 用于说明文字
  - 小字：12px - 用于注释

### 1.3 组件库
- 按钮：
  - 主要按钮：圆角矩形，渐变背景
  - 次要按钮：描边样式，悬浮效果
  - 文字按钮：简洁无边框
- 输入框：
  - 圆角设计
  - 柔和阴影
  - 聚焦时轻微放大效果
- 卡片：
  - 圆角设计
  - 柔和阴影
  - 悬浮效果
  - 内容分区清晰
- 导航：
  - 顶部导航：固定定位，半透明效果
  - 侧边栏：可折叠，图标+文字
- 表格：
  - 圆角边框
  - 行间分隔线
  - 悬浮效果

### 1.4 图标系统
- 线性图标：2px描边
- 圆角处理：4px
- 统一风格：简约现代
- 动画效果：平滑过渡

### 1.5 图片规范
- 教师头像：圆形，边框效果
- 课程封面：16:9比例
- 背景图片：柔和渐变
- 装饰元素：几何图形

## 2. 页面布局

### 2.1 公共平台（学生/家长端）

#### 首页
- 顶部导航栏：Logo、搜索框、登录/注册
- 轮播图：平台特色、活动推广
- 教师推荐区：卡片式布局
- 热门课程区：网格布局
- 底部：平台信息、联系方式

#### 教师列表页
- 筛选区：
  - 教学经验
  - 擅长领域
  - 教材类型
  - 价格区间
- 搜索结果：列表/网格切换
- 排序功能：评分/价格/经验

#### 教师详情页
- 个人信息区：头像、姓名、评分
- 教学经验：时间轴展示
- 专长领域：标签展示
- 教材列表：卡片式展示
- 课程预约：日历选择器

#### 个人中心
- 侧边栏导航
- 课程表：日历视图
- 通知中心：列表展示
- 历史记录：时间轴

### 2.2 教师端

#### 个人资料管理
- 基本信息编辑
- 教学经验管理
- 专长标签管理
- 教材管理

#### 课程管理
- 课程表视图
- 学生名单
- 课程记录
- 教学反馈

### 2.3 管理后台

#### 数据概览
- 关键指标卡片
- 数据趋势图表
- 实时监控

#### 用户管理
- 教师管理
- 学生管理
- 家长管理

#### 课程管理
- 排课系统
- 课程监控
- 质量评估

## 3. 交互设计

### 3.1 响应式设计
- 桌面端：1200px+
- 平板端：768px-1199px
- 移动端：<768px

### 3.2 动效设计
- 页面切换：平滑过渡，渐变效果
- 按钮反馈：波纹效果，轻微放大
- 加载状态：骨架屏，渐变动画
- 悬浮效果：轻微上浮，阴影加深
- 滚动效果：平滑滚动，视差效果

### 3.3 无障碍设计
- 键盘导航支持
- 屏幕阅读器兼容
- 颜色对比度符合WCAG标准
- 字体大小可调整
- 动画可关闭选项

## 4. 技术实现建议

### 4.1 前端框架
- React/Vue.js
- TailwindCSS
- Ant Design/Element Plus

### 4.2 状态管理
- Redux/Vuex
- React Query/SWR

### 4.3 实时通信
- WebSocket
- 视频会议：WebRTC

## 5. 性能优化

### 5.1 加载优化
- 图片懒加载
- 组件按需加载
- 资源预加载

### 5.2 缓存策略
- 本地存储
- 服务端缓存
- CDN加速 