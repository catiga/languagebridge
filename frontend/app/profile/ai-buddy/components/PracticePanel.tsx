"use client";
import React, { useState } from 'react';

const mockPractice = [
  { id: 1, type: "cloze", question: "She ___ to the library yesterday.", options: ["go", "goes", "went", "gone"], answer: "went" },
  { id: 2, type: "reading", question: "What does the author want to express?", options: ["A", "B", "C", "D"], answer: "C" },
];
const mockSummary = "Recently you studied Unit 3: Food & Health. Key vocabulary: healthy, nutrition, diet.";
const mockResult = {
  score: 92,
  comment: "High accuracy! Keep up the good work!"
};

export default function PracticePanel() {
  const [answers, setAnswers] = useState<{[id:number]:string}>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="p-6">
      <div className="mb-4 text-blue-700 font-semibold">Today's Practice</div>
      <div className="mb-2 text-gray-600">{mockSummary}</div>
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {mockPractice.map(q=>(
            <div key={q.id} className="bg-gray-50 rounded p-3">
              <div className="mb-2 font-medium">{q.id}. {q.question}</div>
              <div className="flex gap-3">
                {q.options.map(opt=>(
                  <label key={opt} className="flex items-center gap-1">
                    <input type="radio" name={`q${q.id}`} value={opt} checked={answers[q.id]===opt} onChange={()=>setAnswers(a=>({...a,[q.id]:opt}))} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold">Submit</button>
        </form>
      ) : (
        <div className="bg-blue-50 rounded-xl p-6 mt-4">
          <div className="text-lg font-bold mb-2">Practice Result</div>
          <div className="mb-2">Score: <span className="font-bold text-blue-700">{mockResult.score}</span> / 100</div>
          <div className="mb-2">Comment: {mockResult.comment}</div>
          <button className="mt-4 px-4 py-2 bg-gray-200 rounded" onClick={()=>{setAnswers({});setSubmitted(false);}}>Try Again</button>
        </div>
      )}
    </div>
  );
} 