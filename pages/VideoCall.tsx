
import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Users, LogOut, ScreenShare, ScreenShareOff, MessageSquare, Send, Paperclip, X, File, Download, Calculator, Link, Check, UserPlus, MoreVertical, Trash2, Mail, Loader2 } from 'lucide-react';
import { Invitation } from '../types';

interface VideoCallProps {
  meetingId: string;
  meetingTitle?: string | null;
  userName?: string;
  onLeave: () => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  text?: string;
  file?: {
    name: string;
    url: string;
    size: string;
    type: string;
  };
  timestamp: string;
  isMe: boolean;
  type?: 'chat' | 'system';
}

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'guest';
  isMuted: boolean;
  isCamOn: boolean;
  isMe: boolean;
}

export const VideoCall: React.FC<VideoCallProps> = ({ meetingId, meetingTitle, userName = "Moi", onLeave }) => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [linkCopied, setLinkCopied] = useState(false); 
  
  // Panel States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  
  // Floating Windows Positions
  const [calcPos, setCalcPos] = useState({ x: 20, y: 80 });
  const [chatPos, setChatPos] = useState({ x: window.innerWidth - 350, y: 80 });
  const [partPos, setPartPos] = useState({ x: window.innerWidth - 700, y: 80 }); // Participants Window

  // Dragging States
  const [isDraggingCalc, setIsDraggingCalc] = useState(false);
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [isDraggingPart, setIsDraggingPart] = useState(false);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragChatStartRef = useRef({ x: 0, y: 0 });
  const dragPartStartRef = useRef({ x: 0, y: 0 });

  // Participants State
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'me', name: userName === "Moi" ? "Moi (Hôte)" : `${userName} (Moi)`, role: 'host', isMuted: false, isCamOn: true, isMe: true },
    { id: 'p1', name: 'Sarah Connor', role: 'guest', isMuted: false, isCamOn: true, isMe: false }
  ]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [isInviting, setIsInviting] = useState(false); // Loading state for invite
  const [inviteSuccess, setInviteSuccess] = useState(false); // Feedback state

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Sarah Connor', text: 'Bonjour tout le monde !', timestamp: '10:01', isMe: false, type: 'chat' }
  ]);
  const [inputText, setInputText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState("");

  // Media Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Sync Local Mic/Cam with Participants List
  useEffect(() => {
    setParticipants(prev => prev.map(p => p.isMe ? { ...p, isMuted: !micOn, isCamOn: camOn } : p));
  }, [micOn, camOn]);

  // Timer Logic
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Copy Link Logic
  const copyMeetingLink = () => {
    const url = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (isChatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  // Handle Dragging (Global)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingCalc) {
        setCalcPos({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
      }
      if (isDraggingChat) {
        setChatPos({ x: e.clientX - dragChatStartRef.current.x, y: e.clientY - dragChatStartRef.current.y });
      }
      if (isDraggingPart) {
        setPartPos({ x: e.clientX - dragPartStartRef.current.x, y: e.clientY - dragPartStartRef.current.y });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingCalc(false);
      setIsDraggingChat(false);
      setIsDraggingPart(false);
    };

    if (isDraggingCalc || isDraggingChat || isDraggingPart) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingCalc, isDraggingChat, isDraggingPart]);

  const startDragCalc = (e: React.MouseEvent) => {
    setIsDraggingCalc(true);
    dragStartRef.current = { x: e.clientX - calcPos.x, y: e.clientY - calcPos.y };
  };

  const startDragChat = (e: React.MouseEvent) => {
    setIsDraggingChat(true);
    dragChatStartRef.current = { x: e.clientX - chatPos.x, y: e.clientY - chatPos.y };
  };

  const startDragPart = (e: React.MouseEvent) => {
    setIsDraggingPart(true);
    dragPartStartRef.current = { x: e.clientX - partPos.x, y: e.clientY - partPos.y };
  };

  // Initial Camera Setup
  useEffect(() => {
    startCamera();
    return () => {
      stopAllTracks();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current && !isScreenSharing) {
        videoRef.current.srcObject = stream;
      }
      // Apply initial toggle states
      stream.getVideoTracks().forEach(track => track.enabled = camOn);
      stream.getAudioTracks().forEach(track => track.enabled = micOn);
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  };

  const stopAllTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Handle toggle Video (Camera)
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.enabled = camOn);
    }
    
    // If we turn cam ON and we are NOT screen sharing, make sure video element shows camera
    if (camOn && !isScreenSharing && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [camOn, isScreenSharing]);

   // Handle toggle Audio
   useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.enabled = micOn);
    }
  }, [micOn]);

  const toggleMic = () => setMicOn(!micOn);
  
  const toggleCam = () => {
    setCamOn(!camOn);
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        // Add System Message for History
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'Système',
          text: 'Vous avez commencé le partage d\'écran',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: true,
          type: 'system'
        }]);

        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('Permission denied')) {
             return;
        }
        console.error("Error starting screen share:", err);
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      // Add System Message for History
      setMessages(prev => [...prev, {
         id: Date.now().toString(),
         sender: 'Système',
         text: 'Partage d\'écran terminé',
         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
         isMe: true,
         type: 'system'
      }]);
    }
    setIsScreenSharing(false);
    if (camOn && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  };

  // --- PARTICIPANTS LOGIC ---
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      alert("Veuillez entrer une adresse email valide.");
      return;
    }
    
    setIsInviting(true);

    // Simulate Network Request Delay
    setTimeout(() => {
      // 1. Backend Simulation: Send Invite to Storage for other users to pick up
      const storedInvites: Invitation[] = JSON.parse(localStorage.getItem('3dvers_invitations') || '[]');
      const newInvite: Invitation = {
        id: Math.random().toString(36).substr(2, 9),
        meetingId: meetingId,
        meetingTitle: meetingTitle || "Réunion 3Dvers",
        fromName: userName, // Using prop passed from App
        toEmail: inviteEmail,
        timestamp: Date.now()
      };
      localStorage.setItem('3dvers_invitations', JSON.stringify([...storedInvites, newInvite]));

      // 2. Local Visual Update
      const newId = `p-${Date.now()}`;
      const newName = inviteEmail.split('@')[0];
      const newParticipant: Participant = {
        id: newId,
        name: `${newName} (Invité)`,
        role: 'guest',
        isMuted: true,
        isCamOn: false,
        isMe: false
      };

      setParticipants(prev => [...prev, newParticipant]);
      setInviteEmail("");
      setIsInviting(false);
      setInviteSuccess(true);
      
      // Auto-hide success message
      setTimeout(() => {
        setInviteSuccess(false);
        setShowInviteInput(false);
      }, 2000);

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'Système',
        text: `Invitation envoyée à ${inviteEmail}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        type: 'system'
      }]);
    }, 1000);
  };

  const removeParticipant = (id: string, name: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'Système',
      text: `${name} a été exclu de la réunion`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: 'system'
    }]);
  };

  const toggleParticipantMute = (id: string) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, isMuted: !p.isMuted } : p));
  };

  // --- CHAT LOGIC ---
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Moi',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: 'chat'
    };
    setMessages([...messages, newMessage]);
    setInputText("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Moi',
      file: {
        name: file.name,
        url: URL.createObjectURL(file),
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: 'chat'
    };
    setMessages([...messages, newMessage]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- CALCULATOR LOGIC ---
  const handleCalcInput = (value: string) => {
    setCalcDisplay(prev => prev + value);
  };
  const handleCalcClear = () => setCalcDisplay("");
  const handleCalcResult = () => {
    try {
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict";return (' + calcDisplay + ')')();
      setCalcDisplay(String(result));
    } catch (e) {
      setCalcDisplay("Erreur");
      setTimeout(() => setCalcDisplay(""), 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900 flex flex-col z-50">
      {/* Header */}
      <div className="bg-zinc-900/95 backdrop-blur-sm px-4 py-3 flex justify-between items-center text-white border-b border-zinc-800 z-30 h-16 flex-none">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20">3D</div>
            <div>
                <span className="font-bold block leading-none text-sm md:text-base">
                    {meetingTitle || "3Dvers Meeting"}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className="text-xs text-zinc-400 font-mono">ID: {meetingId}</span>
                   <button 
                     onClick={copyMeetingLink}
                     className="p-1 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                     title="Copier le lien de partage"
                   >
                      {linkCopied ? <Check size={12} className="text-green-500" /> : <Link size={12} />}
                   </button>
                   {linkCopied && <span className="text-[10px] text-green-500 animate-in fade-in">Lien copié !</span>}
                </div>
            </div>
         </div>
         <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs md:text-sm text-zinc-300 flex items-center gap-2 border border-zinc-700 font-mono">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            {formatDuration(elapsedTime)}
         </div>
      </div>

      {/* Content Area (Flex Row) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT: Video Grid + Toolbar */}
        <div className="flex-1 flex flex-col relative min-w-0 transition-all duration-300">
           
           {/* Videos Grid */}
           <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
              <div className={`w-full h-full transition-all duration-500 ${isScreenSharing ? 'flex flex-col md:flex-row gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4 content-center'}`}>
                
                {/* Local User / Screen Share View */}
                <div className={`relative bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl transition-all duration-500 ${isScreenSharing ? 'flex-1 order-2 md:order-1 h-[60vh] md:h-auto' : 'w-full h-full max-h-[calc(100vh-200px)]'}`}>
                  {(camOn || isScreenSharing) ? (
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        className={`w-full h-full object-cover transition-transform ${isScreenSharing ? '' : 'transform scale-x-[-1]'}`} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-zinc-700 flex items-center justify-center text-2xl md:text-4xl font-bold text-zinc-500 border-4 border-zinc-600">
                        Moi
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs md:text-sm flex items-center gap-2 font-medium">
                    {isScreenSharing ? "Votre écran" : "Vous"} 
                    {!micOn && <MicOff size={14} className="text-red-400" />}
                  </div>
                </div>

                {/* Remote Participants (Visual Loop) */}
                {participants.filter(p => !p.isMe).map(p => (
                   <div key={p.id} className={`relative bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl group transition-all duration-500 ${isScreenSharing ? 'h-32 md:w-64 md:h-48 order-1 md:order-2 flex-shrink-0' : 'w-full h-full max-h-[calc(100vh-200px)]'}`}>
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="Participant" />
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-xs font-medium">
                      {p.name}
                    </div>
                    {p.isMuted && (
                       <div className="absolute top-4 right-4 bg-red-500/90 p-1.5 rounded-full text-white shadow-lg">
                         <MicOff size={14} />
                       </div>
                    )}
                  </div>
                ))}
              </div>
           </div>

           {/* Toolbar */}
           <div className="bg-zinc-900 border-t border-zinc-800 p-4 md:p-6 z-20 flex-none">
              
              <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
                <button 
                  onClick={toggleMic}
                  className={`p-3 md:p-4 rounded-full transition-all ${micOn ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
                >
                  {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                
                <button 
                  onClick={toggleCam}
                  className={`p-3 md:p-4 rounded-full transition-all ${camOn ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
                >
                  {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                </button>

                <button 
                  onClick={handleScreenShare}
                  className={`p-3 md:p-4 rounded-full transition-all ${isScreenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                  title={isScreenSharing ? "Arrêter le partage" : "Partager l'écran"}
                >
                  {isScreenSharing ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
                </button>

                {/* Calculator Toggle */}
                <button 
                   onClick={() => setIsCalcOpen(!isCalcOpen)}
                   className={`p-3 md:p-4 rounded-full transition-all ${isCalcOpen ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                   title="Calculatrice"
                >
                   <Calculator size={20} />
                </button>

                {/* Chat Toggle */}
                <button 
                   onClick={() => setIsChatOpen(!isChatOpen)}
                   className={`p-3 md:p-4 rounded-full transition-all relative ${isChatOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                   title="Ouvrir le chat"
                >
                   <MessageSquare size={20} />
                   {!isChatOpen && messages.length > 1 && (
                     <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900"></span>
                   )}
                </button>

                <div className="h-8 w-px bg-zinc-700 mx-1 md:mx-2"></div>
                
                <button 
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-3 md:py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-red-600/20" 
                  onClick={onLeave}
                >
                  <LogOut size={20} />
                  <span className="hidden md:inline">Quitter</span>
                </button>
              </div>

              {/* Participants Info Section (Moved Below Toolbar) */}
              <div className="flex justify-center mt-4">
                <div 
                  onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                  className={`flex items-center gap-3 bg-zinc-800/80 backdrop-blur px-4 py-1.5 rounded-full border border-zinc-700/50 shadow-sm transition-colors cursor-pointer group ${isParticipantsOpen ? 'ring-2 ring-indigo-500' : 'hover:bg-zinc-700/80'}`}
                >
                   <div className="relative">
                      <Users size={18} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                      <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full border-2 border-zinc-900">
                        {participants.length}
                      </span>
                   </div>
                   <div className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      Participants
                   </div>
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                </div>
              </div>

           </div>
        </div>

        {/* FLOATING PARTICIPANTS LIST */}
        {isParticipantsOpen && (
          <div 
            style={{ left: partPos.x, top: partPos.y }}
            className="absolute w-80 bg-zinc-800 border border-zinc-700 flex flex-col shadow-2xl rounded-xl z-50 animate-in fade-in zoom-in-95 duration-200"
          >
             <div 
                onMouseDown={startDragPart}
                className="p-3 border-b border-zinc-700 flex justify-between items-center bg-zinc-900/50 rounded-t-xl cursor-move select-none active:bg-zinc-900"
             >
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Users size={16} className="text-indigo-400" />
                  Participants ({participants.length})
                </h3>
                <button onClick={() => setIsParticipantsOpen(false)} className="text-zinc-400 hover:text-white" onMouseDown={(e) => e.stopPropagation()}>
                  <X size={18} />
                </button>
             </div>
             
             <div className="flex-1 p-2 flex flex-col gap-1 bg-zinc-900/80 backdrop-blur-md rounded-b-xl max-h-[400px] overflow-y-auto">
                {/* Invite Section */}
                {!showInviteInput ? (
                  <button 
                    onClick={() => setShowInviteInput(true)}
                    className="flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors w-full text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <UserPlus size={16} />
                    </div>
                    <span className="text-sm font-medium">Inviter quelqu'un</span>
                  </button>
                ) : (
                  <div className="p-2 bg-zinc-800 rounded-lg mb-2">
                    {inviteSuccess ? (
                      <div className="flex items-center gap-2 text-green-500 text-sm py-2 justify-center animate-in fade-in">
                        <Check size={16} /> Invitation envoyée !
                      </div>
                    ) : (
                      <form onSubmit={handleInvite}>
                         <div className="relative">
                            <Mail size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                            <input 
                              autoFocus
                              type="email" 
                              placeholder="email@exemple.com" 
                              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 pl-8 text-sm text-white mb-2 focus:border-indigo-500 outline-none"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                            />
                         </div>
                        <div className="flex gap-2">
                           <button 
                             type="submit" 
                             disabled={isInviting}
                             className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70"
                           >
                             {isInviting && <Loader2 size={12} className="animate-spin" />}
                             {isInviting ? "Envoi..." : "Envoyer"}
                           </button>
                           <button type="button" onClick={() => setShowInviteInput(false)} className="px-3 bg-zinc-700 text-white text-xs py-1.5 rounded hover:bg-zinc-600">
                             Annuler
                           </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
                
                <div className="h-px bg-zinc-700 my-1 mx-2"></div>

                {/* List */}
                {participants.map(p => (
                   <div key={p.id} className="flex items-center justify-between p-2 hover:bg-zinc-800 rounded-lg group">
                      <div className="flex items-center gap-3 overflow-hidden">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.isMe ? 'bg-indigo-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                           {p.name.substring(0,2).toUpperCase()}
                         </div>
                         <div className="flex flex-col truncate">
                            <span className="text-sm text-zinc-200 truncate font-medium">
                              {p.name} {p.isMe && "(Moi)"}
                            </span>
                            <span className="text-[10px] text-zinc-500">{p.role === 'host' ? 'Hôte' : 'Invité'}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-1">
                         <button onClick={() => !p.isMe && toggleParticipantMute(p.id)} className={`p-1.5 rounded hover:bg-zinc-700 ${p.isMuted ? 'text-red-500' : 'text-zinc-400'}`}>
                            {p.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                         </button>
                         <div className={`p-1.5 rounded ${p.isCamOn ? 'text-zinc-400' : 'text-red-500'}`}>
                            {p.isCamOn ? <Video size={14} /> : <VideoOff size={14} />}
                         </div>
                         {!p.isMe && (
                           <button onClick={() => removeParticipant(p.id, p.name)} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-opacity" title="Exclure">
                             <Trash2 size={14} />
                           </button>
                         )}
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* FLOATING CALCULATOR */}
        {isCalcOpen && (
          <div 
            style={{ left: calcPos.x, top: calcPos.y }}
            className="absolute w-80 bg-zinc-800 border border-zinc-700 flex flex-col shadow-2xl rounded-xl z-50 animate-in fade-in zoom-in-95 duration-200"
          >
             <div 
                onMouseDown={startDragCalc}
                className="p-3 border-b border-zinc-700 flex justify-between items-center bg-zinc-900/50 rounded-t-xl cursor-move select-none active:bg-zinc-900"
             >
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Calculator size={16} className="text-orange-400" />
                  Calculatrice
                </h3>
                <button onClick={() => setIsCalcOpen(false)} className="text-zinc-400 hover:text-white" onMouseDown={(e) => e.stopPropagation()}>
                  <X size={18} />
                </button>
             </div>
             
             <div className="flex-1 p-4 flex flex-col gap-3 bg-zinc-900/80 backdrop-blur-md rounded-b-xl">
                {/* Screen */}
                <div className="bg-zinc-950 p-3 rounded-lg text-right text-3xl font-mono text-white shadow-inner border border-zinc-800 min-h-[70px] break-all flex items-end justify-end">
                   {calcDisplay || "0"}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-4 gap-2.5">
                   {['C', '(', ')', '/'].map(k => (
                     <button key={k} onClick={() => k === 'C' ? handleCalcClear() : handleCalcInput(k)} className={`rounded-lg font-bold text-lg shadow-sm h-10 transition-all active:scale-95 ${k === 'C' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-zinc-800 text-orange-400 hover:bg-zinc-700'}`}>{k}</button>
                   ))}
                   {['7', '8', '9', '*'].map(k => (
                     <button key={k} onClick={() => handleCalcInput(k)} className={`rounded-lg font-bold text-lg shadow-sm h-10 transition-all active:scale-95 ${['*'].includes(k) ? 'bg-zinc-800 text-orange-400 hover:bg-zinc-700' : 'bg-zinc-700 text-white hover:bg-zinc-600'}`}>{k}</button>
                   ))}
                   {['4', '5', '6', '-'].map(k => (
                     <button key={k} onClick={() => handleCalcInput(k)} className={`rounded-lg font-bold text-lg shadow-sm h-10 transition-all active:scale-95 ${['-'].includes(k) ? 'bg-zinc-800 text-orange-400 hover:bg-zinc-700' : 'bg-zinc-700 text-white hover:bg-zinc-600'}`}>{k}</button>
                   ))}
                   {['1', '2', '3', '+'].map(k => (
                     <button key={k} onClick={() => handleCalcInput(k)} className={`rounded-lg font-bold text-lg shadow-sm h-10 transition-all active:scale-95 ${['+'].includes(k) ? 'bg-zinc-800 text-orange-400 hover:bg-zinc-700' : 'bg-zinc-700 text-white hover:bg-zinc-600'}`}>{k}</button>
                   ))}
                   <button onClick={() => handleCalcInput('0')} className="col-span-2 bg-zinc-700 text-white hover:bg-zinc-600 rounded-lg font-bold text-lg shadow-sm h-10 transition-all active:scale-95">0</button>
                   <button onClick={() => handleCalcInput('.')} className="bg-zinc-700 text-white hover:bg-zinc-600 rounded-lg font-bold text-lg shadow-sm h-10 transition-all active:scale-95">.</button>
                   <button onClick={handleCalcResult} className="bg-orange-500 text-white hover:bg-orange-600 rounded-lg font-bold text-lg shadow-sm h-10 transition-all active:scale-95">=</button>
                </div>
             </div>
          </div>
        )}

        {/* FLOATING CHAT */}
        {isChatOpen && (
          <div 
            style={{ left: chatPos.x, top: chatPos.y }}
            className="absolute w-80 bg-zinc-800 border border-zinc-700 flex flex-col shadow-2xl rounded-xl z-50 animate-in fade-in zoom-in-95 duration-200 h-[500px]"
          >
             <div 
                onMouseDown={startDragChat}
                className="p-3 border-b border-zinc-700 flex justify-between items-center bg-zinc-900/50 rounded-t-xl cursor-move select-none active:bg-zinc-900 flex-none"
             >
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <MessageSquare size={16} className="text-indigo-400" />
                  Chat
                </h3>
                <button onClick={() => setIsChatOpen(false)} className="text-zinc-400 hover:text-white" onMouseDown={(e) => e.stopPropagation()}>
                  <X size={18} />
                </button>
             </div>

             {/* Messages List */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900/80 backdrop-blur-md">
                {messages.map((msg) => {
                  if (msg.type === 'system') {
                     return (
                       <div key={msg.id} className="flex flex-col items-center my-4 animate-in fade-in zoom-in-95">
                           <div className="text-[10px] text-zinc-500 font-mono mb-1">{msg.timestamp}</div>
                           <div className="text-xs text-zinc-400 italic bg-white/5 px-3 py-1 rounded-full border border-white/5">
                               {msg.text}
                           </div>
                       </div>
                     );
                  }
                  return (
                    <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-zinc-400">{msg.sender}</span>
                          <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
                       </div>
                       
                       <div className={`max-w-[85%] rounded-2xl p-3 ${
                         msg.isMe 
                           ? 'bg-indigo-600 text-white rounded-tr-none' 
                           : 'bg-zinc-700 text-zinc-100 rounded-tl-none'
                       }`}>
                          {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                          
                          {msg.file && (
                            <div className="flex items-center gap-3 bg-black/20 p-2 rounded-lg mt-1 border border-white/10">
                               <div className="p-2 bg-white/10 rounded">
                                 <File size={20} />
                               </div>
                               <div className="flex-1 overflow-hidden">
                                 <p className="text-xs font-medium truncate w-32">{msg.file.name}</p>
                                 <p className="text-[10px] opacity-70">{msg.file.size}</p>
                               </div>
                               <a 
                                 href={msg.file.url} 
                                 download={msg.file.name}
                                 className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                 title="Télécharger"
                               >
                                 <Download size={14} />
                               </a>
                            </div>
                          )}
                       </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
             </div>

             {/* Input Area */}
             <div className="p-3 border-t border-zinc-700 bg-zinc-900/50 rounded-b-xl flex-none">
                <form onSubmit={handleSendMessage} className="relative">
                   <input 
                     type="text" 
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                     placeholder="Écrire..."
                     className="w-full bg-zinc-900 text-white pl-4 pr-10 py-2 rounded-full border border-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-zinc-500 text-sm"
                   />
                   <button 
                     type="submit"
                     className="absolute right-1.5 top-1.5 p-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     disabled={!inputText.trim()}
                   >
                     <Send size={14} />
                   </button>
                </form>
                <div className="mt-2 flex items-center justify-between px-1">
                   <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                   />
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="text-zinc-400 hover:text-indigo-400 text-xs flex items-center gap-1 transition-colors"
                   >
                     <Paperclip size={14} />
                     Fichier
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
