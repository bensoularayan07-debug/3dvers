
import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { VideoCall } from './pages/VideoCall';
import { NewMeeting } from './pages/NewMeeting';
import { MeetingDetail } from './pages/MeetingDetail';
import { CalendarView } from './pages/CalendarView';
import { User, Meeting, Invitation } from './types';
import { Home, Settings as SettingsIcon, LogOut, Calendar, Bell, X, Mail } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';

function AppContent() {
  const { t, language } = useApp();
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'settings' | 'new_meeting' | 'meeting_detail' | 'calendar'>('home');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [activeCallTitle, setActiveCallTitle] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  // Notification State
  const [notification, setNotification] = useState<{title: string, message: string, meetingId: string, type: 'reminder' | 'invite'} | null>(null);
  const [notifiedMeetings, setNotifiedMeetings] = useState<Set<string>>(new Set());
  const [processedInvites, setProcessedInvites] = useState<Set<string>>(new Set());

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentView('home');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveCallId(null);
    setCurrentView('home');
    setNotifiedMeetings(new Set());
    setProcessedInvites(new Set());
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleStartInstantMeeting = () => {
    const randomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    setActiveCallId(randomId);
    setActiveCallTitle("Réunion Instantanée");
  };

  const handleJoinMeeting = (id: string) => {
    const existing = JSON.parse(localStorage.getItem('3dvers_meetings') || '[]');
    const foundMeeting = existing.find((m: Meeting) => m.id === id);

    if (foundMeeting) {
      setActiveCallTitle(foundMeeting.title);
      const updatedList = existing.map((m: Meeting) => 
        m.id === id ? { ...m, status: 'active' } : m
      );
      localStorage.setItem('3dvers_meetings', JSON.stringify(updatedList));
    } else {
      setActiveCallTitle(null);
    }
    
    setActiveCallId(id);
  };

  const handleLeaveCall = () => {
    setActiveCallId(null);
    setActiveCallTitle(null);
  };

  const handleSaveMeeting = (meeting: Meeting) => {
    const existing = JSON.parse(localStorage.getItem('3dvers_meetings') || '[]');
    localStorage.setItem('3dvers_meetings', JSON.stringify([...existing, meeting]));
    setCurrentView('home');
  };

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    const existing = JSON.parse(localStorage.getItem('3dvers_meetings') || '[]');
    const updatedList = existing.map((m: Meeting) => m.id === updatedMeeting.id ? updatedMeeting : m);
    localStorage.setItem('3dvers_meetings', JSON.stringify(updatedList));
    if (selectedMeeting && selectedMeeting.id === updatedMeeting.id) {
      setSelectedMeeting(updatedMeeting);
    }
  };

  const handleDeleteMeeting = (id: string) => {
    const existing = JSON.parse(localStorage.getItem('3dvers_meetings') || '[]');
    const updatedList = existing.filter((m: Meeting) => m.id !== id);
    localStorage.setItem('3dvers_meetings', JSON.stringify(updatedList));
  };

  // --- NOTIFICATION SYSTEM ---
  useEffect(() => {
    if (!user) return;

    const checkNotifications = () => {
      const storedMeetings: Meeting[] = JSON.parse(localStorage.getItem('3dvers_meetings') || '[]');
      const now = new Date();
      
      storedMeetings.forEach(meeting => {
        if (notifiedMeetings.has(meeting.id)) return;

        const meetingDateTimeStr = `${meeting.date}T${meeting.startTime}`;
        const meetingTime = new Date(meetingDateTimeStr);
        
        if (isNaN(meetingTime.getTime())) return;

        const diffMs = meetingTime.getTime() - now.getTime();
        const diffMinutes = diffMs / 1000 / 60;

        if (diffMinutes > 0 && diffMinutes <= 10) {
           setNotification({
             title: "Rappel de réunion",
             message: `"${meeting.title}" commence dans ${Math.ceil(diffMinutes)} minutes.`,
             meetingId: meeting.id,
             type: 'reminder'
           });
           setNotifiedMeetings(prev => new Set(prev).add(meeting.id));
           setTimeout(() => setNotification(null), 8000);
        }
      });

      const invitations: Invitation[] = JSON.parse(localStorage.getItem('3dvers_invitations') || '[]');
      const myInvites = invitations.filter(inv => 
        inv.toEmail === user.email && 
        !processedInvites.has(inv.id) &&
        (Date.now() - inv.timestamp) < 3600000 
      );

      if (myInvites.length > 0) {
        const invite = myInvites[0];
        setNotification({
          title: "Invitation reçue",
          message: `${invite.fromName} vous invite à : "${invite.meetingTitle}"`,
          meetingId: invite.meetingId,
          type: 'invite'
        });
        setProcessedInvites(prev => new Set(prev).add(invite.id));
        setTimeout(() => setNotification(null), 15000);
      }
    };

    const intervalId = setInterval(checkNotifications, 5000);
    checkNotifications();

    return () => clearInterval(intervalId);
  }, [user, notifiedMeetings, processedInvites]);


  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (activeCallId) {
    return (
      <VideoCall 
        meetingId={activeCallId} 
        meetingTitle={activeCallTitle}
        userName={user.name}
        onLeave={handleLeaveCall} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden font-sans relative text-gray-900 dark:text-gray-100">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`absolute top-6 right-6 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-2xl border-l-4 p-4 w-96 animate-in slide-in-from-right duration-500 flex gap-3 ${notification.type === 'invite' ? 'border-green-500' : 'border-indigo-600'}`}>
           <div className={`p-2 rounded-full h-fit ${notification.type === 'invite' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
             {notification.type === 'invite' ? <Mail size={20} /> : <Bell size={20} />}
           </div>
           <div className="flex-1">
             <h4 className="font-bold text-gray-900 dark:text-white text-sm">{notification.title}</h4>
             <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
             <button 
               onClick={() => {
                 setNotification(null);
                 handleJoinMeeting(notification.meetingId);
               }}
               className={`mt-2 text-xs font-bold hover:underline ${notification.type === 'invite' ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`}
             >
               {notification.type === 'invite' ? 'Accepter et rejoindre →' : 'Rejoindre maintenant →'}
             </button>
           </div>
           <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 h-fit">
             <X size={16} />
           </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 dark:bg-black text-white hidden md:flex flex-col transition-all duration-300 border-r border-slate-800 dark:border-zinc-800">
        <div className="p-6 border-b border-slate-800 dark:border-zinc-800 flex items-center gap-3 justify-center lg:justify-start">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <span className="font-bold text-lg">3D</span>
          </div>
          <span className="font-semibold text-xl tracking-tight hidden lg:block">3Dvers</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<Home size={24} />} 
            label={t('home')}
            active={currentView === 'home'} 
            onClick={() => setCurrentView('home')} 
          />
           <SidebarItem 
            icon={<Calendar size={24} />} 
            label={t('agenda')}
            active={currentView === 'calendar'} 
            onClick={() => setCurrentView('calendar')} 
          />
          <SidebarItem 
            icon={<SettingsIcon size={24} />} 
            label={t('settings')}
            active={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800 dark:border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-3 mb-2 justify-center lg:justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-inner overflow-hidden">
              {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <div className="overflow-hidden hidden lg:block">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{t('online')}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-2 lg:px-4 py-2 hover:bg-slate-800 dark:hover:bg-zinc-800 rounded-lg justify-center lg:justify-start"
            title={t('logout')}
          >
            <LogOut size={20} />
            <span className="text-sm hidden lg:block">{t('logout')}</span>
          </button>
          <div className="text-center mt-4 text-xs text-slate-600 dark:text-zinc-600 hidden lg:block">
            v1.2.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="bg-white dark:bg-zinc-900 shadow-sm border-b border-gray-200 dark:border-zinc-800 md:hidden p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">3D</div>
            <span className="font-bold text-gray-900 dark:text-white">3Dvers</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentView(currentView === 'home' ? 'calendar' : 'home')} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
               <Calendar size={24} />
            </button>
            <button onClick={() => setCurrentView(currentView === 'home' ? 'settings' : 'home')} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
              {currentView === 'settings' ? <Home size={24} /> : <SettingsIcon size={24} />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100">
            {currentView === 'home' && (
              <Dashboard 
                onStartInstantMeeting={handleStartInstantMeeting}
                onJoinMeeting={handleJoinMeeting}
                onPlanMeeting={() => setCurrentView('new_meeting')}
              />
            )}
            {currentView === 'new_meeting' && (
              <NewMeeting onSave={handleSaveMeeting} onCancel={() => setCurrentView('home')} />
            )}
            {currentView === 'meeting_detail' && selectedMeeting && (
              <MeetingDetail 
                 meeting={selectedMeeting} 
                 onUpdate={handleUpdateMeeting} 
                 onBack={() => setCurrentView('home')} 
              />
            )}
             {currentView === 'calendar' && (
              <CalendarView 
                 onJoinMeeting={handleJoinMeeting}
                 onUpdateMeeting={handleUpdateMeeting}
                 onDeleteMeeting={handleDeleteMeeting}
              />
            )}
            {currentView === 'settings' && (
              <Settings user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl transition-all duration-200 justify-center lg:justify-start ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
          : 'text-slate-400 hover:bg-slate-800 dark:hover:bg-zinc-800 hover:text-white'
      }`}
      title={label}
    >
      {icon}
      <span className="font-medium text-sm hidden lg:block">{label}</span>
    </button>
  );
}
