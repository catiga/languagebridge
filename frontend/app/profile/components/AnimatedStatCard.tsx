'use client';
import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedStatCard({ icon, label, value, colorClass }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  colorClass: string;
}) {
  return (
    <motion.div
      className={`rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center bg-gradient-to-br ${colorClass} text-white relative overflow-hidden`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.06, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.15)' }}
    >
      <div className="mb-2 text-3xl drop-shadow-lg">{icon}</div>
      <div className="text-4xl font-extrabold mb-1 drop-shadow-lg animate-bounce-slow">{value}</div>
      <div className="text-lg font-semibold tracking-wide drop-shadow">{label}</div>
      {/* 彩色气泡装饰 */}
      <span className="absolute -top-4 -right-4 w-12 h-12 bg-white/20 rounded-full blur-2xl"></span>
      <span className="absolute -bottom-6 left-6 w-16 h-16 bg-white/10 rounded-full blur-2xl"></span>
    </motion.div>
  );
}

// 自定义慢弹跳动画
// tailwind.config.js 需加：
// animation: {
//   'bounce-slow': 'bounce 2.5s infinite',
// }, 