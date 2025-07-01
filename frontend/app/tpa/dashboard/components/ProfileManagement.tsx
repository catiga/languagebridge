'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaGlobe, 
  FaMapMarkerAlt, 
  FaLanguage, 
  FaEdit, 
  FaSave, 
  FaCamera,
  FaStar,
  FaTrophy,
  FaGraduationCap,
  FaHeart
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { apiClient } from '@/app/utils/api';
import TeacherEmailVerifyBanner from './TeacherEmailVerifyBanner';

// This interface represents the a successful API response structure
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface Country {
  id: number;
  name: string;
}

// Define the structure of the teacher profile data from the API
interface TeacherProfile {
  teacher_no: string;
  name: string;
  first_name: string;
  last_name: string;
  first_language: string;
  email: string;
  nationality_id: number;
  living_country_id: number;
  introduction: string;
  detail: string;
  avatar: string;
  phone_code: string;
  phone: string;
  status: string;
  email_verified: boolean;
}

export default function ProfileManagement() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalityId: 0,
    livingCountryId: 0,
    languages: [] as string[],
    bio: '',
    avatar: '/default-avatar.svg',
    rating: 0,
    totalStudents: 0,
    totalLessons: 0,
    certificates: [] as string[],
    detail: '',
    email_verified: false,
    status: '',
  });

  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        // Fetch both profile and countries data in parallel
        const [profileResponse, countriesResponse] = await Promise.all([
          apiClient.get<ApiResponse<TeacherProfile>>('/spwapi/tpa/auth/profile/retrieve'),
          apiClient.get<ApiResponse<Country[]>>('/spwapi/public/countries')
        ]);
        
        // Process profile data
        const teacherData = profileResponse.data;
        const updatedProfile = {
          ...profile,
          name: teacherData.name,
          firstName: teacherData.first_name,
          lastName: teacherData.last_name,
          email: teacherData.email,
          phone: `${teacherData.phone_code} ${teacherData.phone}`,
          nationalityId: teacherData.nationality_id,
          livingCountryId: teacherData.living_country_id,
          languages: [teacherData.first_language],
          bio: teacherData.introduction,
          detail: teacherData.detail,
          avatar: teacherData.avatar || '/default-avatar.svg',
          email_verified: teacherData.email_verified,
          status: teacherData.status,
        };
        setProfile(updatedProfile);
        setFormData(updatedProfile);

        // Process countries data
        if (countriesResponse.data) {
          setCountries(countriesResponse.data);
        }

      } catch (error) {
        console.error('Failed to fetch initial data', error);
        toast.error('Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // If the avatar is a blob URL, it means a new file was selected. Upload it first.
      let avatarUrl = formData.avatar;
      if (avatarUrl.startsWith('blob:')) {
        const imageFile = await fetch(avatarUrl).then(r => r.blob());
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        // Note: You should replace this with your own ImgBB API key.
        const apiKey = 'bbf086ea0c965eeb43bb982b048f1d1b'; 
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: 'POST',
          body: uploadData,
        });
        
        const result = await response.json();
        if (result.success) {
          avatarUrl = result.data.url;
        } else {
          throw new Error('Image upload failed: ' + result.error.message);
        }
      }

      const payload = {
        name: formData.name,
        first_name: formData.firstName,
        last_name: formData.lastName,
        nationality_id: formData.nationalityId,
        living_country_id: formData.livingCountryId,
        introduction: formData.bio,
        detail: formData.detail,
        first_language: formData.languages[0] || '',
        avatar: avatarUrl,
      };
      await apiClient.post('/spwapi/tpa/auth/profile/update', payload);
      
      const newProfileState = { ...formData, avatar: avatarUrl };
      setProfile(newProfileState);
      setFormData(newProfileState);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Create a local URL for preview
      const newAvatarUrl = URL.createObjectURL(file);
      setFormData({ ...formData, avatar: newAvatarUrl });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {profile.status === '00' && (
        <TeacherEmailVerifyBanner
          email={profile.email}
          emailVerified={false}
          onRefresh={async () => {
            try {
              const res = await apiClient.get<ApiResponse<TeacherProfile>>('/spwapi/tpa/auth/profile/retrieve');
              if (res && res.data) {
                setProfile({
                  ...profile,
                  email: res.data.email,
                  status: res.data.status,
                });
              }
            } catch {}
          }}
        />
      )}
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Profile Management
          </h2>
          <p className="text-gray-600 mt-2">Manage your personal information and teaching profile</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            isEditing 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
          }`}
        >
          {isEditing ? <FaSave className="w-4 h-4" /> : <FaEdit className="w-4 h-4" />}
          <span>{isEditing ? 'Save' : 'Edit'}</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="text-center">
              <div className="relative inline-block">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-purple-500 p-1"
                >
                  <Image 
                    src={isEditing ? formData.avatar : profile.avatar} 
                    alt={profile.name}
                    width={128}
                    height={128}
                    className="w-full h-full rounded-full object-cover"
                  />
                </motion.div>
                {isEditing && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => avatarFileRef.current?.click()}
                      className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                    >
                      <FaCamera className="w-4 h-4" />
                    </motion.button>
                    <input
                      type="file"
                      ref={avatarFileRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif"
                    />
                  </>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{profile.name}</h3>
              <div className="flex items-center justify-center space-x-1 mb-4">
                <FaStar className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-gray-700">{profile.rating}</span>
                <span className="text-gray-500">({profile.totalStudents} students)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{profile.totalLessons}</div>
                  <div className="text-sm text-gray-600">Total Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{profile.totalStudents}</div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
              </div>

              {/* Certificates */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center justify-center">
                  <FaTrophy className="w-4 h-4 mr-2 text-yellow-500" />
                  Certificates
                </h4>
                <div className="space-y-2">
                  {profile.certificates.map((cert, index) => (
                    <motion.div
                      key={cert}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center space-x-2 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg"
                    >
                      <FaGraduationCap className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-700">{cert}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="w-4 h-4 mr-2" />
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="w-4 h-4 mr-2" />
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="w-4 h-4 mr-2" />
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FaEnvelope className="w-4 h-4 mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={true}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FaPhone className="w-4 h-4 mr-2" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FaGlobe className="w-4 h-4 mr-2" />
                  Nationality
                </label>
                <select
                  value={formData.nationalityId}
                  onChange={(e) => setFormData({...formData, nationalityId: Number(e.target.value)})}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Select Nationality</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.id}>{country.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                  Living Country
                </label>
                <select
                  value={formData.livingCountryId}
                  onChange={(e) => setFormData({...formData, livingCountryId: Number(e.target.value)})}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                >
                   <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.id}>{country.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FaLanguage className="w-4 h-4 mr-2" />
                  Languages
                </label>
                <input
                  type="text"
                  value={formData.languages.join(', ')}
                  onChange={(e) => setFormData({...formData, languages: e.target.value.split(', ')})}
                  disabled={!isEditing}
                  placeholder="Separate multiple languages with commas"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FaHeart className="w-4 h-4 mr-2" />
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                disabled={!isEditing}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 resize-none"
              />
            </div>
            
            <div className="mt-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FaHeart className="w-4 h-4 mr-2" />
                Detailed Introduction
              </label>
              <textarea
                value={formData.detail}
                onChange={(e) => setFormData({...formData, detail: e.target.value})}
                disabled={!isEditing}
                rows={6}
                placeholder="Share more about your teaching philosophy, experience, or what students can expect from your classes."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-end space-x-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 