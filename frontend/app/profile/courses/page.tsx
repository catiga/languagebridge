'use client';
import ProfileLayout from '../ProfileLayout';
import CourseTabs from '../../components/CourseTabs';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

export default function ProfileCoursesPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || undefined;
  const [loading, setLoading] = useState(false);
  return (
    <ProfileLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-full max-w-5xl mx-auto mt-0"
        >
          <CourseTabs initialTab={initialTab} onLoading={setLoading} />
        </motion.div>
      </div>
    </ProfileLayout>
  );
} 