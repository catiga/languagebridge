'use client';
import ProfileLayout from '../ProfileLayout';
import TimetableWeekView from '../../timetable/components/TimetableWeekView';
import { motion } from 'framer-motion';

export default function ProfileSchedulePage() {
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
          <TimetableWeekView />
        </motion.div>
      </div>
    </ProfileLayout>
  );
} 