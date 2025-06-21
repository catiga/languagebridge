'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { apiClient } from '../utils/api';
import { ToastContainer, toast } from 'react-toastify';

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
    formState: { errors },
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
        const options = countriesRes.data.map((item: any) => ({
          value: String(item.id),
          label: item.name,
        }));
        setCountryOptions(options);
      }

      if (profileRes && profileRes.code === 0) {
        setProfile(profileRes.data);
        // Set form values once data is fetched
        setValue('nick_name', profileRes.data.nick_name || '');
        setValue('avatar', profileRes.data.avatar || '');
        setValue('living_country_id', profileRes.data.living_country_id ? String(profileRes.data.living_country_id) : '');
        setValue('phone', profileRes.data.phone || '');
        setValue('native_language', profileRes.data.native_language || '');
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
    const payload = {
      ...data,
      living_country_id: Number(data.living_country_id),
    };
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

  const inputStyle = "w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
      <ToastContainer position="top-center" autoClose={2000} />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Personal Information</h1>
      
      <div className="mb-6">
        <label className={labelStyle}>User No</label>
        <div className="w-full px-4 py-2 border border-gray-200 bg-gray-100 text-gray-600 rounded-md">
          {profile?.user_no || '...'}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="nick_name" className={labelStyle}>Nick name</label>
          <input id="nick_name" type="text" {...register('nick_name')} className={inputStyle} />
          {errors.nick_name && <p className="text-red-500 text-xs mt-1">{errors.nick_name.message}</p>}
        </div>

        <div>
          <label htmlFor="avatar" className={labelStyle}>Avatar</label>
          <input id="avatar" type="text" {...register('avatar')} className={inputStyle} placeholder="https://example.com/avatar.png" />
          {errors.avatar && <p className="text-red-500 text-xs mt-1">{errors.avatar.message}</p>}
        </div>

        <div>
          <label htmlFor="living_country_id" className={labelStyle}>Country/District</label>
          <select id="living_country_id" {...register('living_country_id')} className={inputStyle}>
            <option value="" disabled>Select a country</option>
            {countryOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.living_country_id && <p className="text-red-500 text-xs mt-1">{errors.living_country_id.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className={labelStyle}>Phone</label>
          <input id="phone" type="text" {...register('phone')} className={inputStyle} />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>
        
        <div>
          <label htmlFor="native_language" className={labelStyle}>First language</label>
          <input id="native_language" type="text" {...register('native_language')} className={inputStyle} />
          {errors.native_language && <p className="text-red-500 text-xs mt-1">{errors.native_language.message}</p>}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 disabled:bg-gray-400"
            disabled={onLoading === undefined ? false : (!!onLoading)}
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
} 