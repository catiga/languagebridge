'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '../utils/api';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SHA256 from 'crypto-js/sha256';

const schema = yup.object().shape({
  loginName: yup.string().required('please input login id'),
  password: yup.string().min(6, 'password at least 6 characters').required('please input password'),
});

export default function LoginPage() {
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

  const saveLoginData = (token: string, userInfo: any, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('userInfo', JSON.stringify(userInfo));
  };

  const clearLoginData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userInfo');
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    clearLoginData();
    const payload = {
      login_name: data.loginName,
      password: SHA256(data.password).toString(),
    };
    try {
      const res = await apiClient.post('/spwapi/login', payload);
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

  return (
    <div className="container mx-auto px-6 py-16">
      <ToastContainer position="top-center" autoClose={2000} />
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              Login ID
            </label>
            <input
              id="loginName"
              type="text"
              placeholder='please input email/login id/user no'
              {...register('loginName')}
              className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.loginName && <p className="text-red-500 text-xs mt-1">{errors.loginName.message as string}</p>}
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder='please input password, at least 6 characters'
              {...register('password')}
              className={`w-full px-4 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
          </div>
          
          <div className="flex justify-between items-center mb-6">
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
              Forgot?
            </a>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300"
          >
            Login
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Not register? {' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 