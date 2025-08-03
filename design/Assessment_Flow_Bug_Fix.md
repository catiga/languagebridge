# Assessment Flow Bug Fix Summary

## 修复的问题

### 1. React Hooks 错误
**问题**: "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."

**原因**: 在 `renderGeneratingStep` 函数内部使用了 `useState` 和 `useEffect`，这违反了 React Hooks 的规则。

**修复方案**:
```typescript
// 修复前 - 错误的方式
const renderGeneratingStep = () => {
  const [progressMessage, setProgressMessage] = useState('...');
  useEffect(() => { ... }, []);
  return (...);
};

// 修复后 - 正确的方式
const renderGeneratingStep = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Generating Assessment</h3>
    <p className="text-gray-600 mb-6">AI is creating personalized questions for you...</p>
    <div className="space-y-4">
      <div className="text-sm text-blue-600 font-medium">Analyzing your learning goals...</div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
      </div>
      <div className="text-xs text-gray-500">This may take a few minutes...</div>
    </div>
  </div>
);
```

### 2. 题目类型支持
**问题**: 缺少对 `writing` 类型题目的支持。

**修复方案**: 添加了 `writing` 类型题目的渲染逻辑：
```typescript
{currentQuestion.type === 'writing' && (
  <div>
    <textarea
      value={answers[currentQuestion.id] || ''}
      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32 resize-vertical"
      placeholder="Write your answer here..."
      rows={6}
    />
  </div>
)}
```

### 3. 多选题默认选中问题
**问题**: 多选题中某些选项被错误地默认选中，特别是 "Chair" 和 "Table" 等选项。

**原因**: 
1. 多选题的 `checked` 逻辑有问题，当 `answers[currentQuestion.id]` 是 `undefined` 时，`includes(option)` 可能返回错误的结果
2. 答案状态没有在考试开始时正确重置
3. 模态框打开时没有重置所有相关状态

**修复方案**:

#### 3.1 修复多选题的选中逻辑
```typescript
// 修复前 - 有问题的逻辑
checked={answers[currentQuestion.id]?.includes(option)}

// 修复后 - 正确的逻辑
{currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
  <div className="space-y-3">
    {currentQuestion.options.map((option, index) => {
      const currentAnswers = answers[currentQuestion.id] ? answers[currentQuestion.id].split(';').filter(a => a.trim() !== '') : [];
      const isChecked = currentAnswers.includes(option);
      
      return (
        <label key={index} className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            value={option}
            checked={isChecked}
            onChange={(e) => {
              let newAnswers = [...currentAnswers];
              if (e.target.checked) {
                if (!newAnswers.includes(option)) {
                  newAnswers.push(option);
                }
              } else {
                newAnswers = newAnswers.filter(a => a !== option);
              }
              handleAnswerChange(currentQuestion.id, newAnswers.join(';'));
            }}
            className="text-blue-600"
          />
          <span className="text-gray-900">{option}</span>
        </label>
      );
    })}
  </div>
)}
```

#### 3.2 修复状态重置逻辑
```typescript
// 修复 handleStartExam 函数
const handleStartExam = () => {
  setIsStarted(true);
  setAnswers({}); // 重置答案状态
  setCurrentQuestionIndex(0); // 重置到第一题
};

// 修复模态框打开时的状态重置
useEffect(() => {
  if (isOpen && student) {
    // 重置所有状态
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsStarted(false);
    setIsSubmitted(false);
    setTimeLeft(1800); // 重置为30分钟
    setExamId(0);
    setAssessmentResult(null);
    setLearningGoal(null);
    setEditingTask(null);
    setEditingContent('');
    handleStatusBasedAction();
  }
}, [isOpen, student]);
```

### 4. 提交答案格式错误
**问题**: 提交答案时使用的数据格式不符合后端 `ExamMarkRequest` 的要求。

**原因**: 
1. 提交的数据结构不正确，缺少 `exam_id` 字段
2. 没有正确构造 `questions` 数组，缺少 `correct` 字段
3. 没有根据题目类型正确判断答案是否正确

**修复方案**:

#### 4.1 添加 exam_id 状态管理
```typescript
// 添加 exam_id 状态
const [examId, setExamId] = useState<number>(0);

// 在生成题目时保存 exam_id
const generateAssessment = async () => {
  // ... 生成逻辑
  setExamId(response.data.exam_id || 1);
  // ...
};
```

#### 4.2 修复提交数据格式
```typescript
const handleSubmit = async () => {
  if (isSubmitted) return;
  
  setIsSubmitted(true);
  
  try {
    // 构造符合 ExamMarkRequest 格式的数据
    const processedQuestions = assessment?.questions.map((question, index) => {
      const userAnswer = answers[question.id] || '';
      let isCorrect = false;

      // 根据题目类型判断答案是否正确
      switch (question.type) {
        case 'single_choice':
          isCorrect = userAnswer === question.answer;
          break;
        case 'multiple_choice':
          // 多选题答案用分号分隔，需要比较数组
          const userAnswers = userAnswer.split(';').filter(a => a.trim() !== '');
          const correctAnswers = question.answer?.split(';').filter(a => a.trim() !== '') || [];
          isCorrect = userAnswers.length === correctAnswers.length && 
                     userAnswers.every(ans => correctAnswers.includes(ans));
          break;
        case 'cloze':
          // 填空题答案不区分大小写
          isCorrect = userAnswer.toLowerCase().trim() === question.answer?.toLowerCase().trim();
          break;
        case 'writing':
          // 写作题只要有内容就算正确（简化处理）
          isCorrect = userAnswer.trim().length > 0;
          break;
        default:
          isCorrect = false;
      }

      return {
        id: question.id,
        type: question.type,
        question: question.question,
        options: question.options || [],
        answer: question.answer || '',
        user_answer: userAnswer,
        correct: isCorrect
      };
    }) || [];

    const submitData = {
      exam_id: examId,
      questions: processedQuestions
    };

    console.log('Submitting assessment data:', submitData);

    const response = await apiClient.post('/spwapi/auth/aiagent/selfassessment/exam/mark', submitData) as any;
    
    if (response && response.code === 0) {
      toast.success('Assessment submitted successfully!');
      setCurrentStep('evaluating');
      pollStatusChange();
    } else {
      toast.error(response?.msg || 'Failed to submit assessment');
    }
  } catch (error) {
    console.error('Failed to submit assessment:', error);
    toast.error('Failed to submit assessment');
  }
};
```

### 5. 组件渲染错误
**问题**: "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined."

**原因**: 
1. `renderEvaluatingStep` 函数中的 `pollStatusChange` 函数调用时可能 `student` 对象为 `undefined`
2. `renderTemplateStep` 函数中的 `studyPlanTemplate.map` 可能在没有数据时出错

**修复方案**:

#### 5.1 修复 renderEvaluatingStep 函数
```typescript
// 修复前 - 直接调用 pollStatusChange
const renderEvaluatingStep = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-6"></div>
    <h3 className="text-xl font-semibold text-gray-900 mb-4">AI is Evaluating</h3>
    <p className="text-gray-600 mb-6">Please wait while AI analyzes your answers...</p>
    <button
      onClick={pollStatusChange}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      <FaRefresh className="inline mr-2" />
      Check Status
    </button>
  </div>
);

// 修复后 - 添加安全检查
const renderEvaluatingStep = () => {
  const handleCheckStatus = () => {
    if (student && student.id) {
      pollStatusChange();
    } else {
      toast.error('Student information not available');
    }
  };

  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-6"></div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">AI is Evaluating</h3>
      <p className="text-gray-600 mb-6">Please wait while AI analyzes your answers...</p>
      <button
        onClick={handleCheckStatus}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <FaRefresh className="inline mr-2" />
        Check Status
      </button>
    </div>
  );
};
```

#### 5.2 修复 renderTemplateStep 函数
```typescript
// 修复前 - 直接调用 map
{studyPlanTemplate.map((week, weekIndex) => (
  // ...
))}

// 修复后 - 添加安全检查
{studyPlanTemplate && studyPlanTemplate.length > 0 ? (
  studyPlanTemplate.map((week, weekIndex) => (
    <div key={weekIndex} className="border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-2">Week {week.week}</h4>
      <p className="text-gray-600 mb-3">{week.objective}</p>
      
      <div className="space-y-2">
        {week.tasks && week.tasks.map((task, taskIndex) => (
          <div key={taskIndex} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-900">{task.content}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              task.priority === 'high' ? 'bg-red-100 text-red-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  ))
) : (
  <div className="text-center py-8 text-gray-500">
    <p>No study plan template available.</p>
  </div>
)}
```

### 6. Hooks 顺序错误
**问题**: "React has detected a change in the order of Hooks called by AssessmentFlowModal."

**原因**: 在 `renderTemplateStep` 函数内部使用了 `useState`，这违反了 React Hooks 的规则。

**修复方案**:

#### 6.1 将 Hooks 移到组件顶层
```typescript
// 修复前 - 在函数内部使用 useState
const renderTemplateStep = () => {
  const [editingTask, setEditingTask] = useState<{weekIndex: number, dayIndex: number, taskIndex: number} | null>(null);
  const [editingContent, setEditingContent] = useState('');
  // ...
};

// 修复后 - 将 useState 移到组件顶层
const [editingTask, setEditingTask] = useState<{weekIndex: number, dayIndex: number, taskIndex: number} | null>(null);
const [editingContent, setEditingContent] = useState('');

const renderTemplateStep = () => {
  // 使用顶层的状态
  const handleEditTask = (weekIndex: number, dayIndex: number, taskIndex: number, content: string) => {
    setEditingTask({ weekIndex, dayIndex, taskIndex });
    setEditingContent(content);
  };
  // ...
};
```

#### 6.2 在状态重置时包含新的状态
```typescript
useEffect(() => {
  if (isOpen && student) {
    // 重置所有状态
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsStarted(false);
    setIsSubmitted(false);
    setTimeLeft(1800); // 重置为30分钟
    setExamId(0);
    setAssessmentResult(null);
    setLearningGoal(null);
    setEditingTask(null);
    setEditingContent('');
    handleStatusBasedAction();
  }
}, [isOpen, student]);
```

## 接口数据结构支持

### 支持的题目类型
根据接口返回的数据结构，现在支持以下题目类型：

#### 1. 单选题 (single_choice)
```json
{
  "type": "single_choice",
  "question": "What is the opposite of 'happy'?",
  "options": ["Sad", "Angry", "Excited", "Tired"],
  "answer": "Sad",
  "explanation": "The opposite of 'happy' is 'sad' because they represent contrasting emotions."
}
```

#### 2. 多选题 (multiple_choice)
```json
{
  "type": "multiple_choice",
  "question": "Which of these are animals?",
  "options": ["Dog", "Tree", "Cat", "Car"],
  "answer": "Dog;Cat",
  "explanation": "'Dog' and 'Cat' are animals, while 'Tree' is a plant and 'Car' is a vehicle."
}
```

#### 3. 填空题 (cloze)
```json
{
  "type": "cloze",
  "question": "I have a pet ____. It is a ____. It likes to ____.",
  "options": [],
  "answer": "dog;cat;play",
  "explanation": "The sentence can be completed with words like 'dog', 'cat', and 'play' to make sense."
}
```

#### 4. 写作题 (writing)
```json
{
  "type": "writing",
  "question": "Write about your favorite animal. What does it look like? What does it like to do?",
  "options": [],
  "answer": "",
  "explanation": "This prompt encourages the user to describe an animal and its characteristics in simple sentences."
}
```

### 提交数据格式
根据后端 `ExamMarkRequest` 的要求，提交的数据格式为：

```typescript
interface ExamMarkRequest {
  exam_id: number;
  questions: {
    id: number;
    type: string;
    question: string;
    options: string[];
    answer: string;
    user_answer: string;
    correct: boolean;
  }[];
}
```

### 学习计划模板格式
```typescript
interface StudyPlanTemplate {
  week: number;
  objective: string;
  days: {
    day: number;
    tasks: {
      content: string;
      id: string;
      priority: string;
    }[];
  }[];
}
```

## 数据处理逻辑

### 题目处理
```typescript
const processedQuestions = questions.map((q: any, index: number) => ({
  ...q,
  id: index + 1,
  points: q.type === 'writing' ? 20 : q.type === 'multiple_choice' ? 10 : 5,
  time_limit: q.type === 'writing' ? 300 : undefined
}));
```

### 答案处理
- **单选题**: 单选按钮，选择单个答案
- **多选题**: 复选框，选择多个答案，用分号分隔
- **填空题**: 文本输入框
- **写作题**: 多行文本域

### 答案正确性判断
```typescript
// 单选题：直接比较答案
isCorrect = userAnswer === question.answer;

// 多选题：比较答案数组
const userAnswers = userAnswer.split(';').filter(a => a.trim() !== '');
const correctAnswers = question.answer?.split(';').filter(a => a.trim() !== '') || [];
isCorrect = userAnswers.length === correctAnswers.length && 
           userAnswers.every(ans => correctAnswers.includes(ans));

// 填空题：不区分大小写比较
isCorrect = userAnswer.toLowerCase().trim() === question.answer?.toLowerCase().trim();

// 写作题：只要有内容就算正确
isCorrect = userAnswer.trim().length > 0;
```

## 用户体验改进

### 1. 考试准备阶段
- 显示考试说明和规则
- 显示题目数量和时间限制
- 提供"Start Assessment"按钮

### 2. 考试进行阶段
- 30分钟倒计时显示
- 题目导航（上一题/下一题）
- 实时答案保存
- 自动提交功能

### 3. 题目显示
- 清晰的题目内容
- 适当的输入控件
- 分数显示
- 进度指示

### 4. 评估结果展示
- 详细的学习目标信息
- 完整的评估结果，包括每道题的答案和解释
- 正确/错误状态标识
- 用户答案和正确答案对比

### 5. 学习计划模板编辑
- 按周显示学习计划
- 按天组织任务
- 支持添加、编辑、删除任务
- 实时编辑功能
- 优先级标识

## 技术实现

### 1. 状态管理
```typescript
const [currentStep, setCurrentStep] = useState<'generating' | 'exam' | 'evaluating' | 'result' | 'template'>('generating');
const [assessment, setAssessment] = useState<Assessment | null>(null);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [answers, setAnswers] = useState<{[key: number]: string}>({});
const [timeLeft, setTimeLeft] = useState(1800); // 30分钟
const [isStarted, setIsStarted] = useState(false);
const [examId, setExamId] = useState<number>(0);
const [assessmentResult, setAssessmentResult] = useState<any>(null);
const [learningGoal, setLearningGoal] = useState<any>(null);
const [editingTask, setEditingTask] = useState<{weekIndex: number, dayIndex: number, taskIndex: number} | null>(null);
const [editingContent, setEditingContent] = useState('');
```

### 2. 计时器管理
```typescript
useEffect(() => {
  let timer: NodeJS.Timeout;
  if (isStarted && timeLeft > 0 && !isSubmitted) {
    timer = setTimeout(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }
  return () => clearTimeout(timer);
}, [isStarted, timeLeft, isSubmitted]);
```

### 3. 答案处理
```typescript
const handleAnswerChange = (questionId: number, answer: string) => {
  setAnswers(prev => ({
    ...prev,
    [questionId]: answer
  }));
};
```

## 总结

修复后的评估流程系统：

1. **解决了 React Hooks 错误**，确保组件正确渲染
2. **支持所有题目类型**，包括新增的写作题
3. **修复了多选题默认选中问题**，确保答案状态正确管理
4. **修复了提交答案格式错误**，符合后端 `ExamMarkRequest` 要求
5. **修复了组件渲染错误**，添加了必要的安全检查
6. **修复了 Hooks 顺序错误**，将 useState 移到组件顶层
7. **完善了评估结果展示**，显示详细的学习目标和评测数据
8. **改进了学习计划模板**，支持按天的任务编辑
9. **正确处理接口数据**，适配后端返回的数据结构
10. **提供完整的用户体验**，从生成到提交的完整流程
11. **支持30分钟计时**，自动提交功能
12. **正确的状态重置**，确保每次考试都是干净的状态
13. **正确的答案判断逻辑**，支持所有题目类型的正确性判断
14. **丰富的界面呈现**，结合学习目标预期和评测数据
15. **灵活的任务编辑**，支持按天的学习计划调整

系统现在可以正常处理AI生成的评估题目，提供流畅的考试体验，并正确提交答案给后端进行评估，同时避免了各种组件渲染错误和Hooks错误，并提供了丰富的评估结果展示和学习计划模板编辑功能。 