'use client';
import ProfileLayout from '../ProfileLayout';
import ProfileInfo from '../../components/ProfileInfo';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProfileInfoPage() {
  const [loading, setLoading] = useState(false);
  return (
    <ProfileLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-full max-w-2xl mx-auto mt-0"
        >
          <ProfileInfo onLoading={setLoading} />
        </motion.div>
      </div>
    </ProfileLayout>
  );
} 