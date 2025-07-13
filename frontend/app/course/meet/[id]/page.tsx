'use client';

import { JitsiMeeting } from '@jitsi/react-sdk';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';
import { FaBook, FaChalkboardTeacher, FaUserGraduate, FaClock, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaHandPaper, FaComments, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

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
  // 专注模式相关
  const [focusPrompt, setFocusPrompt] = useState(true);
  const [focusActive, setFocusActive] = useState(false);
  // 退出专注模式密码
  const [showExitPwd, setShowExitPwd] = useState(false);
  const [exitPwd, setExitPwd] = useState('');
  const [exitPwdError, setExitPwdError] = useState('');
  const EXIT_PASSWORD = 'letmein123'; // 可自定义
  // ESC锁，防止多次弹出密码框
  const escLock = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

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

  const handleReadyToClose = async () => {
    try {
      // 通知后端用户已结束会议
      await apiClient.get('/spwapi/auth/course/meeting/end', { btid: id });
    } catch (e) {
      toast.error('Notify ending failed');
    }
    toast.info('Meeting ended');
    // 可以在这里添加离开会议的逻辑，比如跳转页面
    router.push('/profile/overview');
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

  // 控制按钮（去掉Chat按钮）
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
  
  // 进入全屏
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
    setFocusPrompt(false);
    setFocusActive(true);
  }, []);

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

  // 极致专注模式：隐藏页面导航栏、禁止滚动、禁止右键/选中/拖拽
  useEffect(() => {
    if (focusActive) {
      // 隐藏页面导航栏（假设有id或class为navbar/header等）
      const nav = document.querySelector('.navbar, header, .main-navbar, .site-header');
      if (nav) (nav as HTMLElement).style.display = 'none';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'auto';
      const prevent = (e: Event) => e.preventDefault();
      window.addEventListener('contextmenu', prevent, true);
      window.addEventListener('selectstart', prevent, true);
      window.addEventListener('dragstart', prevent, true);
      return () => {
        if (nav) (nav as HTMLElement).style.display = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.userSelect = '';
        window.removeEventListener('contextmenu', prevent, true);
        window.removeEventListener('selectstart', prevent, true);
        window.removeEventListener('dragstart', prevent, true);
      };
    }
  }, [focusActive]);

  // 密码校验逻辑
  const handleExitPwdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/spwapi/auth/security/check', { passcode: exitPwd }) as { code: number; msg?: string };
      if (res && res.code === 0) {
        setShowExitPwd(false);
        setFocusActive(false);
        setExitPwd('');
        setExitPwdError('');
        // 只退出全屏和专注，不做登出
        if (document.exitFullscreen) document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
        else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();
      } else {
        setExitPwdError('Password verification failed.');
      }
    } catch (err: any) {
      setExitPwdError('Password verification failed.');
    }
  };

  // 全屏按钮逻辑
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const handleEnterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
    setFocusActive(true);
  };

  // 课程笔记相关（对接后端）
  interface NoteItem { id: string; content: string; createdAt: string; }
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteError, setNoteError] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [addNoteLoading, setAddNoteLoading] = useState(false);

  // 拉取课程笔记列表
  const fetchNotes = useCallback(async () => {
    if (!id) return;
    setNotesLoading(true);
    try {
      const res = await apiClient.get('/spwapi/auth/course/meeting/note/fetch', { btid: id }) as any;
      if (res && res.code === 0 && Array.isArray(res.data)) {
        setNotes(res.data.map((n: any) => ({
          id: String(n.id),
          content: n.note,
          createdAt: n.created_at ? n.created_at.slice(11, 16) : '' // 取HH:mm
        })));
      } else {
        setNotes([]);
      }
    } catch {
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // 添加笔记
  const handleAddNote = async () => {
    const content = noteInput.trim();
    if (!content) {
      setNoteError('Note cannot be empty');
      return;
    }
    if (content.length > 100) {
      setNoteError('Note must be within 100 characters');
      return;
    }
    setAddNoteLoading(true);
    try {
      const res = await apiClient.post('/spwapi/auth/course/meeting/note/add', { note: content, btid: Number(id) }) as any;
      if (res && res.code === 0) {
        setNoteInput('');
        setNoteError('');
        fetchNotes();
      } else {
        setNoteError(res?.msg || 'Failed to add note');
      }
    } catch (e: any) {
      setNoteError(e?.message || 'Failed to add note');
    } finally {
      setAddNoteLoading(false);
    }
  };

  const handleNoteInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNote();
    }
  };

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
          <form className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative" onSubmit={handleExitPwdSubmit}>
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
        {/* 只显示展开按钮时 */}
        {!sidebarOpen && (
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* 可加logo或icon */}
          </div>
        )}
        {/* 展开时显示详细内容 */}
        {sidebarOpen && (
          <>
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
            {/* 课程笔记区域 */}
            <div className="p-4 border-t border-gray-100 flex-1 flex flex-col">
              <h3 className="font-semibold text-gray-700 mb-2">Course Notes</h3>
              <div className="flex gap-2 mb-2">
                <textarea
                  className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 resize-none min-h-[40px] max-h-[120px]"
                  placeholder="Add a note (max 100 chars)"
                  value={noteInput}
                  onChange={e => {
                    setNoteInput(e.target.value);
                    setNoteError('');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  maxLength={100}
                  disabled={addNoteLoading}
                  rows={2}
                />
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition self-end mb-1"
                  onClick={handleAddNote}
                  disabled={noteInput.trim().length === 0 || noteInput.length > 100 || addNoteLoading}
                  style={{minWidth: '64px'}}
                >{addNoteLoading ? 'Adding...' : 'Add'}</button>
              </div>
              {noteError && <div className="text-xs text-red-500 mb-2">{noteError}</div>}
              <div className="flex-1 overflow-y-auto max-h-60 min-h-[60px] pr-1">
                {notesLoading ? (
                  <div className="text-gray-400 text-sm text-center mt-6">Loading notes...</div>
                ) : notes.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center mt-6">Add your first note for this lesson!</div>
                ) : (
                  <ul className="space-y-2">
                    {notes.map(note => (
                      <li key={note.id} className="bg-blue-50 rounded-lg px-3 py-2 flex items-start gap-2">
                        <span className="text-xs text-gray-400 w-12 pt-1">[{note.createdAt}]</span>
                        <span className="text-gray-800 text-sm break-words flex-1 whitespace-pre-line">{note.content}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {/* 右侧会议区域 */}
      <div className="flex-1 bg-gray-800">
        <JitsiMeeting
          domain="8x8.vc"
          roomName={`vpaas-magic-cookie-a72e88e466dd449c891fb37ea83a09ed/${getRoomName()}`}
          userInfo={{ displayName: details?.student_name || 'Student', email: '' }}
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