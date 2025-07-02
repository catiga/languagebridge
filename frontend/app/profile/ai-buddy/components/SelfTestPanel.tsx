"use client";
import React, { useState, useEffect } from 'react';
import { FaRobot } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { apiClient } from '@/app/utils/api';
import ReactMarkdown from 'react-markdown';

const examTypes = [
  { key: 'ket', label: '📘 Beginner (KET Level, Grades 1–4)' },
  { key: 'pet', label: '📗 Intermediate (PET Level, Grades 5–8)' },
  { key: 'toefl', label: '📙 TOEFL Junior (Middle School Focus)' },
  { key: 'ielts', label: '📕 IELTS Practice (Advanced/High School)' },
];

const mockResult = {
  score: 87,
  level: "B1",
  strengths: ["Good grammar", "Clear expression"],
  weaknesses: ["Limited vocabulary", "Simple sentence structure"],
  suggestions: "Try to use more advanced vocabulary and complex sentences."
};

const mockQuestions = [
  { id: 1, type: "reading", question: "What is the main idea of the passage?", options: ["A", "B", "C", "D"], answer: "B" },
  { id: 2, type: "cloze", question: "He ___ to school every day.", options: ["go", "goes", "going", "gone"], answer: "goes" },
];

function ResultProgress({ score }: { score: number }) {
  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-blue-700">Score</span>
        <span className="text-sm font-bold text-blue-700">{score} / 100</span>
      </div>
      <div className="w-full bg-blue-100 rounded-full h-3">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-400 h-3 rounded-full transition-all" style={{width: `${score}%`}}></div>
      </div>
    </div>
  );
}

function AIFeedback({ result }: { result: any }) {
  if (result.ai_reply) {
    // 后端返回结构
    return (
      <div className="flex gap-4 items-start mt-6">
        <div className="bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full p-3 shadow-lg">
          <FaRobot className="text-3xl text-white animate-bounce" />
        </div>
        <div className="bg-white/90 rounded-xl shadow p-4 max-w-xl">
          <div className="font-bold text-blue-700 mb-1">AI Feedback</div>
          <div className="prose prose-blue max-w-none">
            <ReactMarkdown>{result.ai_reply}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }
  // mock结构兼容
  return (
    <div className="flex gap-4 items-start mt-6">
      <div className="bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full p-3 shadow-lg">
        <FaRobot className="text-3xl text-white animate-bounce" />
      </div>
      <div className="bg-white/90 rounded-xl shadow p-4 max-w-xl">
        <div className="font-bold text-blue-700 mb-1">AI Feedback</div>
        <div className="mb-1"><span className="font-semibold">Level:</span> {result.level}</div>
        <div className="mb-1"><span className="font-semibold">Strengths:</span> {Array.isArray(result.strengths) ? result.strengths.join(', ') : ''}</div>
        <div className="mb-1"><span className="font-semibold">Weaknesses:</span> {Array.isArray(result.weaknesses) ? result.weaknesses.join(', ') : ''}</div>
        <div className="mb-1"><span className="font-semibold">Suggestions:</span> {result.suggestions}</div>
      </div>
    </div>
  );
}

interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg?: string;
}

const examTypeMap: Record<string, number> = {
  ket: 1,
  pet: 2,
  toefl: 3,
  ielts: 4,
};

async function postSelfAssessment(content: string) {
  try {
    const res: ApiResponse<typeof mockResult> = await apiClient.post('/spwapi/auth/aiagent/selfassessment', { content });
    if (!res || res.code !== 0) throw new Error(res?.msg || 'API error');
    return res.data || mockResult;
  } catch (e: any) {
    throw new Error(e?.message || 'Request failed');
  }
}

async function postSelfAssessmentExam(level: number) {
  const res: ApiResponse<any> = await apiClient.post('/spwapi/auth/aiagent/selfassessment/exam', { level });
  if (!res || res.code !== 0) throw new Error(res?.msg || 'API error');
  return res.data;
}

export default function SelfTestPanel() {
  const [mode, setMode] = useState<'free'|'exam'>('free');
  const [text, setText] = useState('');
  const [examType, setExamType] = useState('ket');
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<{[id:number]:string}>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<typeof mockResult | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (mode === 'exam' && examType) {
      fetchExamQuestions();
    } else {
      setQuestions([]);
      setAnswers({});
    }
    // eslint-disable-next-line
  }, [examType, mode]);

  async function fetchExamQuestions() {
    setLoading(true);
    setQuestions([]);
    setAnswers({});
    try {
      const data = await postSelfAssessmentExam(examTypeMap[examType]);
      // 取后端返回的data.ai_reply.questions
      setQuestions(data.ai_reply?.questions || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'free') {
      setLoading(true);
      setShowResult(false);
      try {
        const data = await postSelfAssessment(text);
        setResult(data || mockResult);
        setShowResult(true);
      } catch (err: any) {
        toast.error(err.message || 'Assessment failed');
        setResult(mockResult);
        setShowResult(true);
      } finally {
        setLoading(false);
      }
    } else {
      // exam模式下校验
      if (!examTypeMap[examType]) {
        toast.error('Please select an exam type');
        return;
      }
      if (questions.length === 0) {
        toast.error('No questions loaded');
        return;
      }
      if (Object.keys(answers).length < questions.length) {
        toast.error('Please answer all questions');
        return;
      }
      setLoading(true);
      setShowResult(false);
      try {
        // 暂用postSelfAssessmentExam模拟提交答案
        const data = await postSelfAssessmentExam(examTypeMap[examType]);
        setResult(data || mockResult);
        setShowResult(true);
      } catch (err: any) {
        toast.error(err.message || 'Assessment failed');
        setResult(mockResult);
        setShowResult(true);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex gap-4 mb-6 justify-center">
        <button className={`px-5 py-2 rounded-full font-semibold border shadow transition-all text-base flex-1 ${mode==='free'?'bg-gradient-to-r from-blue-500 to-indigo-400 text-white scale-105':'bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:scale-105'}`} onClick={()=>{setMode('free');setShowResult(false);}}>Free Assessment</button>
        <button className={`px-5 py-2 rounded-full font-semibold border shadow transition-all text-base flex-1 ${mode==='exam'?'bg-gradient-to-r from-blue-500 to-indigo-400 text-white scale-105':'bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:scale-105'}`} onClick={()=>{setMode('exam');setShowResult(false);}}>Exam Mode</button>
      </div>
      {mode==='free' && !showResult && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          <textarea className="w-full border rounded-xl p-4 min-h-[120px] shadow focus:ring-2 focus:ring-blue-400" placeholder="Enter your English essay or paragraph..." value={text} onChange={e=>setText(e.target.value)} required disabled={loading} />
          <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-400 text-white px-6 py-3 rounded-xl font-bold text-lg shadow hover:scale-105 transition disabled:opacity-60" disabled={loading}>{loading ? 'Assessing...' : 'Submit'}</button>
        </form>
      )}
      {mode==='free' && showResult && result && (
        <div className="animate-fade-in">
          <ResultProgress score={result.score} />
          <AIFeedback result={result} />
          <button className="mt-6 w-full px-4 py-2 bg-gray-200 rounded-xl font-semibold hover:bg-gray-300" onClick={()=>{setShowResult(false); setText('');}}>Try Again</button>
        </div>
      )}
      {mode==='exam' && !showResult && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          <div>
            <label className="block mb-2 font-medium">Select Exam Type:</label>
            <div className="flex flex-row flex-wrap gap-3 mb-4">
              {examTypes.map(e => (
                <label key={e.key} className={`flex-1 flex items-center justify-center gap-2 min-w-[180px] px-3 py-2 rounded-lg cursor-pointer border transition-all font-medium text-sm shadow-sm select-none h-12
                  ${examType === e.key ? 'border-2 border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'}`}
                >
                  <input
                    type="radio"
                    name="examType"
                    value={e.key}
                    checked={examType === e.key}
                    onChange={() => setExamType(e.key)}
                    className="hidden"
                  />
                  <span>{e.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {questions.length > 0 ? questions.map((q, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 shadow">
                <div className="mb-2 font-medium">{idx + 1}. {q.question}</div>
                <div className="flex gap-3 flex-wrap">
                  {q.options && q.options.map((opt: string) => (
                    <label key={opt} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={`q${idx}`}
                        value={opt}
                        checked={answers[idx] === opt}
                        onChange={() => setAnswers(a => ({ ...a, [idx]: opt }))}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-1">{q.type}</div>
              </div>
            )) : <div className="text-gray-400">No questions loaded.</div>}
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-400 text-white px-6 py-3 rounded-xl font-bold text-lg shadow hover:scale-105 transition">Submit</button>
        </form>
      )}
      {mode==='exam' && showResult && result && (
        <div className="animate-fade-in">
          <ResultProgress score={result.score} />
          <AIFeedback result={result} />
          <button className="mt-6 w-full px-4 py-2 bg-gray-200 rounded-xl font-semibold hover:bg-gray-300" onClick={()=>setShowResult(false)}>Try Again</button>
        </div>
      )}
    </div>
  );
} 