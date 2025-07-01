'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  FaGraduationCap, 
  FaUsers, 
  FaBookOpen, 
  FaStar, 
  FaPlay, 
  FaCalendarAlt,
  FaCertificate,
  FaChartLine,
  FaBell,
  FaCog,
  FaArrowRight,
  FaGlobe
} from 'react-icons/fa';

export default function TeacherDashboardDemo() {
  const features = [
    {
      icon: FaUsers,
      title: 'Students',
      description: 'Manage your student information, view learning progress and feedback',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FaBookOpen,
      title: 'Course Management',
      description: 'Create and manage your teaching courses, set course content',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: FaCalendarAlt,
      title: 'Course Scheduling',
      description: 'Flexibly arrange course times, manage bookings and schedules',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: FaStar,
      title: 'Review System',
      description: 'View student reviews, improve teaching quality',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: FaCertificate,
      title: 'Certificate Management',
      description: 'Manage your teaching certificates and qualifications',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: FaChartLine,
      title: 'Data Analytics',
      description: 'View teaching statistics and income analysis',
      color: 'from-teal-500 to-blue-500'
    }
  ];

  const stats = [
    { label: 'Total Students', value: '127', icon: FaUsers, color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Lessons', value: '342', icon: FaBookOpen, color: 'from-green-500 to-emerald-500' },
    { label: 'Average Rating', value: '4.8', icon: FaStar, color: 'from-yellow-500 to-orange-500' },
    { label: 'Total Earnings', value: '$2,847', icon: FaPlay, color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
              >
                <FaGraduationCap className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Teacher Dashboard Demo
                </h1>
                <p className="text-lg text-gray-600">Modern teaching management platform designed for young educators</p>
              </div>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/tpa/dashboard"
                className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
              >
                <span>Try Full Version</span>
                <FaArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Modern Teaching Platform
            <br />
            for Global Educators
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Colorful and animated teacher dashboard designed for young users, supporting multi-country users,
            making your teaching management more efficient and enjoyable.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/tpa/login"
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
              >
                Login Now
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/tpa/register"
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-medium hover:shadow-lg transition-all duration-300 border border-gray-200"
              >
                Register Account
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Core Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Design Highlights */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20"
        >
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">Design Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaBell className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Colorful Design</h4>
              <p className="text-gray-600">Gradient color design for more attractive visual effects</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaPlay className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Smooth Animations</h4>
              <p className="text-gray-600">Fluid animation effects to enhance user experience</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaGlobe className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">International</h4>
              <p className="text-gray-600">Support for multi-country users with friendly interface</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to start your teaching journey?</h3>
          <p className="text-xl text-gray-600 mb-8">Join us and experience the modern teaching management platform</p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href="/tpa/register"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
            >
              <span>Register Now</span>
              <FaArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 