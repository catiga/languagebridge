'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '../utils/api';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SHA256 from 'crypto-js/sha256';
import Cookies from 'js-cookie';
import WalletLoginSection from './WalletLoginSection';
import { Tab } from '@headlessui/react';

const schema = yup.object().shape({
  loginName: yup.string().required('please input login id'),
  password: yup.string().min(6, 'password at least 6 characters').required('please input password'),
});

const loginTabs = [
  { key: 'user', label: 'User Login' },
  { key: 'student', label: 'Student Login' },
];

export default function LoginPage() {
  const [tab, setTab] = useState<'user' | 'student'>('user');
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch
  } = useForm({
    resolver: yupResolver(schema),
  });

  // 学生登录表单字段
  const [parentNo, setParentNo] = useState('');
  const [studentLoginId, setStudentLoginId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentRemember, setStudentRemember] = useState(false);

  // 移除教师相关state

  const saveLoginData = (token: string, userInfo: any, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('userInfo', JSON.stringify(userInfo));
    Cookies.set('token', token, { expires: remember ? 7 : undefined, path: '/' });
    Cookies.set('userInfo', JSON.stringify(userInfo), { expires: remember ? 7 : undefined, path: '/' });
    window.dispatchEvent(new Event('userChanged'));
  };

  const clearLoginData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userInfo');
    Cookies.remove('token', { path: '/' });
    Cookies.remove('userInfo', { path: '/' });
    window.dispatchEvent(new Event('userChanged'));
  };

  // 页面加载时自动填充parentNo
  useEffect(() => {
    let val = '';
    if (typeof window !== 'undefined') {
      val = localStorage.getItem('parentNo') || '';
      if (!val) {
        // cookie优先级低于localStorage
        const cookieMatch = document.cookie.match(/(?:^|; )parentNo=([^;]*)/);
        if (cookieMatch) {
          try {
            val = decodeURIComponent(cookieMatch[1]);
          } catch {}
        }
      }
      if (val) setParentNo(val);
    }
  }, []);

  // 用户登录提交
  const onSubmit = async (data: any) => {
    setLoading(true);
    clearLoginData();
    const payload = {
      login_name: data.loginName,
      password: SHA256(data.password).toString(),
    };
    try {
      const res: any = await apiClient.post('/spwapi/login', payload);
      if (res && res.code === 0) {
        toast.success('Login successfully！');
        saveLoginData(res.data.token, res.data, data.remember)
        setTimeout(() => {
          router.push('/profile');
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

  // 学生登录提交
  const onStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearLoginData();
    // parentNo无论如何都要写入localStorage和cookie
    if (typeof window !== 'undefined') {
      localStorage.setItem('parentNo', parentNo);
      Cookies.set('parentNo', parentNo, { path: '/' });
    }
    // 新接口，参数需包含parent_no
    const payload = {
      login_name: studentLoginId,
      password: SHA256(studentPassword).toString(),
      parent_no: parentNo,
    };
    try {
      const res: any = await apiClient.post('/spwapi/student/login', payload);
      if (res && res.code === 0) {
        toast.success('Login successfully！');
        // 学生token存储，变量名严格为studentToken/studentInfo
        if (studentRemember) {
          localStorage.setItem('studentToken', res.data.Token);
          localStorage.setItem('studentInfo', JSON.stringify(res.data));
        } else {
          sessionStorage.setItem('studentToken', res.data.Token);
          sessionStorage.setItem('studentInfo', JSON.stringify(res.data));
        }
        Cookies.set('studentToken', res.data.Token, { expires: studentRemember ? 7 : undefined, path: '/' });
        Cookies.set('studentInfo', JSON.stringify(res.data), { expires: studentRemember ? 7 : undefined, path: '/' });
        Cookies.set('userType', 'student', { expires: studentRemember ? 7 : undefined, path: '/' });
        window.dispatchEvent(new Event('userChanged'));
        setTimeout(() => {
          router.push('/profile');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <ToastContainer position="top-center" autoClose={2000} />
      <div className="w-full max-w-2xl mx-auto rounded-[2.5rem] shadow-xl overflow-hidden p-0 bg-white/95 border border-blue-100">
        <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-300 py-4 px-2 sm:py-6 sm:px-6 text-center rounded-t-[2.5rem]">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide drop-shadow mb-0.5">Welcome Back</h2>
          <p className="text-white/80 text-sm sm:text-base font-normal">Sign in to your account</p>
        </div>
        <div className="px-2 py-4 sm:px-8 sm:py-6">
          <Tab.Group selectedIndex={loginTabs.findIndex(t => t.key === tab)} onChange={i => setTab(loginTabs[i].key as any)}>
            <Tab.List className="flex space-x-1 sm:space-x-3 mb-3 sm:mb-4 justify-center">
              {loginTabs.map(t => (
                <Tab key={t.key} className={({ selected }) =>
                  `px-4 sm:px-7 py-1.5 sm:py-2.5 rounded-full font-semibold text-base sm:text-lg focus:outline-none transition-all duration-200 border ${selected ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white border-blue-300 shadow-md' : 'bg-white text-blue-700 border-blue-100 hover:bg-blue-50'}`
                }>{t.label}</Tab>
              ))}
            </Tab.List>
          </Tab.Group>
          {tab === 'user' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 sm:space-y-3">
              <div>
                <label htmlFor="loginName" className="block text-gray-700 text-base font-medium mb-0.5">Login ID</label>
                <input
                  id="loginName"
                  type="text"
                  placeholder='please input email/login id/user no'
                  {...register('loginName')}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border ${errors.loginName ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-300 bg-gray-50 text-base sm:text-lg transition placeholder-gray-400`}
                />
                {errors.loginName && <p className="text-red-400 text-xs mt-0.5">{errors.loginName.message as string}</p>}
              </div>
              <div>
                <label htmlFor="password" className="block text-gray-700 text-base font-medium mb-0.5">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder='please input password, at least 6 characters'
                  {...register('password')}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border ${errors.password ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-300 bg-gray-50 text-base sm:text-lg transition placeholder-gray-400`}
                />
                {errors.password && <p className="text-red-400 text-xs mt-0.5">{errors.password.message as string}</p>}
              </div>
              <div className="flex justify-between items-center mb-0.5">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">Remember me</label>
                </div>
                <a href="#" className="text-xs text-blue-500 hover:underline">Forgot?</a>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-400 to-purple-400 text-white py-2 sm:py-2.5 px-4 rounded-xl font-semibold text-base sm:text-lg shadow hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:ring-offset-1 transition"
              >
                Login
              </button>
            </form>
          )}
          {tab === 'student' && (
            <form onSubmit={onStudentLogin} className="space-y-2 sm:space-y-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-2 sm:p-4 mt-1 shadow-sm border border-blue-100">
              <div>
                <label className="block text-blue-700 text-base font-medium mb-0.5">Parent User No</label>
                <input
                  type="text"
                  value={parentNo}
                  onChange={e => setParentNo(e.target.value)}
                  placeholder="Enter parent user no"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-blue-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white text-base sm:text-lg transition placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-blue-700 text-base font-medium mb-0.5">Student Login ID</label>
                <input
                  type="text"
                  value={studentLoginId}
                  onChange={e => setStudentLoginId(e.target.value)}
                  placeholder="Enter student login id"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-blue-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white text-base sm:text-lg transition placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-blue-700 text-base font-medium mb-0.5">Password</label>
                <input
                  type="password"
                  value={studentPassword}
                  onChange={e => setStudentPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-blue-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white text-base sm:text-lg transition placeholder-gray-400"
                />
              </div>
              <div className="flex items-center mb-0.5">
                <input
                  id="studentRemember"
                  type="checkbox"
                  checked={studentRemember}
                  onChange={e => setStudentRemember(e.target.checked)}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 rounded"
                />
                <label htmlFor="studentRemember" className="ml-2 block text-sm text-blue-700">Remember me</label>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-300 to-purple-300 text-white py-2 sm:py-2.5 px-4 rounded-xl font-semibold text-base sm:text-lg shadow hover:from-blue-400 hover:to-purple-400 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:ring-offset-1 transition"
              >
                Login
              </button>
            </form>
          )}
          <div className="mt-3 sm:mt-4 text-center">
            <p className="text-gray-500 text-sm sm:text-base">Not register? {' '}<Link href="/register" className="text-blue-500 hover:underline font-semibold">Register now</Link></p>
          </div>
          <div className="my-2 sm:my-3 border-t border-gray-200" />
          <div className="mt-2 sm:mt-3">
            <WalletLoginSection />
          </div>
        </div>
      </div>
    </div>
  );
} 