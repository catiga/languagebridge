"use client";
import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/app/utils/api';
import { ToastContainer, toast } from 'react-toastify';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import ProfileLayout from '../ProfileLayout';
import type { ApiResponse } from '@/app/utils/interfaces';

export default function EmailVerificationPage() {
  const [currentEmail, setCurrentEmail] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 获取当前邮箱和status
    apiClient.post<ApiResponse<any>>('/spwapi/auth/profile/retrieve').then((res) => {
      if (res && res.code === 0 && res.data) {
        setCurrentEmail(res.data.email || '');
        setStatus(res.data.status || '');
      }
    });
  }, []);

  // 发送验证码
  const handleSendCode = async () => {
    if (status === '20' && !email) {
      toast.info('Your email is already verified.');
      return;
    }
    if (!email && status !== '00') {
      toast.error('Please enter a new email.');
      return;
    }
    const targetEmail = email || currentEmail;
    if (!targetEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(targetEmail)) {
      toast.error('Please enter a valid email');
      return;
    }
    setSendingCode(true);
    try {
      const res = await apiClient.post<ApiResponse<any>>('/spwapi/auth/email/send', { email: targetEmail });
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

  // 校验验证码
  const handleVerifyCode = async () => {
    if (!code) {
      toast.error('Please enter the verification code');
      return;
    }
    setVerifying(true);
    try {
      const res = await apiClient.post<ApiResponse<any>>('/spwapi/auth/email/check', { email: email || currentEmail, code });
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

  // 保存新邮箱
  const handleSave = async () => {
    if (!emailVerified) {
      toast.error('Please verify your email before saving.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.post<ApiResponse<any>>('/spwapi/auth/profile/update_email', { email });
      if (res && res.code === 0) {
        toast.success('Email updated successfully!');
        setCurrentEmail(email);
        setEmail('');
        setCode('');
        setCodeSent(false);
        setEmailVerified(false);
      } else {
        toast.error(res?.msg || 'Failed to update email');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update email');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileLayout>
      <div className="min-h-[60vh] bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 flex flex-col items-center py-4">
        <ToastContainer position="bottom-right" />
        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-full mt-2">
          <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
            <FaEnvelope className="mr-2 text-blue-500" />
            Email Verification
          </h2>
          <div className="text-gray-500 mb-4 text-sm">Change and verify your registration email address.</div>
          <div className="mb-2 text-sm font-semibold text-gray-700">Current Email</div>
          <div className="mb-4 px-3 py-2 bg-slate-100 rounded text-gray-700 break-all">{currentEmail || '—'}</div>
          <div className="mb-2 text-sm font-semibold text-gray-700">New Email</div>
          <div className="grid grid-cols-[1fr_110px] gap-2 items-center mb-2">
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailVerified(false); setCodeSent(false); }}
              ref={emailInputRef}
              className="w-full px-3 py-2 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-300 h-12"
              placeholder={currentEmail ? `e.g. ${currentEmail}` : 'Enter new email'}
              disabled={saving}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendingCode || (status === '20' && !email)}
              className={
                'w-full h-12 px-3 py-2 rounded-lg font-semibold transition-colors ' +
                (sendingCode || (status === '20' && !email)
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600')
              }
            >
              {sendingCode ? 'Sending...' : 'Send Code'}
            </button>
          </div>
          {!emailVerified && codeSent && (
            <div className="grid grid-cols-[1fr_110px] gap-2 items-center mb-2">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Enter verification code"
                className="w-full px-3 py-2 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-300 h-12"
                disabled={verifying}
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verifying}
                className={
                  'w-full h-12 px-3 py-2 rounded-lg font-semibold transition-colors ' +
                  (verifying
                    ? 'bg-green-300 text-white cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600')
                }
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
} 