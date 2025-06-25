'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { apiClient } from '../utils/api';
import { toast, ToastContainer } from 'react-toastify';
import Image from 'next/image';
import { FaCamera } from 'react-icons/fa';
import type { ApiResponse } from '../utils/interfaces';
import { useRouter } from 'next/navigation';

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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarFileRef = React.useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const router = useRouter();

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
      apiClient.get<ApiResponse<any>>('/spwapi/public/countries'),
      apiClient.post<ApiResponse<any>>('/spwapi/auth/profile/retrieve')
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
        setAvatarPreview(data.avatar || '/default-avatar.svg');
        setValue('living_country_id', data.living_country_id ? String(data.living_country_id) : '');
        setValue('phone', data.phone || '');
        setValue('native_language', data.native_language || '');
        setEmail(data.email || '');
        setStatus(data.status || '');
      } else {
        toast.error((profileRes as ApiResponse<any>)?.msg || 'Failed to fetch profile');
      }
    }).catch((e) => {
      toast.error(e?.message || 'Failed to load page data');
    }).finally(() => {
      onLoading(false);
    });
  }, [setValue, onLoading]);

  const handleSendCode = async () => {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }
    setSendingCode(true);
    try {
      const res = await apiClient.post<ApiResponse<any>>('/spwapi/auth/send_email_code', { email });
      if (res && res.code === 0) {
        toast.success('Verification code sent!');
        setCodeSent(true);
      } else {
        toast.error(res?.msg || 'Failed to send code');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      toast.error('Please enter the verification code');
      return;
    }
    setVerifying(true);
    try {
      const res = await apiClient.post<ApiResponse<any>>('/spwapi/auth/verify_email_code', { email, code });
      if (res && res.code === 0) {
        toast.success('Email verified!');
        setEmailVerified(true);
      } else {
        toast.error(res?.msg || 'Verification failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = async (data: any) => {
    onLoading(true);
    const payload = { ...data, living_country_id: Number(data.living_country_id), email };
    try {
      const res = await apiClient.post<ApiResponse<any>>('/spwapi/auth/profile/update', payload);
      if (res && res.code === 0) {
        toast.success('Update successfully');
        setProfile((prev: any) => ({ ...prev, ...payload }));
      } else {
        toast.error((res as ApiResponse<any>)?.msg || 'Update failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Update failed');
    } finally {
      onLoading(false);
    }
  };
  
  const inputStyle = "w-full px-4 py-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-300";
  const labelStyle = "block text-sm font-semibold text-gray-600 mb-2";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarPreview(URL.createObjectURL(file));
      const uploadData = new FormData();
      uploadData.append('image', file);
      const apiKey = 'bbf086ea0c965eeb43bb982b048f1d1b';
      try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`,
          { method: 'POST', body: uploadData });
        const result = await response.json();
        if (result.success) {
          setValue('avatar', result.data.url);
          setAvatarPreview(result.data.url);
          toast.success('Avatar uploaded!');
        } else {
          toast.error('Image upload failed: ' + (result.error?.message || ''));
        }
      } catch (err) {
        toast.error('Image upload failed');
      }
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg max-w-3xl mx-auto">
      <ToastContainer position="bottom-right" />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Personal Information</h1>
      <p className="text-gray-500 mb-8">Keep your profile details up to date.</p>
      
      <div className="mb-6 flex flex-col items-center">
        <div className="relative inline-block mb-2">
          <img
            src={avatarPreview || '/default-avatar.svg'}
            alt="avatar"
            width={96}
            height={96}
            className="rounded-full object-cover border-2 border-blue-200"
          />
          <button
            type="button"
            onClick={() => avatarFileRef.current?.click()}
            className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            <FaCamera className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={avatarFileRef}
            onChange={handleAvatarChange}
            className="hidden"
            accept="image/png, image/jpeg, image/gif"
          />
        </div>
      </div>

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
          <label htmlFor="email" className={labelStyle}>Email</label>
          <div className="flex gap-2 items-center">
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className={inputStyle + ' bg-gray-100 cursor-not-allowed'}
            />
            <button
              type="button"
              onClick={() => router.push('/profile/email')}
              className={
                status === '20'
                  ? 'px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold border border-green-300 hover:bg-green-200 transition-colors'
                  : 'px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold border border-blue-300 hover:bg-blue-200 transition-colors'
              }
            >
              {status === '20' ? 'Verified' : 'Unverified'}
            </button>
          </div>
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