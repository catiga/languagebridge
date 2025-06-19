'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { apiClient } from '../utils/api';
import { ToastContainer, toast } from 'react-toastify';

const schema = yup.object().shape({
  nick_name: yup.string().required('请输入昵称'),
  avatar: yup.string().url('头像必须是有效的URL').nullable(),
  living_country_id: yup.string().required('请选择国家/地区'),
  phone: yup.string().nullable(),
  native_language: yup.string().required('请选择母语'),
});

export default function ProfileInfo() {
  const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nick_name: '',
      avatar: '',
      living_country_id: 'CN',
      phone: '',
      native_language: '',
    },
  });

  useEffect(() => {
    apiClient.get('/spwapi/public/countries').then((data) => {
      const options = data?.data?.map((item: any) => ({
        value: String(item.id),
        label: item.name,
      })) || [];
      setCountryOptions(options);
    });
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await apiClient.post('/spwapi/auth/profile/retrieve');
        if (res && res.code === 0) {
          setProfile(res.data);
        } else {
          toast.error(res?.msg || '获取信息失败');
        }
      } catch (e: any) {
        toast.error(e?.message || '获取信息失败');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // 3. options和profile都加载后再setValue
  useEffect(() => {
    if (profile && countryOptions.length > 0) {
      setValue('nick_name', profile.nick_name || '');
      setValue('avatar', profile.avatar || '');
      setValue('living_country_id', profile.living_country_id ? String(profile.living_country_id) : 'CN');
      setValue('phone', profile.phone || '');
      setValue('native_language', profile.native_language || '');
    }
  }, [profile, countryOptions, setValue]);

  // 保存
  const onSubmit = async (data: any) => {
    setLoading(true);
    const payload = {
      nick_name: data.nick_name,
      avatar: data.avatar,
      living_country_id: Number(data.living_country_id),
      phone: data.phone,
      native_language: data.native_language,
    };
    try {
      const res = await apiClient.post('/spwapi/auth/profile/update', payload);
      if (res && res.code === 0) {
        toast.success('Update successfully');
        setProfile({ ...profile, ...data });
      } else {
        toast.error(res?.msg || 'Update failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded shadow">
      <ToastContainer position="top-center" autoClose={2000} />
      <h2 className="text-2xl font-bold mb-6">Personal Information</h2>
      <div className="mb-4">
        <label className="block mb-1">User No</label>
        <div className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-700">
          {profile?.user_no || ''}
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block mb-1">Nick name</label>
          <input
            type="text"
            {...register('nick_name')}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.nick_name && <p className="text-red-500 text-xs">{errors.nick_name.message}</p>}
        </div>
        <div className="mb-4">
          <label className="block mb-1">Avatar</label>
          <input
            type="text"
            {...register('avatar')}
            className="w-full border px-3 py-2 rounded"
            placeholder="https://example.com/avatar.png"
          />
          {errors.avatar && <p className="text-red-500 text-xs">{errors.avatar.message}</p>}
        </div>
        <div className="mb-4">
          <label className="block mb-1">Country/District</label>
          <select
            {...register('living_country_id')}
            className="w-full border px-3 py-2 rounded"
          >
            {countryOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.living_country_id && <p className="text-red-500 text-xs">{errors.living_country_id.message}</p>}
        </div>
        <div className="mb-4">
          <label className="block mb-1">Phone</label>
          <input
            type="text"
            {...register('phone')}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
        </div>
        <div className="mb-4">
          <label className="block mb-1">First language</label>
          <input
            type="text"
            {...register('native_language')}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.native_language && <p className="text-red-500 text-xs">{errors.native_language.message}</p>}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
} 