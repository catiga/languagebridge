'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { FaBrain, FaChalkboardTeacher, FaCube } from 'react-icons/fa';

export default function AboutUsPage() {
  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: 'easeOut' }
  };

  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <motion.section
        className="relative py-32 md:py-48 text-center bg-gray-900 text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05]"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <motion.h1
            className="text-4xl md:text-6xl font-bold tracking-tight"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            We're Rebuilding Language Education.
          </motion.h1>
          <motion.p
            className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            At LangBridge, we believe learning should be personal, effective, and empowering. We're fusing advanced AI with expert human instruction to create a platform that adapts to you.
          </motion.p>
        </div>
      </motion.section>

      {/* Our Mission Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.h2 {...fadeIn} className="text-3xl md:text-4xl font-bold mb-4">Our Mission</motion.h2>
          <motion.p {...fadeIn} transition={{...fadeIn.transition, delay: 0.2}} className="text-lg text-gray-600 mb-16 max-w-3xl mx-auto">
            Our goal is to democratize language education by building a transparent, intelligent, and accessible global learning ecosystem.
          </motion.p>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: FaBrain, title: "AI Personalization", desc: "Our AI co-pilot analyzes your speech, identifies weaknesses, and crafts a unique learning path just for you." },
              { icon: FaChalkboardTeacher, title: "Expert Educators", desc: "Technology is a tool. True learning happens with elite, passionate teachers whom we empower to do their best work." },
              { icon: FaCube, title: "Verifiable Progress", desc: "Leveraging Web3, we offer a transparent system where your learning milestones are verifiable and owned by you." }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="p-8 bg-white rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                viewport={{ once: true, amount: 0.5 }}
              >
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-6">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.h2 {...fadeIn} className="text-3xl md:text-4xl font-bold text-gray-900">
            Join Our Journey
          </motion.h2>
          <motion.p
            {...fadeIn}
            transition={{...fadeIn.transition, delay: 0.2}}
            className="mt-4 text-lg text-gray-600"
          >
            Experience the future of learning today. Whether you're a student or an educator, there's a place for you at LangBridge.
          </motion.p>
          <motion.div
            {...fadeIn}
            transition={{...fadeIn.transition, delay: 0.4}}
            className="mt-10"
          >
            <a href="/courses" className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-full hover:bg-blue-700 transition-transform hover:scale-105 duration-300">
              Find Your Perfect Course
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 