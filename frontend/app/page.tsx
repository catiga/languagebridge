'use client';

import React from 'react';
import Image from 'next/image';
import { FaGraduationCap, FaClock, FaUserCog } from 'react-icons/fa';

// 模拟数据
const teachers = [
  { id: 1, name: 'Alice Smith', bio: 'Experienced in teaching business English.', imageUrl: 'https://via.placeholder.com/150' },
  { id: 2, name: 'Bob Johnson', bio: 'Specializes in IELTS preparation.', imageUrl: 'https://via.placeholder.com/150' },
  // 更多教师数据...
];

const studentCases = [
  { id: 1, title: '从零基础到流利交流', description: '学生 Amy 通过 LangBridge 课程...' },
  { id: 2, title: '成功通过雅思考试', description: '学生 Ben 在老师指导下，雅思成绩大幅提升...' },
  // 更多学生案例数据...
];

const testimonials = [
  { id: 1, quote: '课程质量很高，老师很专业！', author: 'Wang Wei' },
  { id: 2, quote: '学习方式很灵活，非常适合我。', author: 'Li Ping' },
  // 更多评价数据...
];

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-24 text-center shadow-lg">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl font-extrabold mb-4 animate-fadeInDown">LangBridge - 连接世界的英语学习桥梁</h2>
          <p className="text-xl mb-10 animate-fadeInUp">高质量外教，个性化课程，助你流利说英语！</p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold shadow-md hover:bg-gray-200 transition duration-300">立即免费试听</button>
        </div>
      </section>

      {/* Platform Highlights */}
      <section className="container mx-auto px-6">
        <h3 className="text-4xl font-bold text-center mb-12 text-gray-800">平台亮点</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover-scale">
            <div className="text-blue-500 mb-4 flex justify-center">
              <FaGraduationCap size={40} />
            </div>
            <h4 className="text-2xl font-semibold mb-3 text-gray-700">优质外教</h4>
            <p className="text-gray-600">严选全球优秀母语外教，发音纯正，经验丰富，为您带来沉浸式学习体验。</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover-scale">
             <div className="text-green-500 mb-4 flex justify-center">
              <FaClock size={40} />
             </div>
            <h4 className="text-2xl font-semibold mb-3 text-gray-700">灵活排课</h4>
            <p className="text-gray-600">24/7 自由选择上课时间，碎片化学习无压力，随时随地连接世界。</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover-scale">
             <div className="text-purple-500 mb-4 flex justify-center">
              <FaUserCog size={40} />
             </div>
            <h4 className="text-2xl font-semibold mb-3 text-gray-700">定制课程</h4>
            <p className="text-gray-600">根据您的水平、兴趣和需求，量身定制学习计划，确保学习效果最大化。</p>
          </div>
        </div>
      </section>

      {/* Featured Teachers */}
      <section className="container mx-auto px-6">
        <h3 className="text-4xl font-bold text-center mb-12 text-gray-800">教师精选</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teachers.map(teacher => (
            <div key={teacher.id} className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 hover-scale">
              <Image 
                src={teacher.imageUrl} 
                alt={teacher.name} 
                width={80} 
                height={80} 
                className="rounded-full object-cover"
              />
              <div>
                <h4 className="text-xl font-semibold text-gray-800">{teacher.name}</h4>
                <p className="text-gray-600">{teacher.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Student Success Stories */}
      <section className="container mx-auto px-6">
        <h3 className="text-4xl font-bold text-center mb-12 text-gray-800">学生优秀案例</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {studentCases.map(caseItem => (
            <div key={caseItem.id} className="bg-white p-6 rounded-lg shadow-md hover-scale">
              <h4 className="text-xl font-semibold mb-2 text-gray-800">{caseItem.title}</h4>
              <p className="text-gray-600">{caseItem.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl font-bold text-center mb-12 text-gray-800">用户评价</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="bg-white p-6 rounded-lg shadow-md hover-scale">
                <p className="text-gray-700 italic mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="text-right font-semibold text-gray-800">- {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold mb-6">开启您的英语学习之旅</h3>
          <p className="text-xl mb-8">立即注册，获得专属学习计划和一对一外教指导</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition duration-300">免费试听</button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition duration-300">了解更多</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-semibold mb-4">LangBridge</h4>
              <p className="text-gray-400">连接世界的英语学习桥梁</p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">快速链接</h5>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">首页</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">课程</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">教师</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">关于我们</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">联系我们</h5>
              <ul className="space-y-2">
                <li className="text-gray-400">邮箱: info@langbridge.com</li>
                <li className="text-gray-400">电话: +86 123 4567 8910</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">关注我们</h5>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">微信</a>
                <a href="#" className="text-gray-400 hover:text-white">微博</a>
                <a href="#" className="text-gray-400 hover:text-white">抖音</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">&copy; 2023 LangBridge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
