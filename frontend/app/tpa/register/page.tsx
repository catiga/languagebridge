'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaUser, FaGlobe, FaLanguage, FaBookReader, FaQuoteLeft, FaCertificate, FaChalkboardTeacher, FaEnvelope, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import { apiClient } from '../../utils/api';
import Link from 'next/link';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

interface CountryOption {
  value: string;
  label: string;
}

const schema = yup.object().shape({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirm_password: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  nationality_id: yup.string().required('Nationality is required'),
  living_country_id: yup.string().required('Country of residence is required'),
  first_language: yup.string().required('First language is required'),
  teach_language: yup.string().required('Teachable languages are required'),
  introduction: yup.string().min(6, 'Introduction must be at least 6 characters').required('Introduction is required'),
  invite_code: yup.string().required('Invite code is required'),
});

export default function TeacherRegisterPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema)
  });
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await apiClient.get('/spwapi/public/countries');
        if (res && res.data) {
          const options = res.data.map((item: any) => ({
            value: String(item.id),
            label: item.name,
          }));
          setCountryOptions(options);
        }
      } catch (error) {
        console.error("Failed to fetch countries", error);
        toast.error("Failed to load country list.");
      }
    };

    fetchCountries();
  }, []);

  const onSubmit = async (data: any) => {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email,
      password: data.password,
      nationality_id: Number(data.nationality_id),
      living_country_id: Number(data.living_country_id),
      introduction: data.introduction,
      first_language: data.first_language,
      teach_language: data.teach_language,
      invite_code: data.invite_code,
    };

    try {
        const res = await apiClient.post<any>('/spwapi/tpa/register', payload);
        if (res && res.code === 0) {
            toast.success("Application submitted successfully!");
            setTimeout(() => {
                window.location.href = '/tpa/login';
            }, 1500);
        } else {
            toast.error(res?.msg || "Submission failed. Please try again.");
        }
    } catch (e: any) {
        toast.error(e?.message || "An unexpected error occurred.");
    }
  };

  const inputStyle = "w-full px-4 py-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-300";
  const selectStyle = `${inputStyle} appearance-none`;
  const labelStyle = "flex items-center text-sm font-semibold text-gray-600 mb-2";
  const errorStyle = "text-red-500 text-xs mt-1";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <ToastContainer position="bottom-right" />
      <div className="max-w-4xl w-full mx-auto grid md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left Side - Welcome Message */}
        <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl font-bold leading-tight">Become a LangBridge Educator</h1>
            <p className="mt-4 text-blue-100">
              Join a global community dedicated to shaping the future of language learning. We provide the tools, you provide the expertise.
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-start"><FaGlobe className="w-5 h-5 mr-3 mt-1 flex-shrink-0" /><span>Reach students from all over the world.</span></li>
              <li className="flex items-start"><FaChalkboardTeacher className="w-5 h-5 mr-3 mt-1 flex-shrink-0" /><span>Utilize our AI co-pilot to enhance your lessons.</span></li>
              <li className="flex items-start"><FaCertificate className="w-5 h-5 mr-3 mt-1 flex-shrink-0" /><span>Build your professional reputation on a trusted platform.</span></li>
            </ul>
          </motion.div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Teacher Application</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="first_name" className={labelStyle}><FaUser className="mr-2"/>First Name</label>
                <input id="first_name" {...register("first_name")} className={inputStyle} />
                {errors.first_name && <p className={errorStyle}>{errors.first_name.message}</p>}
              </div>
              <div>
                <label htmlFor="last_name" className={labelStyle}><FaUser className="mr-2"/>Last Name</label>
                <input id="last_name" {...register("last_name")} className={inputStyle} />
                {errors.last_name && <p className={errorStyle}>{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelStyle}><FaEnvelope className="mr-2"/>Email Address</label>
              <input id="email" type="email" {...register("email")} className={inputStyle} />
              {errors.email && <p className={errorStyle}>{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className={labelStyle}><FaLock className="mr-2"/>Password</label>
              <input id="password" type="password" {...register("password")} className={inputStyle} />
              {errors.password && <p className={errorStyle}>{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirm_password" className={labelStyle}><FaLock className="mr-2"/>Confirm Password</label>
              <input id="confirm_password" type="password" {...register("confirm_password")} className={inputStyle} />
              {errors.confirm_password && <p className={errorStyle}>{errors.confirm_password.message}</p>}
            </div>

            <div>
              <label htmlFor="nationality_id" className={labelStyle}><FaUser className="mr-2"/>Nationality</label>
              <select id="nationality_id" {...register("nationality_id")} className={selectStyle}>
                <option value="">Select your nationality...</option>
                {countryOptions.map(opt => <option key={`nat-${opt.value}`} value={opt.value}>{opt.label}</option>)}
              </select>
              {errors.nationality_id && <p className={errorStyle}>{errors.nationality_id.message}</p>}
            </div>
            
            <div>
              <label htmlFor="living_country_id" className={labelStyle}><FaGlobe className="mr-2"/>Country of Residence</label>
              <select id="living_country_id" {...register("living_country_id")} className={selectStyle}>
                <option value="">Select your country of residence...</option>
                {countryOptions.map(opt => <option key={`res-${opt.value}`} value={opt.value}>{opt.label}</option>)}
              </select>
              {errors.living_country_id && <p className={errorStyle}>{errors.living_country_id.message}</p>}
            </div>

            <div>
              <label htmlFor="first_language" className={labelStyle}><FaLanguage className="mr-2"/>First Language (Mother Tongue)</label>
              <input id="first_language" {...register("first_language")} className={inputStyle} />
              {errors.first_language && <p className={errorStyle}>{errors.first_language.message}</p>}
            </div>

            <div>
              <label htmlFor="teach_language" className={labelStyle}><FaBookReader className="mr-2"/>Teachable Languages</label>
              <input id="teach_language" {...register("teach_language")} placeholder="e.g., English, Spanish" className={inputStyle} />
              {errors.teach_language && <p className={errorStyle}>{errors.teach_language.message}</p>}
            </div>
            
            <div>
              <label htmlFor="introduction" className={labelStyle}><FaQuoteLeft className="mr-2"/>Personal Introduction</label>
              <textarea id="introduction" {...register("introduction")} rows={4} className={inputStyle} placeholder="Tell students a bit about yourself and your teaching style."></textarea>
              {errors.introduction && <p className={errorStyle}>{errors.introduction.message}</p>}
            </div>

            <div>
              <label htmlFor="invite_code" className={labelStyle}><FaLock className="mr-2"/>Invite Code</label>
              <input id="invite_code" {...register("invite_code")}
                className={inputStyle} placeholder="Enter your invite code" />
              {errors.invite_code && <p className={errorStyle}>{errors.invite_code.message}</p>}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
            
            <p className="text-center text-sm text-gray-500">
              Already have a teacher account? <Link href="/tpa/login" className="font-semibold text-blue-600 hover:underline">Log In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
} 