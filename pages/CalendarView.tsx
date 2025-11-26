
import React, { useState, useEffect } from 'react';
import { Meeting } from '../types';
import { ChevronLeft, ChevronRight, Clock, MapPin, Video, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '../components/Button';

interface CalendarViewProps {
  onJoinMeeting: (id: string) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onJoinMeeting, onUpdateMeeting, onDeleteMeeting }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  const refreshMeetings = () => {
    const stored = JSON.parse(localStorage.getItem('3dvers_meetings') || '[]');
    setMeetings(stored);
  };

  useEffect(() => {
    refreshMeetings();
  }, []);

  // Helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust so Monday is 0, Sunday is 6
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(m => {
      const mDate = new Date(m.date);
      return isSameDay(mDate, date);
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMeeting) {
      onUpdateMeeting(editingMeeting);
      setEditingMeeting(null);
      refreshMeetings();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) {
      onDeleteMeeting(id);
      refreshMeetings();
      if (editingMeeting?.id === id) setEditingMeeting(null);
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const selectedMeetings = getMeetingsForDate(selectedDate);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
      {/* Calendar Section */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {blanksArray.map(i => <div key={`blank-${i}`} className="h-24 sm:h-32 bg-gray-50/50 rounded-lg" />)}
          
          {daysArray.map(day => {
            const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayMeetings = getMeetingsForDate(currentDayDate);
            const isSelected = isSameDay(currentDayDate, selectedDate);
            const isToday = isSameDay(currentDayDate, new Date());

            return (
              <button
                key={day}
                onClick={() => {
                   setSelectedDate(currentDayDate);
                   setEditingMeeting(null); // Close edit mode when changing days
                }}
                className={`h-24 sm:h-32 rounded-lg border p-2 flex flex-col items-start transition-all relative ${
                  isSelected 
                    ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/30' 
                    : 'border-gray-100 hover:border-indigo-300 bg-white'
                }`}
              >
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'
                }`}>
                  {day}
                </span>
                
                <div className="mt-auto w-full space-y-1">
                  {dayMeetings.slice(0, 3).map(m => (
                    <div key={m.id} className="text-[10px] truncate w-full px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
                      {m.startTime} {m.title}
                    </div>
                  ))}
                  {dayMeetings.length > 3 && (
                    <div className="text-[10px] text-gray-400 pl-1">
                      + {dayMeetings.length - 3} autres
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Details Section OR Edit Form */}
      <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
        
        {editingMeeting ? (
          // --- EDIT MODE ---
          <div className="flex flex-col h-full">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="font-bold text-lg text-gray-900">Modifier</h3>
               <button onClick={() => setEditingMeeting(null)} className="text-gray-400 hover:text-gray-600">
                 <X size={20} />
               </button>
             </div>
             <form onSubmit={handleSaveEdit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
                  <input 
                    value={editingMeeting.title} 
                    onChange={(e) => setEditingMeeting({...editingMeeting, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="date"
                    value={editingMeeting.date} 
                    onChange={(e) => setEditingMeeting({...editingMeeting, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Début</label>
                    <input 
                      type="time"
                      value={editingMeeting.startTime} 
                      onChange={(e) => setEditingMeeting({...editingMeeting, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                   <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fin</label>
                    <input 
                      type="time"
                      value={editingMeeting.endTime} 
                      onChange={(e) => setEditingMeeting({...editingMeeting, endTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lieu</label>
                  <input 
                    value={editingMeeting.location} 
                    onChange={(e) => setEditingMeeting({...editingMeeting, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                   <Button type="submit" className="w-full" icon={<Save size={16} />}>Sauvegarder</Button>
                   <Button type="button" variant="outline" onClick={() => setEditingMeeting(null)}>Annuler</Button>
                </div>
             </form>
          </div>
        ) : (
          // --- LIST MODE ---
          <>
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">
                {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {selectedMeetings.length} événement(s) prévu(s)
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedMeetings.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p>Aucune réunion pour ce jour.</p>
                </div>
              ) : (
                selectedMeetings.map(m => (
                  <div key={m.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 group hover:border-indigo-200 transition-all relative">
                    
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800 line-clamp-2 pr-6">{m.title}</h4>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium flex-none ${m.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {m.status === 'scheduled' ? 'Prévu' : 'Terminé'}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50 pl-2">
                       <button onClick={() => setEditingMeeting(m)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded shadow-sm" title="Modifier">
                         <Edit2 size={14} />
                       </button>
                       <button onClick={() => handleDelete(m.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded shadow-sm" title="Supprimer">
                         <Trash2 size={14} />
                       </button>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={14} />
                          {m.startTime} - {m.endTime}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin size={14} />
                          {m.location || "En ligne"}
                      </div>
                    </div>

                    <button 
                      onClick={() => onJoinMeeting(m.id)}
                      className="w-full py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Video size={16} />
                      Rejoindre
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
