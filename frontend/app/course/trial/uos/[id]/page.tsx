'use client';

import { JitsiMeeting } from '@jitsi/react-sdk';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/app/utils/api';
import { toast } from 'react-toastify';
import { FaBook, FaChalkboardTeacher, FaUserGraduate, FaClock, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaHandPaper, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { format } from 'date-fns';

interface TrialMeetingDetails {
  meeting_uri: string;
  trial_id: number;
  course_name: string;
  teacher_name: string;
  student_name?: string;
  apply_time: string;
  c_r: string;
}

export default function TrialMeetingPage() {
  const params = useParams();
  const { id } = params;
  const apiRef = useRef<any>(null);
  const [details, setDetails] = useState<TrialMeetingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 专注模式
  const [focusActive, setFocusActive] = useState(false);
  const [focusPrompt, setFocusPrompt] = useState(true);
  const [showExitPwd, setShowExitPwd] = useState(false);
  const [exitPwd, setExitPwd] = useState('');
  const [exitPwdError, setExitPwdError] = useState('');
  const EXIT_PASSWORD = 'letmein123';
  const escLock = useRef(false);

  useEffect(() => {
    if (!id) {
      setError('No trial lesson ID provided.');
      setLoading(false);
      return;
    }
    const fetchMeetingInfo = async () => {
      try {
        const res = await apiClient.get('/spwapi/auth/trial/lesson/meeting', { trial_id: id }) as any;
        if (res && res.code === 0 && res.data) {
          setDetails(res.data);
        } else {
          throw new Error(res?.msg || 'Failed to get meeting details.');
        }
      } catch (e: any) {
        setError(e?.message || 'An error occurred while preparing the meeting.');
      } finally {
        setLoading(false);
      }
    };
    fetchMeetingInfo();
  }, [id]);

  // 事件处理
  const handleAudioStatusChange = (payload: any) => setIsAudioMuted(payload.muted);
  const handleVideoStatusChange = (payload: any) => setIsVideoMuted(payload.muted);
  const handleHandRaiseChange = (payload: any) => setIsHandRaised(payload.raised);
  const handleApiReady = (apiObj: any) => {
    apiRef.current = apiObj;
    if (apiRef.current) {
      apiRef.current.on('audioMuteStatusChanged', handleAudioStatusChange);
      apiRef.current.on('videoMuteStatusChanged', handleVideoStatusChange);
      apiRef.current.on('raiseHandUpdated', handleHandRaiseChange);
    }
    toast.info('Meeting started!');
  };
  const handleReadyToClose = () => toast.info('Meeting ended');
  const handleIFrameRef = (iframeRef: any) => {
    if (iframeRef) {
      iframeRef.style.border = 'none';
      iframeRef.style.borderRadius = '8px';
      iframeRef.style.height = '100%';
    }
  };

  // 全屏与专注模式
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  const handleEnterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
    setFocusActive(true);
  };

  // 拦截ESC和全屏退出
  useEffect(() => {
    if (!focusActive || showExitPwd) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !escLock.current) {
        escLock.current = true;
        setShowExitPwd(true);
        setExitPwd('');
        setExitPwdError('');
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      escLock.current = false;
    };
  }, [focusActive, showExitPwd]);

  // 拦截全屏变动
  useEffect(() => {
    if (!focusActive) return;
    let restoring = false;
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && focusActive && !showExitPwd && !restoring) {
        restoring = true;
        setShowExitPwd(true);
        setExitPwd('');
        setExitPwdError('');
        setTimeout(() => {
          if (!showExitPwd) {
            const el = document.documentElement;
            if (el.requestFullscreen) el.requestFullscreen();
            else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
            else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
          }
          restoring = false;
        }, 400);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      restoring = false;
    };
  }, [focusActive, showExitPwd]);

  // 侧边栏控制按钮
  const renderControlButtons = () => (
    <div className="flex gap-2 p-4 bg-white border-b">
      <button
        onClick={() => apiRef.current?.executeCommand?.('toggleAudio')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isAudioMuted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
      >
        {isAudioMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        {isAudioMuted ? 'Unmute' : 'Mute'}
      </button>
      <button
        onClick={() => apiRef.current?.executeCommand?.('toggleVideo')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isVideoMuted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
      >
        {isVideoMuted ? <FaVideoSlash /> : <FaVideo />}
        {isVideoMuted ? 'Start Video' : 'Stop Video'}
      </button>
      <button
        onClick={() => apiRef.current?.executeCommand?.('toggleRaiseHand')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isHandRaised ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}
      >
        <FaHandPaper />
        {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading Classroom...</div>
      </div>
    );
  }
  if (error || !details) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl font-semibold text-red-500">{error || "Could not load classroom."}</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* 全屏按钮，未全屏时显示 */}
      {!isFullscreen && (
        <button
          className="fixed top-6 right-6 z-50 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200"
          onClick={handleEnterFullscreen}
        >Enter Fullscreen</button>
      )}
      {/* 极致专注遮罩，防止鼠标右键/选中/拖拽 */}
      {focusActive && !focusPrompt && !showExitPwd && (
        <div className="fixed inset-0 z-40 pointer-events-none select-none" style={{background: 'transparent'}}></div>
      )}
      {/* 退出专注模式密码弹窗 */}
      {showExitPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative" onSubmit={e => {e.preventDefault(); setShowExitPwd(false); escLock.current = false;}}>
            <div className="text-2xl font-bold mb-4 text-blue-700">Exit Focus Mode</div>
            <div className="text-gray-700 mb-6">Please enter the exit password to leave focus mode.</div>
            <input
              type="password"
              className="w-full px-4 py-3 border rounded-lg mb-3 text-lg"
              placeholder="Enter password"
              value={exitPwd}
              onChange={e => setExitPwd(e.target.value)}
              autoFocus
            />
            {exitPwdError && <div className="text-red-500 mb-3">{exitPwdError}</div>}
            <div className="flex gap-4 justify-center mt-4">
              <button type="submit" className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-full font-bold text-lg shadow hover:from-blue-600 hover:to-blue-500 transition">Confirm</button>
              <button type="button" className="px-8 py-3 bg-gray-200 text-gray-700 rounded-full font-bold text-lg shadow hover:bg-gray-300 transition" onClick={() => { setShowExitPwd(false); escLock.current = false; }}>Cancel</button>
            </div>
            <button type="button" aria-label="Close" className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => { setShowExitPwd(false); escLock.current = false; }}>&times;</button>
          </form>
        </div>
      )}
      {/* 左侧信息面板，可展开/收起 */}
      <div className={`transition-all duration-300 bg-white border-r border-gray-200 flex flex-col ${sidebarOpen ? 'w-80' : 'w-10'} relative`} style={{minWidth: sidebarOpen ? '20rem' : '2.5rem'}}>
        {/* 展开/收起按钮 */}
        <button
          className={`absolute top-4 -right-4 z-20 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition ${sidebarOpen ? '' : ''}`}
          style={{right: sidebarOpen ? '-1.5rem' : '-1.5rem'}}
          onClick={() => setSidebarOpen(v => !v)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
        </button>
        {!sidebarOpen && (
          <div className="flex-1 flex flex-col items-center justify-center"></div>
        )}
        {sidebarOpen && (
          <>
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-800 mb-4">Trial Classroom</h1>
              <div className="space-y-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <div className="flex items-center text-gray-700 mb-2">
                    <FaBook className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="font-semibold text-sm">Course</span>
                  </div>
                  <p className="text-sm text-gray-900 ml-6">{details.course_name}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <div className="flex items-center text-gray-700 mb-2">
                    <FaChalkboardTeacher className="w-4 h-4 mr-2 text-green-500" />
                    <span className="font-semibold text-sm">Teacher</span>
                  </div>
                  <p className="text-sm text-gray-900 ml-6">{details.teacher_name}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <div className="flex items-center text-gray-700 mb-2">
                    <FaUserGraduate className="w-4 h-4 mr-2 text-purple-500" />
                    <span className="font-semibold text-sm">Student</span>
                  </div>
                  <p className="text-sm text-gray-900 ml-6">{details.student_name || 'Student'}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <div className="flex items-center text-gray-700 mb-2">
                    <FaClock className="w-4 h-4 mr-2 text-orange-500" />
                    <span className="font-semibold text-sm">Time</span>
                  </div>
                  <p className="text-sm text-gray-900 ml-6">{details.apply_time}</p>
                </div>
              </div>
            </div>
            {renderControlButtons()}
          </>
        )}
      </div>
      {/* 右侧会议区域 */}
      <div className="flex-1 bg-gray-800">
        <JitsiMeeting
          domain="8x8.vc"
          roomName={`vpaas-magic-cookie-a72e88e466dd449c891fb37ea83a09ed/details.meeting_uri}`}
          userInfo={{ displayName: details?.student_name || 'Student', email: '' }}
          configOverwrite={{
            subject: details?.course_name || 'Trial Lesson',
            hideConferenceSubject: false,
            disableLobby: true,
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableModeratorIndicator: false,
            enableClosePage: true,
            enableWelcomePage: false,
            enableLobbyChat: false,
            enableKnockingParticipant: false,
            enableNoAudioDetection: true,
            enableNoisyMicDetection: true,
            enableRemb: true,
            enableTcc: true,
            openBridgeChannel: 'websocket',
            clientHeight: '100%',
            clientWidth: '100%',
            constraints: {
              video: {
                height: {
                  ideal: 720,
                  max: 720,
                  min: 180
                },
                width: {
                  ideal: 1280,
                  max: 1280,
                  min: 320
                }
              }
            }
          }}
          interfaceConfigOverwrite={{
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_POWERED_BY: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            MOBILE_APP_PROMO: false,
            GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
            APP_NAME: 'LangBridge Trial',
            NATIVE_APP_NAME: 'LangBridge Trial',
            PROVIDER_NAME: 'LangBridge',
            LANG_DETECTION: true,
            AUTHENTICATION_ENABLE: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            TOOLBAR_TIMEOUT: 4000,
            TOOLBAR_TIMEOUT_AUTO_HIDE: 2000,
            TOOLBAR_BUTTONS_ALWAYS_VISIBLE: true,
            SHOW_LOGIN_BUTTON: false,
            TOOLBAR_BUTTONS_ALWAYS_VISIBLE_HIDE: [
              'livestreaming',
              'recording',
              'etherpad',
              'sharedvideo',
              'download',
              'help',
              'mute-everyone',
              'security'
            ]
          }}
          lang="en"
          onApiReady={handleApiReady}
          onReadyToClose={handleReadyToClose}
          getIFrameRef={handleIFrameRef}
        />
      </div>
    </div>
  );
} 