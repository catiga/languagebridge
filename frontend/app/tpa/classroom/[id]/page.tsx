"use client";
import { JitsiMeeting } from '@jitsi/react-sdk';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';
import { FaBook, FaChalkboardTeacher, FaUserGraduate, FaClock, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaHandPaper, FaComments } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function ClassroomPage() {
  const params = useParams();
  const btid = params?.id;
  const apiRef = useRef<any>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [logItems, updateLog] = useState<any[]>([]);
  const [knockingParticipants, updateKnockingParticipants] = useState<any[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const router = useRouter();

  // 课程笔记相关（对接老师端接口）
  interface NoteItem { id: string; content: string; createdAt: string; }
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteError, setNoteError] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [addNoteLoading, setAddNoteLoading] = useState(false);

  // 拉取课程笔记列表
  const fetchNotes = useCallback(async () => {
    if (!btid) return;
    setNotesLoading(true);
    try {
      const res = await apiClient.get('/spwapi/tpa/auth/course/meeting/note/fetch', { btid }) as any;
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
  }, [btid]);

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
      const res = await apiClient.post('/spwapi/tpa/auth/course/meeting/note/add', { note: content, btid: Number(btid) }) as any;
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

  const handleNoteInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

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

  const getJwtToken = () => {
    return classInfo?.token
  }

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
    updateLog((items: any[]) => [...items, 'Meeting is ready']);
  };

  const handleReadyToClose = () => {
    toast.info('Meeting ended');
    router.push('/tpa/dashboard');
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
              onKeyDown={handleNoteInputKeyDown}
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
      </div>
      
      {/* 右侧会议区域 */}
      <div className="flex-1 bg-gray-800">
        <JitsiMeeting
          domain="8x8.vc"
          roomName={`vpaas-magic-cookie-a72e88e466dd449c891fb37ea83a09ed/${getRoomName()}`}
          jwt={getJwtToken()}
          userInfo={{ displayName: classInfo?.teacher_name || 'Teacher', email: '' }}
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