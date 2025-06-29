"use client";
import { JitsiMeeting } from '@jitsi/react-sdk';
import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';
import { FaBook, FaChalkboardTeacher, FaUserGraduate, FaClock, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaHandPaper, FaComments } from 'react-icons/fa';

export default function ClassroomPage() {
  const params = useParams();
  const btid = params?.id;
  const apiRef = useRef();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logItems, updateLog] = useState([]);
  const [knockingParticipants, updateKnockingParticipants] = useState([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // 获取课程信息
  useEffect(() => {
    if (!btid) return;
    setLoading(true);
    apiClient.get('/spwapi/tpa/auth/course/meeting/fetch', { btid: btid })
      .then((res: any) => {
        if (res && res.code === 0) {
          setClassInfo(res.data);
        }
      })
      .catch(error => {
        console.error('Error fetching class info:', error);
        toast.error('Failed to load class information');
      })
      .finally(() => setLoading(false));
  }, [btid]);

  // 生成房间名
  const getRoomName = () => {
    // const raw = classInfo?.meeting_uri?.split('/').pop() || `classroom-${btid}-${Date.now()}`;
    // // 1. 替换下划线
    // // 2. 移除非法字符
    // var rawNameBuild = raw.replace(/_/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
    // console.log("房间名：", rawNameBuild)
    // return rawNameBuild;
    return classInfo?.meeting_uri;
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

  const handleKnockingParticipant = (payload: any) => {
    updateLog((items: any[]) => [...items, `Knocking participant: ${payload?.participant?.name}`]);
    updateKnockingParticipants((participants: any[]) => [...participants, payload?.participant]);
  };

  const resolveKnockingParticipants = (condition: any) => {
    knockingParticipants.forEach((participant: any) => {
      apiRef.current?.executeCommand('answerKnockingParticipant', participant?.id, condition(participant));
      updateKnockingParticipants((participants: any[]) => 
        participants.filter((item: any) => item.id !== participant.id)
      );
    });
  };

  const handleApiReady = (apiObj: any) => {
    apiRef.current = apiObj;
    apiRef.current.on('knockingParticipant', handleKnockingParticipant);
    apiRef.current.on('audioMuteStatusChanged', handleAudioStatusChange);
    apiRef.current.on('videoMuteStatusChanged', handleVideoStatusChange);
    apiRef.current.on('raiseHandUpdated', handleHandRaiseChange);
    apiRef.current.on('titleViewChanged', printEventOutput);
    apiRef.current.on('chatUpdated', printEventOutput);
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
        onClick={() => apiRef.current?.executeCommand('toggleAudio')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          isAudioMuted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}
      >
        {isAudioMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        {isAudioMuted ? 'Unmute' : 'Mute'}
      </button>
      
      <button
        onClick={() => apiRef.current?.executeCommand('toggleVideo')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          isVideoMuted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}
      >
        {isVideoMuted ? <FaVideoSlash /> : <FaVideo />}
        {isVideoMuted ? 'Start Video' : 'Stop Video'}
      </button>
      
      <button
        onClick={() => apiRef.current?.executeCommand('toggleRaiseHand')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          isHandRaised ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <FaHandPaper />
        {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
      </button>
      
      <button
        onClick={() => apiRef.current?.executeCommand('toggleChat')}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
      >
        <FaComments />
        Chat
      </button>
      
      {knockingParticipants.length > 0 && (
        <button
          onClick={() => resolveKnockingParticipants(() => true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition"
        >
          Approve All ({knockingParticipants.length})
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading classroom...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* 左侧信息面板 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Classroom</h1>
          
          {classInfo && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-100 rounded-lg">
                <div className="flex items-center text-gray-700 mb-2">
                  <FaBook className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="font-semibold text-sm">Course</span>
                </div>
                <p className="text-sm text-gray-900 ml-6">{classInfo.course_name}</p>
              </div>
              
              <div className="p-3 bg-slate-100 rounded-lg">
                <div className="flex items-center text-gray-700 mb-2">
                  <FaChalkboardTeacher className="w-4 h-4 mr-2 text-green-500" />
                  <span className="font-semibold text-sm">Teacher</span>
                </div>
                <p className="text-sm text-gray-900 ml-6">{classInfo.teacher_name}</p>
              </div>
              
              <div className="p-3 bg-slate-100 rounded-lg">
                <div className="flex items-center text-gray-700 mb-2">
                  <FaUserGraduate className="w-4 h-4 mr-2 text-purple-500" />
                  <span className="font-semibold text-sm">Student</span>
                </div>
                <p className="text-sm text-gray-900 ml-6">{classInfo.student_name || 'Student'}</p>
              </div>
              
              <div className="p-3 bg-slate-100 rounded-lg">
                <div className="flex items-center text-gray-700 mb-2">
                  <FaClock className="w-4 h-4 mr-2 text-orange-500" />
                  <span className="font-semibold text-sm">Time</span>
                </div>
                <p className="text-sm text-gray-900 ml-6">
                  {classInfo.lesson_date} {classInfo.start_time} - {classInfo.end_time}
                </p>
              </div>
            </div>
          )}
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
          jwt="eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtYTcyZTg4ZTQ2NmRkNDQ5Yzg5MWZiMzdlYTgzYTA5ZWQvY2Q3NzkwLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NTExODc5NzYsImV4cCI6MTc1MTE5NTE3NiwibmJmIjoxNzUxMTg3OTcxLCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtYTcyZTg4ZTQ2NmRkNDQ5Yzg5MWZiMzdlYTgzYTA5ZWQiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsIm91dGJvdW5kLWNhbGwiOnRydWUsInNpcC1vdXRib3VuZC1jYWxsIjpmYWxzZSwidHJhbnNjcmlwdGlvbiI6dHJ1ZSwicmVjb3JkaW5nIjp0cnVlLCJmbGlwIjpmYWxzZX0sInVzZXIiOnsiaGlkZGVuLWZyb20tcmVjb3JkZXIiOmZhbHNlLCJtb2RlcmF0b3IiOnRydWUsIm5hbWUiOiJjYXRpZ2EwMyIsImlkIjoiZ29vZ2xlLW9hdXRoMnwxMDMzMDI5NDY0NTEwNDczMTc2NjgiLCJhdmF0YXIiOiIiLCJlbWFpbCI6ImNhdGlnYTAzQGdtYWlsLmNvbSJ9fSwicm9vbSI6IioifQ.Q_dUy9J-gyBR89BKMUE9p0T0r9bgv6lzC4BQdUuRMBaSnGGATGLnLaZSaCAeQgvGSOy3YEtTb4JuZAqpWmhoAVQIylLEBRbi2u0i0qhlzkZlgMUSnu0p5Et00SQBePyFpn6DJneLHp86Jban6XXBga6MrbobR9MIFEBTQhqNsdJViVJAzV2J8cfhLmhZnRQ2ziVwbUnP_WAPeHfErYbr878B12T2IySrghkoLsbtVwgCp0ehz6DBPdpS1qdokWOpmQ7OWuyBliT6jlKobLzCvww9U3FyFvNF6ZvdKeaquvl5V7xwgyqqfYfavkP5ZnjXSrMVEm4CSze-idi8Ibfdjw"
          userInfo={{ displayName: classInfo?.teacher_name || 'Teacher' }}
          spinner={renderSpinner}
          configOverwrite={{
            subject: classInfo?.course_name || 'English Bridge Class',
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