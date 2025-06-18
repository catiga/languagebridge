'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '../utils/api';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const schema = yup.object().shape({
  name: yup.string().required('请输入您的姓名'),
  email: yup.string().email('请输入有效的邮箱地址').required('请输入邮箱'),
  country: yup.string().required('请选择国家/地区'),
  password: yup.string().min(6, '密码长度不能少于6位').required('请输入密码'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], '两次输入的密码不一致')
    .required('请再次输入密码'),
  terms: yup.bool().oneOf([true], '请同意服务条款和隐私政策'),
});

export default function RegisterPage() {
  const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
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
    defaultValues: {
      country: '',
      terms: false,
    },
  });

  useEffect(() => {
    apiClient.get('/spwapi/public/countries').then((data) => {
      const options = data?.data?.map((item: any) => ({
        value: item.id,
        label: item.name,
      })) || [];
      setCountryOptions(options);
      // 默认选中China
      const chinaOption = options.find((opt: any) => opt.label.includes('China') || opt.label.includes('中国'));
      if (chinaOption) {
        setValue('country', chinaOption.value);
      } else if (options.length > 0) {
        setValue('country', options[0].value);
      }
    });
  }, [setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    const payload = {
      email: data.email,
      password: data.password,
      name: data.name,
      country: Number(data.country),
      // language 字段可根据需要添加
    };
    try {
      const res = await apiClient.post('/spwapi/register', payload);
      if (res && res.code === 0) {
        toast.success('注册成功！');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        toast.error(res?.msg || '注册失败');
      }
    } catch (err: any) {
      toast.error(err?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-16">
      <ToastContainer position="top-center" autoClose={2000} />
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">注册</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-6">
            <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
              姓名
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="country" className="block text-gray-700 text-sm font-medium mb-2">
              国家/地区
            </label>
            <select
              id="country"
              {...register('country')}
              className={`w-full px-4 py-2 border ${errors.country ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
            >
              {countryOptions.length === 0 ? (
                <option value="">加载中...</option>
              ) : (
                countryOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))
              )}
            </select>
            {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message as string}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              电子邮箱
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
              密码
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className={`w-full px-4 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className={`w-full px-4 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>}
          </div>

          <div className="flex items-center mb-6">
            <input
              id="terms"
              type="checkbox"
              {...register('terms')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              我同意 <a href="#" className="text-blue-600 hover:underline">服务条款</a> 和 <a href="#" className="text-blue-600 hover:underline">隐私政策</a>
            </label>
          </div>
          {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms.message as string}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            已有账号? {' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 