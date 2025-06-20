'use client';

import React from 'react';
import Image from 'next/image';
import { FaGraduationCap, FaClock, FaUserCog } from 'react-icons/fa';
import ApiDemo from './components/ApiDemo';

// Mock data (English)
const teachers = [
  { id: 1, name: 'Alice Smith', bio: 'Experienced in teaching business English.', imageUrl: 'https://via.placeholder.com/150' },
  { id: 2, name: 'Bob Johnson', bio: 'Specializes in IELTS preparation.', imageUrl: 'https://via.placeholder.com/150' },
];

const studentCases = [
  { id: 1, title: 'From Beginner to Fluent', description: 'Amy improved her English from scratch with LangBridge courses...' },
  { id: 2, title: 'Successfully Passed IELTS', description: 'Ben significantly improved his IELTS score with teacher guidance...' },
];

const testimonials = [
  { id: 1, quote: 'The course quality is excellent and the teachers are very professional!', author: 'Wang Wei' },
  { id: 2, quote: 'The learning method is flexible and suits me very well.', author: 'Li Ping' },
];

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-24 text-center shadow-lg">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl font-extrabold mb-4 animate-fadeInDown">LangBridge - Your Bridge to Global English</h2>
          <p className="text-xl mb-10 animate-fadeInUp">High-quality native teachers, personalized courses, helping you speak English fluently!</p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold shadow-md hover:bg-gray-200 transition duration-300">Try a Free Lesson</button>
        </div>
      </section>

      {/* API Demo Section */}
      {/* <section className="container mx-auto px-6">
        <ApiDemo />
      </section> */}

      {/* Platform Highlights */}
      <section className="container mx-auto px-6">
        <h3 className="text-4xl font-bold text-center mb-12 text-gray-800">Platform Highlights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover-scale">
            <div className="text-blue-500 mb-4 flex justify-center">
              <FaGraduationCap size={40} />
            </div>
            <h4 className="text-2xl font-semibold mb-3 text-gray-700">Top Native Teachers</h4>
            <p className="text-gray-600">Carefully selected native teachers from around the world, authentic pronunciation, rich experience, bringing you an immersive learning experience.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover-scale">
             <div className="text-green-500 mb-4 flex justify-center">
              <FaClock size={40} />
             </div>
            <h4 className="text-2xl font-semibold mb-3 text-gray-700">Flexible Scheduling</h4>
            <p className="text-gray-600">24/7 flexible class times, learn anytime, anywhere, connect with the world effortlessly.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover-scale">
             <div className="text-purple-500 mb-4 flex justify-center">
              <FaUserCog size={40} />
             </div>
            <h4 className="text-2xl font-semibold mb-3 text-gray-700">Customized Courses</h4>
            <p className="text-gray-600">Personalized study plans based on your level, interests, and needs to maximize your learning results.</p>
          </div>
        </div>
      </section>

      {/* Featured Teachers */}
      <section className="container mx-auto px-6">
        <h3 className="text-4xl font-bold text-center mb-12 text-gray-800">Featured Teachers</h3>
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
        <h3 className="text-4xl font-bold text-center mb-12 text-gray-800">Student Success Stories</h3>
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
          <h3 className="text-4xl font-bold text-center mb-12 text-gray-800">Testimonials</h3>
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
          <h3 className="text-3xl font-bold mb-6">Start Your English Learning Journey</h3>
          <p className="text-xl mb-8">Register now to get your personalized study plan and one-on-one native teacher guidance.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition duration-300">Try for Free</button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition duration-300">Learn More</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-semibold mb-4">LangBridge</h4>
              <p className="text-gray-400">Your Bridge to Global English</p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Courses</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Teachers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Contact Us</h5>
              <ul className="space-y-2">
                <li className="text-gray-400">Email: info@langbridge.com</li>
                <li className="text-gray-400">Phone: +86 123 4567 8910</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Follow Us</h5>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">WeChat</a>
                <a href="#" className="text-gray-400 hover:text-white">Weibo</a>
                <a href="#" className="text-gray-400 hover:text-white">Douyin</a>
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
