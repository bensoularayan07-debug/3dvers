
import React, { useState, useEffect } from 'react';
import { Video, Keyboard, Calendar, Clock, Link as LinkIcon, Trash2, Play, MapPin } from 'lucide-react';
import { Meeting } from '../types';
import { useApp } from '../contexts/AppContext';

interface DashboardProps {
  onStartInstantMeeting: () => void;
  onJoinMeeting: (id: string) => void;
  onPlanMeeting: () => void; 
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartInstantMeeting, onJoinMeeting, onPlanMeeting }) => {
  const { t } = useApp();
  const [joinId, setJoinId] = useState('');
  const [myMeetings, setMyMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const storedMeetings = JSON.parse(localStorage.getItem('3dvers_meetings') || '[]');
    const sorted = storedMeetings.sort((a: Meeting, b: Meeting) => 
      new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()
    );
    setMyMeetings(sorted);
  }, []);

  const handleDeleteMeeting = (id: string) => {
    const updated = myMeetings.filter(m => m.id !== id);
    setMyMeetings(updated);
    localStorage.setItem('3dvers_meetings', JSON.stringify(updated));
  };

  return (
    <div className="h-full flex flex-col items-center max-w-4xl mx-auto w-full">
       <div className="mb-10 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
         <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">{t('dashboardTitle')}</h1>
         <p className="text-xl text-gray-500 dark:text-gray-400">{t('dashboardSubtitle')}</p>
       </div>

       {/* Actions Principales */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
          
          {/* New Meeting Card */}
          <button 
            onClick={onStartInstantMeeting}
            className="group flex flex-col items-center justify-center p-8 bg-orange-500 hover:bg-orange-600 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 text-white"
          >
            <div className="p-4 bg-white/20 rounded-xl mb-4 backdrop-blur-sm">
              <Video size={48} fill="currentColor" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{t('newMeeting')}</h3>
            <p className="text-orange-100">{t('newMeetingDesc')}</p>
          </button>

          {/* Join Meeting Card */}
          <div className="flex flex-col items-center justify-center p-8 bg-indigo-600 rounded-2xl shadow-lg text-white">
             <div className="p-4 bg-white/20 rounded-xl mb-4 backdrop-blur-sm">
              <Keyboard size={48} />
            </div>
            <h3 className="text-2xl font-bold mb-4">{t('join')}</h3>
            <div className="flex w-full gap-2">
              <input 
                type="text" 
                placeholder={t('meetingIdPlaceholder')}
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-500 w-full"
              />
              <button 
                onClick={() => joinId && onJoinMeeting(joinId)}
                className="bg-indigo-800 hover:bg-indigo-900 px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!joinId}
              >
                {t('go')}
              </button>
            </div>
          </div>
       </div>

       {/* Liste des réunions programmées */}
       {myMeetings.length > 0 && (
         <div className="w-full max-w-3xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />
              {t('upcomingMeetings')}
            </h2>
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
              {myMeetings.map((meeting) => (
                <div key={meeting.id} className="p-4 border-b border-gray-100 dark:border-zinc-800 last:border-0 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{meeting.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><Clock size={14} /> {meeting.startTime} - {meeting.endTime}</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(meeting.date).toLocaleDateString()}</span>
                      {meeting.location && <span className="flex items-center gap-1"><MapPin size={14} /> {meeting.location}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onJoinMeeting(meeting.id)}
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors dark:bg-green-900/30 dark:text-green-400"
                      title="Démarrer"
                    >
                      <Play size={18} fill="currentColor" />
                    </button>
                    <button 
                      onClick={() => handleDeleteMeeting(meeting.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors dark:bg-red-900/30 dark:text-red-400"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
         </div>
       )}

       {/* Actions Secondaires */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-400 text-sm w-full max-w-2xl border-t border-gray-200 dark:border-zinc-800 pt-8">
          <div className="flex flex-col items-center group cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 rounded-full flex items-center justify-center mb-3 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
               <LinkIcon size={24} />
            </div>
            <p>{t('getLink')}</p>
          </div>
           <div 
             onClick={onPlanMeeting}
             className="flex flex-col items-center group cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
           >
            <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 rounded-full flex items-center justify-center mb-3 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
               <Calendar size={24} />
            </div>
            <p>{t('planAgenda')}</p>
          </div>
           <div className="flex flex-col items-center group cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 rounded-full flex items-center justify-center mb-3 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
               <Clock size={24} />
            </div>
            <p>{t('history')}</p>
          </div>
       </div>
    </div>
  );
};
