import React, { useState } from 'react';
import { Meeting, AgendaItem, Task } from '../types';
import { Button } from '../components/Button';
import { Clock, MapPin, Users, CheckSquare, FileText, Play, Mic, Sparkles, Check, Download } from 'lucide-react';
import { generateMeetingSummary } from '../services/geminiService';

interface MeetingDetailProps {
  meeting: Meeting;
  onUpdate: (meeting: Meeting) => void;
  onBack: () => void;
}

export const MeetingDetail: React.FC<MeetingDetailProps> = ({ meeting, onUpdate, onBack }) => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'notes' | 'tasks'>('agenda');
  const [isRecording, setIsRecording] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [localNotes, setLocalNotes] = useState(meeting.notes);
  
  // Mock voice recognition simulation
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // Simulation: Append text after 2s
      setTimeout(() => {
        setLocalNotes(prev => prev + "\n[Transcription]: Nous devons prioriser le backlog technique avant la fin du sprint. Alice s'occupe de la migration DB.");
      }, 2000);
    }
  };

  const handleSaveNotes = () => {
    onUpdate({ ...meeting, notes: localNotes });
  };

  const handleGenerateSummary = async () => {
    if (!localNotes) return;
    setIsSummarizing(true);
    try {
      const result = await generateMeetingSummary(localNotes, meeting.participants);
      if (result) {
        // Append Summary to Notes and create Tasks
        const summaryBlock = `\n\n--- RÉSUMÉ IA ---\n${result.summary}`;
        const newTasks: Task[] = result.actionItems.map((item, idx) => ({
          id: `ai-task-${Date.now()}-${idx}`,
          description: item.description,
          assignee: item.assignee,
          status: 'pending'
        }));

        onUpdate({
          ...meeting,
          notes: localNotes + summaryBlock,
          tasks: [...meeting.tasks, ...newTasks]
        });
        setLocalNotes(prev => prev + summaryBlock);
        setActiveTab('tasks');
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  const toggleAgendaItem = (id: string) => {
    const newAgenda = meeting.agenda.map(i => i.id === id ? { ...i, completed: !i.completed } : i);
    onUpdate({ ...meeting, agenda: newAgenda });
  };

  const toggleTaskStatus = (id: string) => {
    const newTasks = meeting.tasks.map(t => t.id === id ? { ...t, status: (t.status === 'done' ? 'pending' : 'done') as 'pending' | 'done' } : t);
    onUpdate({ ...meeting, tasks: newTasks });
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-indigo-600 font-medium text-sm">← Retour</button>
        <div className="h-4 w-px bg-gray-300"></div>
        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
            meeting.status === 'scheduled' ? 'bg-indigo-50 text-indigo-700' : 'bg-green-50 text-green-700'
          }`}>
          {meeting.status === 'scheduled' ? 'Prévu' : 'En cours/Terminé'}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{meeting.title}</h1>
            <div className="flex flex-wrap gap-6 text-gray-500 mt-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-indigo-500" />
                <span>{new Date(meeting.date).toLocaleDateString()} • {meeting.startTime} - {meeting.endTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-indigo-500" />
                <span>{meeting.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-500" />
                <span>{meeting.participants.length} participants</span>
              </div>
            </div>
          </div>
          {meeting.status === 'scheduled' && (
            <Button onClick={() => onUpdate({...meeting, status: 'active'})} icon={<Play size={16} fill="currentColor" />}>
              Démarrer
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('agenda')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'agenda' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Ordre du jour
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Notes & Transcription
        </button>
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Tâches ({meeting.tasks.length})
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-auto">
        {activeTab === 'agenda' && (
          <div className="space-y-4">
            {meeting.agenda.length === 0 ? (
               <p className="text-gray-500 italic">Aucun ordre du jour défini.</p>
            ) : (
              meeting.agenda.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 group">
                  <button 
                    onClick={() => toggleAgendaItem(item.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent hover:border-indigo-500'}`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.topic}</p>
                  </div>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{item.duration}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="h-full flex flex-col">
            <div className="flex gap-2 mb-4">
              <Button 
                variant={isRecording ? "danger" : "outline"} 
                size="sm" 
                onClick={toggleRecording}
                icon={<Mic size={16} className={isRecording ? "animate-pulse" : ""} />}
              >
                {isRecording ? "Arrêter l'enregistrement" : "Dicter"}
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleGenerateSummary}
                loading={isSummarizing}
                disabled={!localNotes || localNotes.length < 10}
                icon={<Sparkles size={16} />}
              >
                Générer Compte-Rendu IA
              </Button>
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSaveNotes}
                icon={<Download size={16} />}
              >
                Sauvegarder
              </Button>
            </div>
            <textarea
              className="flex-1 w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-700 leading-relaxed"
              placeholder="Commencez à taper ou utilisez la dictée..."
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
            />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
             {meeting.tasks.length === 0 ? (
               <div className="text-center py-10 text-gray-500">
                 <CheckSquare size={48} className="mx-auto mb-3 opacity-20" />
                 <p>Aucune tâche assignée pour le moment.</p>
                 <p className="text-sm mt-1">Générez un compte-rendu IA pour extraire les tâches automatiquement.</p>
               </div>
            ) : (
              meeting.tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-4 border border-gray-100 rounded-lg bg-gray-50">
                   <button 
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${task.status === 'done' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 hover:border-indigo-500'}`}
                  >
                    {task.status === 'done' && <Check size={12} strokeWidth={3} />}
                  </button>
                  <div>
                    <p className={`text-sm font-medium ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                      {task.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 border border-gray-200 rounded-full shadow-sm">
                        @{task.assignee}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
