import React, { useState } from 'react';
import { Meeting, AgendaItem } from '../types';
import { Button } from '../components/Button';
import { Sparkles, X, Plus, Trash2 } from 'lucide-react';
import { generateSmartAgenda } from '../services/geminiService';

interface NewMeetingProps {
  onSave: (meeting: Meeting) => void;
  onCancel: () => void;
}

export const NewMeeting: React.FC<NewMeetingProps> = ({ onSave, onCancel }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '10:00',
    endTime: '11:00',
    location: '',
    participantsStr: ''
  });
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateAgenda = async () => {
    if (!formData.title) return;
    setIsGenerating(true);
    try {
      // Calculate duration mostly for the prompt
      const duration = "1 hour"; // Simplified for demo
      const items = await generateSmartAgenda(formData.title, duration);
      setAgenda(items);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMeeting: Meeting = {
      id: Date.now().toString(),
      title: formData.title,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      participants: formData.participantsStr.split(',').map(s => s.trim()).filter(Boolean),
      status: 'scheduled',
      agenda: agenda,
      notes: '',
      tasks: []
    };
    onSave(newMeeting);
  };

  const addAgendaItem = () => {
    setAgenda([...agenda, { id: Date.now().toString(), topic: '', duration: '', completed: false }]);
  };

  const updateAgendaItem = (id: string, field: keyof AgendaItem, value: string) => {
    setAgenda(agenda.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeAgendaItem = (id: string) => {
    setAgenda(agenda.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Planifier une réunion</h1>
        <p className="text-gray-500">Organisez votre prochain point d'équipe.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sujet de la réunion</label>
            <input
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Ex: Lancement Projet Alpha"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                required
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu / Lien Visio</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Salle A ou lien Meet"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
              <input
                required
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
              <input
                required
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Participants (séparés par des virgules)</label>
            <input
              name="participantsStr"
              value={formData.participantsStr}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="alice@test.com, bob@test.com"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Ordre du jour</h2>
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={handleGenerateAgenda} 
              loading={isGenerating}
              disabled={!formData.title}
              icon={<Sparkles size={16} />}
            >
              Générer avec l'IA
            </Button>
          </div>

          <div className="space-y-3">
            {agenda.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <span className="text-gray-400 font-medium w-6">{index + 1}.</span>
                <input
                  value={item.topic}
                  onChange={(e) => updateAgendaItem(item.id, 'topic', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-indigo-500 outline-none text-sm"
                  placeholder="Sujet"
                />
                <input
                  value={item.duration}
                  onChange={(e) => updateAgendaItem(item.id, 'duration', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:border-indigo-500 outline-none text-sm"
                  placeholder="Durée"
                />
                <button 
                  type="button"
                  onClick={() => removeAgendaItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            <Button type="button" variant="ghost" size="sm" onClick={addAgendaItem} icon={<Plus size={16} />}>
              Ajouter un point
            </Button>
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
          <Button type="submit">Créer la réunion</Button>
        </div>
      </form>
    </div>
  );
};
