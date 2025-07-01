"use client";
import React, { useState, useEffect } from "react";
import { apiClient } from "@/app/utils/api";
import { toast } from "react-toastify";

export default function TeacherEmailVerifyBanner({ email, emailVerified, onRefresh }: { email: string, emailVerified: boolean, onRefresh: () => void }) {
  const [sending, setSending] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cache = localStorage.getItem('teacherEmailVerify');
      if (cache) {
        try {
          const obj = JSON.parse(cache);
          if (obj && obj.email === email && !emailVerified) {
            setShowVerify(true);
          } else {
            setShowVerify(false);
            localStorage.removeItem('teacherEmailVerify');
          }
        } catch {
          setShowVerify(false);
        }
      } else {
        setShowVerify(false);
      }
    }
  }, [email, emailVerified]);

  const handleSendVerify = async () => {
    setSending(true);
    try {
      const res = await apiClient.post("/spwapi/tpa/auth/email/send", { email });
      if (res && res.code === 0) {
        toast.success("Verification email sent! Please check your inbox.");
        setShowVerify(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('teacherEmailVerify', JSON.stringify({ email }));
        }
      } else {
        toast.error(res?.msg || "Failed to send verification email.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to send verification email.");
    } finally {
      setSending(false);
    }
  };

  const handleCheckCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter the verification code.");
      return;
    }
    setVerifying(true);
    try {
      const res = await apiClient.post("/spwapi/tpa/auth/email/check", { email, code });
      if (res && res.code === 0) {
        toast.success("Email verified successfully!");
        setShowVerify(false);
        setCode("");
        if (typeof window !== 'undefined') {
          localStorage.removeItem('teacherEmailVerify');
        }
        onRefresh && onRefresh();
      } else {
        toast.error(res?.msg || "Verification failed. Please check the code.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  if (emailVerified) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('teacherEmailVerify');
    }
    return null;
  }

  return (
    <>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 flex items-center justify-between rounded-xl shadow">
        <div>
          <span className="font-bold text-yellow-700">Your email ({email}) is not verified.</span>
          <span className="ml-2 text-yellow-700">Please verify to enable all features.</span>
        </div>
        <button
          className="ml-4 px-4 py-2 bg-yellow-400 text-white font-bold rounded-lg hover:bg-yellow-500 transition disabled:opacity-60"
          onClick={handleSendVerify}
          disabled={sending}
        >
          {sending ? "Sending..." : "Send Verification Email"}
        </button>
      </div>
      {showVerify && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4 w-full max-w-sm mx-auto flex flex-col items-stretch">
          <h2 className="text-lg font-bold mb-2 text-gray-800">Enter Verification Code</h2>
          <p className="mb-3 text-gray-600 text-sm">A verification code has been sent to <span className="font-semibold">{email}</span>. Please enter it below:</p>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Enter code"
            value={code}
            onChange={e => setCode(e.target.value)}
            disabled={verifying}
          />
          <div className="flex gap-2">
            <button
              className="flex-1 px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-60"
              onClick={handleCheckCode}
              disabled={verifying}
            >
              {verifying ? "Verifying..." : "Verify"}
            </button>
            <button
              className="flex-1 px-4 py-2 rounded bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition"
              onClick={() => {
                setShowVerify(false);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('teacherEmailVerify');
                }
              }}
              disabled={verifying}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
} 