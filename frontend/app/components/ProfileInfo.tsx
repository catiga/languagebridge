'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { apiClient } from '../utils/api';
import { toast, ToastContainer } from 'react-toastify';

const schema = yup.object().shape({
  nick_name: yup.string().required('Nickname is required'),
  avatar: yup.string().url('Avatar must be a valid URL').nullable(),
  living_country_id: yup.string().required('Country/District is required'),
  phone: yup.string().nullable(),
  native_language: yup.string().required('First language is required'),
});

interface ProfileInfoProps {
  onLoading: (loading: boolean) => void;
}

export default function ProfileInfo({ onLoading }: ProfileInfoProps) {
  const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    onLoading(true);
    Promise.all([
      apiClient.get('/spwapi/public/countries'),
      apiClient.post('/spwapi/auth/profile/retrieve')
    ]).then(([countriesRes, profileRes]) => {
      if (countriesRes && countriesRes.data) {
        const options = countriesRes.data.map((item: any) => ({ value: String(item.id), label: item.name }));
        setCountryOptions(options);
      }
      if (profileRes && profileRes.code === 0) {
        const data = profileRes.data;
        setProfile(data);
        setValue('nick_name', data.nick_name || '');
        setValue('avatar', data.avatar || '');
        setValue('living_country_id', data.living_country_id ? String(data.living_country_id) : '');
        setValue('phone', data.phone || '');
        setValue('native_language', data.native_language || '');
      } else {
        toast.error(profileRes?.msg || 'Failed to fetch profile');
      }
    }).catch((e) => {
      toast.error(e?.message || 'Failed to load page data');
    }).finally(() => {
      onLoading(false);
    });
  }, [setValue, onLoading]);

  const onSubmit = async (data: any) => {
    onLoading(true);
    const payload = { ...data, living_country_id: Number(data.living_country_id) };
    try {
      const res = await apiClient.post('/spwapi/auth/profile/update', payload);
      if (res && res.code === 0) {
        toast.success('Update successfully');
        setProfile((prev: any) => ({ ...prev, ...payload }));
      } else {
        toast.error(res?.msg || 'Update failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Update failed');
    } finally {
      onLoading(false);
    }
  };
  
  const inputStyle = "w-full px-4 py-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-300";
  const labelStyle = "block text-sm font-semibold text-gray-600 mb-2";

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg max-w-3xl mx-auto">
      <ToastContainer position="bottom-right" />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Personal Information</h1>
      <p className="text-gray-500 mb-8">Keep your profile details up to date.</p>
      
      <div className="mb-6">
        <label className={labelStyle}>User No</label>
        <div className="w-full px-4 py-3 bg-slate-200 text-gray-700 rounded-lg font-mono">
          {profile?.user_no || '...'}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="nick_name" className={labelStyle}>Nickname</label>
          <input id="nick_name" type="text" {...register('nick_name')} className={inputStyle} />
          {errors.nick_name && <p className="text-red-500 text-xs mt-1">{errors.nick_name.message}</p>}
        </div>

        <div>
          <label htmlFor="avatar" className={labelStyle}>Avatar URL</label>
          <input id="avatar" type="text" {...register('avatar')} className={inputStyle} placeholder="https://example.com/avatar.png" />
          {errors.avatar && <p className="text-red-500 text-xs mt-1">{errors.avatar.message}</p>}
        </div>

        <div>
          <label htmlFor="living_country_id" className={labelStyle}>Country/District</label>
          <select id="living_country_id" {...register('living_country_id')} className={inputStyle}>
            <option value="" disabled>Select a country</option>
            {countryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {errors.living_country_id && <p className="text-red-500 text-xs mt-1">{errors.living_country_id.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className={labelStyle}>Phone</label>
          <input id="phone" type="text" {...register('phone')} className={inputStyle} />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>
        
        <div>
          <label htmlFor="native_language" className={labelStyle}>First Language</label>
          <input id="native_language" type="text" {...register('native_language')} className={inputStyle} />
          {errors.native_language && <p className="text-red-500 text-xs mt-1">{errors.native_language.message}</p>}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:shadow-none"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 