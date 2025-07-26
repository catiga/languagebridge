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
import InterestSelection from '../v2/register/interest-selection'; // Import the new component
import CustomSelect from '../v2/components/custom-select'; // Import the new custom select component

const step1Schema = yup.object().shape({
  name: yup.string().required('Please input your name'),
  email: yup.string().email('Please input valid email').required('Please input email'),
  country: yup.string().required('Please select your located country'),
  password: yup.string().min(6, 'Password must be at least 6 characters long').required('Please input password'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'The two passwords do not match')
    .required('Please confirm password'),
  terms: yup.bool().oneOf([true], 'Please agree Terms of service and Privacy policy'),
});

const step2Schema = yup.object().shape({
  interestCategories: yup.array().of(yup.string()).min(1, 'Please select at least one interest category'),
});

export default function RegisterPage() {
  const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userNo, setUserNo] = useState<string | null>(null); // State to store user_no
  const [provisionalToken, setProvisionalToken] = useState<string | null>(null); // State to store provisional_token
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    formState: { errors },
    watch,
    setError,
    clearErrors,
    unregister
  } = useForm({
    // We will handle validation based on the current step manually
    defaultValues: {
      country: '',
      terms: false,
      interestCategories: [],
    },
  });

  // Simulate fetching interest categories
  const mockInterestCategories = [
    { id: 2, name: 'Speaking Practice', desc: 'Improve spoken English skills' },
    { id: 3, name: 'Listening Practice', desc: 'Train English listening comprehension' },
    { id: 4, name: 'Reading & Writing', desc: 'Enhance reading and writing in English' },
    { id: 5, name: 'IELTS Preparation', desc: 'Prepare for IELTS exams' },
    { id: 6, name: 'TOEFL Preparation', desc: 'Prepare for TOEFL exams' },
    { id: 7, name: 'Business English', desc: 'English for professional and workplace communication' },
    { id: 8, name: 'Kids English', desc: 'English learning for children' },
  ];

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

  useEffect(() => {
    // Manually set resolver based on step to get correct errors
    if (step === 1) {
        // No need to explicitly set resolver here if using trigger for validation
    } else {
        // No need to explicitly set resolver here if using trigger for validation
    }
  }, [step]);

  const handleInterestCategoryChange = (selectedCategories: string[]) => {
    setValue('interestCategories', selectedCategories);
    if (selectedCategories.length > 0) {
      clearErrors('interestCategories');
    }
  };

  const handleNextStep = async () => {
    // Manually trigger validation for step 1 fields
    const isStep1Valid = await trigger(['name', 'email', 'country', 'password', 'confirmPassword', 'terms']);

    if (isStep1Valid) {
      setLoading(true);
      const step1Data = getValues();
      const payload = {
        email: step1Data.email,
        password: step1Data.password,
        name: step1Data.name,
        country: Number(step1Data.country),
        // Note: interest_categories is not included in step 1 submission
      };
      try {
        const res = await apiClient.post('/spwapi/register', payload);
        if (res && res.code === 0 && res.data) { // Check for res.data
          toast.success('Registration step 1 successful!');
          // Store user_no and provisional_token from response
          setUserNo(res.data.user_no);
          setProvisionalToken(res.data.provisional_token);
          setStep(2); // Move to step 2 on success
        } else {
          toast.error(res?.msg || 'Registration step 1 failed');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Registration step 1 failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSkip = () => {
    // Logic for skipping interest selection - redirect to login page
    router.push('/login');
  };

  const handleFinish = async () => {
    // Manually trigger validation for step 2 fields
    const isStep2Valid = await trigger(['interestCategories']);

    if (isStep2Valid) {
      if (!userNo || !provisionalToken) {
          toast.error('User data missing. Please try registering again.');
          return;
      }

      setLoading(true);
      const step2Data = getValues(); // Get data from step 2

      // Convert string tag IDs to numbers (uint64) for the payload
      const selectedTagIds = step2Data.interestCategories.map((tagId: string) => parseInt(tagId, 10));

      const payload = {
        provisiontal_token: provisionalToken,
        user_no: userNo,
        tags: selectedTagIds,
      };

      try {
        // Call the new API endpoint to submit interest categories
        const res = await apiClient.post('/spwapi/register/withTags', payload);
        if (res && res.code === 0) {
          toast.success('Interest categories saved!');
          router.push('/login'); // Redirect to login page directly
        } else {
          toast.error(res?.msg || 'Failed to save interest categories');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to save interest categories');
      } finally {
        setLoading(false);
      }
    }
  };

   const onSubmit = async (data: any) => {
    // onSubmit is now a placeholder as logic is handled in handleNextStep and handleFinish
    // This function is still needed for handleSubmit to wire up
    console.log('Form submitted', data);
  };


  const renderStep1 = () => (
    <>
      <div className="mb-6">
        <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
          Name
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
          Country/District
        </label>
        {/* Using CustomSelect component */}
        <CustomSelect
          options={countryOptions}
          value={watch('country')}
          onChange={(value) => setValue('country', value.toString())}
          placeholder="Select Country"
          error={errors.country?.message as string}
        />
        {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message as string}</p>}
      </div>

      <div className="mb-6">
        <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
          Email
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
          Password
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
          Confirm password
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
          I agree <a href="#" className="text-blue-600 hover:underline">Terms of service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy policy</a>
        </label>
      </div>
      {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms.message as string}</p>}

      <button
        type="button"
        onClick={handleNextStep}
        disabled={loading}
        className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Processing...' : 'Next'}
      </button>
    </>
  );

  const renderStep2 = () => (
    <>
      <InterestSelection
        // categories={mockInterestCategories} // Now fetched inside InterestSelection
        selectedCategories={watch('interestCategories') || []}
        onCategoryChange={handleInterestCategoryChange}
        error={errors.interestCategories?.message as string}
      />
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={handleSkip}
          className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition duration-300"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleFinish}
          disabled={loading}
          className={`bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 ${loading ? 'Saving...' : 'Finish'}`}
        >
          {loading ? 'Saving...' : 'Finish'}
        </button>
      </div>
    </>
  );

  return (
    <div className="container mx-auto px-6 py-16">
      <ToastContainer position="top-center" autoClose={2000} />
      <div className="flex flex-col lg:flex-row gap-12 max-w-4xl mx-auto">
        {/* Registration Form Area */}
        <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-md overflow-hidden p-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Create Your Account</h2>
          {/* The form onSubmit is still needed for handleSubmit to wire up */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account? {' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Selling Points Area */}
        <div className="w-full lg:w-1/2 p-8 bg-gray-100 rounded-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Unlock Your Potential</h3>
          <div className="space-y-6">
            {/* Selling Point 1 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {/* Icon/Illustration Placeholder */}
                <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-700">Visualize Progress</h4>
                <p className="text-gray-600">Track every step and celebrate every milestone with clear, visual progress reports.</p>
              </div>
            </div>

            {/* Selling Point 2 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {/* Icon/Illustration Placeholder */}
                <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-700">Personalized Growth</h4>
                <p className="text-gray-600">Our AI-powered assessments create a unique learning journey tailored to individual needs.</p>
              </div>
            </div>

            {/* Selling Point 3 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-700">Unlock Potential</h4>
                <p className="text-gray-600">
                  Gain access to tailored courses and resources as you progress through learning levels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
