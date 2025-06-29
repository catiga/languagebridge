'use client';

import { JitsiMeeting } from '@jitsi/react-sdk';
import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';
import { FaBook, FaChalkboardTeacher, FaUserGraduate, FaClock, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaHandPaper, FaComments } from 'react-icons/fa';
import { format } from 'date-fns';

// Updated interface to match your new API response
interface LessonDetails {
  meeting_uri: string;
  book_id: number;
  course_name: string;
  course_detail: string;
  teacher_name: string;
  teacher_detail: string;
  student_name?: string; 
  lesson_date: string;
  start_time: string;
  end_time: string;
}

export default function MeetPage() {
  const params = useParams();
  const { id } = params;
  const apiRef = useRef<any>(null);
  const [details, setDetails] = useState<LessonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logItems, updateLog] = useState<any[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No lesson ID provided.");
      setLoading(false);
      return;
    }

    const fetchMeetingInfo = async () => {
      try {
        const res = await apiClient.get('/spwapi/auth/course/meeting/fetch', { btid: id }) as any;
        if (res && res.code === 0 && res.data) {
          setDetails(res.data);
        } else {
          throw new Error(res?.msg || "Failed to get lesson details.");
        }
      } catch (e: any) {
        setError(e?.message || "An error occurred while preparing the classroom.");
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingInfo();
  }, [id]);

  // 生成房间名
  const getRoomName = () => {
    if (details?.meeting_uri) {
      const arr = details.meeting_uri.split('/');
      return arr[arr.length - 1];
    }
    return `meeting-${id}-${Date.now()}`;
  };

  // 事件处理函数
  const printEventOutput = (payload: any) => {
    updateLog((items: any[]) => [...items, JSON.stringify(payload)]);
  };

  const handleAudioStatusChange = (payload: any) => {
    setIsAudioMuted(payload.muted);
    if (payload.muted) {
      updateLog((items: any[]) => [...items, 'Audio muted']);
    } else {
      updateLog((items: any[]) => [...items, 'Audio unmuted']);
    }
  };

  const handleVideoStatusChange = (payload: any) => {
    setIsVideoMuted(payload.muted);
    if (payload.muted) {
      updateLog((items: any[]) => [...items, 'Video muted']);
    } else {
      updateLog((items: any[]) => [...items, 'Video unmuted']);
    }
  };

  const handleHandRaiseChange = (payload: any) => {
    setIsHandRaised(payload.raised);
    updateLog((items: any[]) => [...items, `Hand ${payload.raised ? 'raised' : 'lowered'}`]);
  };

  const handleApiReady = (apiObj: any) => {
    apiRef.current = apiObj;
    if (apiRef.current) {
      apiRef.current.on('audioMuteStatusChanged', handleAudioStatusChange);
      apiRef.current.on('videoMuteStatusChanged', handleVideoStatusChange);
      apiRef.current.on('raiseHandUpdated', handleHandRaiseChange);
      apiRef.current.on('titleViewChanged', printEventOutput);
      apiRef.current.on('chatUpdated', printEventOutput);
    }
    updateLog((items: any[]) => [...items, 'Jitsi API ready']);
  };

  const handleReadyToClose = () => {
    toast.info('Meeting ended');
    // 可以在这里添加离开会议的逻辑
  };

  const handleIFrameRef = (iframeRef: any) => {
    if (iframeRef) {
      iframeRef.style.border = 'none';
      iframeRef.style.borderRadius = '8px';
      iframeRef.style.height = '100%';
    }
  };

  const renderSpinner = () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Joining meeting...</span>
    </div>
  );

  const renderControlButtons = () => (
    <div className="flex gap-2 p-4 bg-white border-b">
      <button
        onClick={() => apiRef.current?.executeCommand?.('toggleAudio')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          isAudioMuted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}
      >
        {isAudioMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        {isAudioMuted ? 'Unmute' : 'Mute'}
      </button>
      
      <button
        onClick={() => apiRef.current?.executeCommand?.('toggleVideo')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          isVideoMuted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}
      >
        {isVideoMuted ? <FaVideoSlash /> : <FaVideo />}
        {isVideoMuted ? 'Start Video' : 'Stop Video'}
      </button>
      
      <button
        onClick={() => apiRef.current?.executeCommand?.('toggleRaiseHand')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          isHandRaised ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <FaHandPaper />
        {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
      </button>
      
      <button
        onClick={() => apiRef.current?.executeCommand?.('toggleChat')}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
      >
        <FaComments />
        Chat
      </button>
    </div>
  );

  // This function now combines the date and time strings before formatting.
  const formatTime = (date: string, time: string) => {
    try {
      const dateTimeString = `${date}T${time}`;
      return format(new Date(dateTimeString), 'h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  const lessonDuration = details?.lesson_date && details?.start_time && details?.end_time 
    ? `${formatTime(details.lesson_date, details.start_time)} - ${formatTime(details.lesson_date, details.end_time)}`
    : 'Time not specified';
  
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
      {/* 左侧信息面板 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Classroom</h1>
          
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
              <p className="text-sm text-gray-900 ml-6">{lessonDuration}</p>
            </div>
          </div>
        </div>
        
        {/* 控制按钮 */}
        {renderControlButtons()}
        
        {/* 日志区域 */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-700 mb-2">Activity Log</h3>
          <div className="space-y-1 text-xs text-gray-600">
            {logItems.map((item, index) => (
              <div key={index} className="font-mono p-1 bg-gray-50 rounded">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 右侧会议区域 */}
      <div className="flex-1 bg-gray-800">
        <JitsiMeeting
          domain="8x8.vc"
          roomName={`vpaas-magic-cookie-a72e88e466dd449c891fb37ea83a09ed/${getRoomName()}`}
          userInfo={{ displayName: details?.student_name || 'Student' }}
          spinner={renderSpinner}
          configOverwrite={{
            subject: details?.course_name || 'English Bridge Class',
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
            APP_NAME: 'English Bridge',
            NATIVE_APP_NAME: 'English Bridge',
            PROVIDER_NAME: 'English Bridge',
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