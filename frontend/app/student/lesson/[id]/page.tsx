export default function StudentLessonPage({ params }: { params: { id: string } }) {
  return <div className="p-8 text-xl text-gray-700">Student Lesson: {params.id} (Coming soon)</div>;
} 