'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import ProfileInfo from '../components/ProfileInfo';
import MemberList from '../components/MemberList';
import CourseTabs from '../components/CourseTabs';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  
  const tabMap: Record<string, string> = {
    profile: 'profile',
    students: 'members',
    courses: 'courses',
  };

  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState(() => tabMap[tabParam || 'profile'] || 'profile');

  useEffect(() => {
    if (tabParam && tabMap[tabParam]) {
      setMenu(tabMap[tabParam]);
    }
  }, [tabParam, tabMap]);

  const handleMenuChange = (newMenu: string) => {
    setMenu(newMenu);
    router.replace(`/profile?tab=${newMenu}`, { scroll: false });
  };
  
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar menu={menu} setMenu={handleMenuChange} />
      
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={menu}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            {menu === 'profile' && <ProfileInfo onLoading={setLoading} />}
            {menu === 'members' && <MemberList onLoading={setLoading} />}
            {menu === 'courses' && <CourseTabs onLoading={setLoading} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
} 