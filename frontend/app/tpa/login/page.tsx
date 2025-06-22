'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../utils/api';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SHA256 from 'crypto-js/sha256';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { FaChalkboardTeacher, FaEnvelope, FaLock, FaUser, FaGlobe, FaCertificate } from 'react-icons/fa';

const schema = yup.object().shape({
  loginName: yup.string().required('Please input your email or teacher number'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Please input your password'),
  remember: yup.boolean(),
});

export default function TeacherLoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const saveTeacherLoginData = (token: string, teacherInfo: any, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('teacherToken', token);
    storage.setItem('teacherInfo', JSON.stringify(teacherInfo));
    storage.setItem('userType', 'teacher');
    Cookies.set('teacherToken', token, { expires: remember ? 7 : undefined, path: '/' });
    Cookies.set('teacherInfo', JSON.stringify(teacherInfo), { expires: remember ? 7 : undefined, path: '/' });
    Cookies.set('userType', 'teacher', { expires: remember ? 7 : undefined, path: '/' });
    window.dispatchEvent(new Event('userChanged'));
  };

  const clearTeacherLoginData = () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherInfo');
    localStorage.removeItem('userType');
    sessionStorage.removeItem('teacherToken');
    sessionStorage.removeItem('teacherInfo');
    sessionStorage.removeItem('userType');
    Cookies.remove('teacherToken', { path: '/' });
    Cookies.remove('teacherInfo', { path: '/' });
    Cookies.remove('userType', { path: '/' });
    window.dispatchEvent(new Event('userChanged'));
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    clearTeacherLoginData();
    const payload = {
      login_name: data.loginName,
      password: SHA256(data.password).toString(),
    };
    try {
      const res: any = await apiClient.post('/spwapi/tpa/login', payload);
      if (res && res.code === 0) {
        toast.success('Login successfully!');
        saveTeacherLoginData(res.data.token, res.data, data.remember)
        setTimeout(() => {
          router.push('/tpa/dashboard'); // 跳转到教师仪表板
        }, 1500);
      } else {
        toast.error(res?.msg || 'Login failed');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <ToastContainer position="bottom-right" />
      <div className="max-w-4xl w-full mx-auto grid md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left Side - Welcome Message */}
        <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl font-bold leading-tight">Welcome Back, Educator!</h1>
            <p className="mt-4 text-blue-100">
              Access your teaching dashboard and continue inspiring students around the world.
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-start"><FaChalkboardTeacher className="w-5 h-5 mr-3 mt-1 flex-shrink-0" /><span>Manage your teaching schedule and bookings.</span></li>
              <li className="flex items-start"><FaGlobe className="w-5 h-5 mr-3 mt-1 flex-shrink-0" /><span>Connect with students from diverse backgrounds.</span></li>
              <li className="flex items-start"><FaCertificate className="w-5 h-5 mr-3 mt-1 flex-shrink-0" /><span>Track your teaching progress and earnings.</span></li>
            </ul>
          </motion.div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Teacher Login</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="loginName" className="flex items-center text-sm font-semibold text-gray-600 mb-2">
                <FaUser className="mr-2" />
                Email or Teacher Number
              </label>
              <input
                id="loginName"
                type="text"
                placeholder="Enter your email or teacher number"
                {...register('loginName')}
                className={`w-full px-4 py-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-300 ${
                  errors.loginName ? 'border-red-500' : ''
                }`}
              />
              {errors.loginName && <p className="text-red-500 text-xs mt-1">{errors.loginName.message as string}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className="flex items-center text-sm font-semibold text-gray-600 mb-2">
                <FaLock className="mr-2" />
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                className={`w-full px-4 py-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-300 ${
                  errors.password ? 'border-red-500' : ''
                }`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  {...register('remember')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have a teacher account? {' '}
              <Link href="/tpa/register" className="font-semibold text-blue-600 hover:underline">
                Apply to become a teacher
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 