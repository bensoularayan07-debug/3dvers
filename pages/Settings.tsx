

import React, { useEffect, useState, useRef } from 'react';
import { User, FriendRequest } from '../types';
import { Button } from '../components/Button';
import { User as UserIcon, Bell, Shield, Globe, LogOut, Moon, Info, Users, UserPlus, Check, X, Send, Sun, Lock, Camera, Link } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface SettingsProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onLogout, onUpdateUser }) => {
  const { t, language, setLanguage, theme, toggleTheme } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'friends'>('general');
  const [is2FAEnabled, setIs2FAEnabled] = useState(user.twoFactorEnabled || false);
  
  // Friends Logic
  const [friendEmail, setFriendEmail] = useState("");
  const [myFriends, setMyFriends] = useState<string[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  // Password Modal Logic
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Profile Edit Modal Logic
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', avatar: '' });
  const [profileSuccess, setProfileSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
     const storedUsers = JSON.parse(localStorage.getItem('3dvers_users') || '[]');
     const currentUser = storedUsers.find((u: User) => u.email === user.email);
     if (currentUser) {
        setMyFriends(currentUser.friends || []);
        setIs2FAEnabled(currentUser.twoFactorEnabled || false);
     }
     // Load Requests
     const allRequests: FriendRequest[] = JSON.parse(localStorage.getItem('3dvers_friend_requests') || '[]');
     const myRequests = allRequests.filter(r => r.toEmail === user.email && r.status === 'pending');
     setRequests(myRequests);
  }, [user.email]);

  const toggle2FA = () => {
    const newValue = !is2FAEnabled;
    setIs2FAEnabled(newValue);
    // Update in Storage
    const storedUsers = JSON.parse(localStorage.getItem('3dvers_users') || '[]');
    const updatedUsers = storedUsers.map((u: User) => u.email === user.email ? { ...u, twoFactorEnabled: newValue } : u);
    localStorage.setItem('3dvers_users', JSON.stringify(updatedUsers));
    onUpdateUser({...user, twoFactorEnabled: newValue});
  };

  const sendFriendRequest = (e: React.FormEvent) => {
      e.preventDefault();
      if (!friendEmail || friendEmail === user.email) return;

      const allRequests: FriendRequest[] = JSON.parse(localStorage.getItem('3dvers_friend_requests') || '[]');
      // Check if already requested
      if (allRequests.some(r => r.fromEmail === user.email && r.toEmail === friendEmail && r.status === 'pending')) {
          alert("Demande déjà envoyée");
          return;
      }

      const newRequest: FriendRequest = {
          id: Math.random().toString(36).substr(2, 9),
          fromEmail: user.email,
          fromName: user.name,
          toEmail: friendEmail,
          status: 'pending'
      };
      localStorage.setItem('3dvers_friend_requests', JSON.stringify([...allRequests, newRequest]));
      setFriendEmail("");
      alert(t('sendRequest'));
  };

  const handleRequest = (req: FriendRequest, action: 'accepted' | 'rejected') => {
     // Update Request Status
     const allRequests: FriendRequest[] = JSON.parse(localStorage.getItem('3dvers_friend_requests') || '[]');
     const updatedRequests = allRequests.map(r => r.id === req.id ? { ...r, status: action } : r);
     localStorage.setItem('3dvers_friend_requests', JSON.stringify(updatedRequests));
     
     // Update Local State
     setRequests(requests.filter(r => r.id !== req.id));

     if (action === 'accepted') {
         // Add to Friends List for BOTH users (Simplified DB logic)
         const storedUsers = JSON.parse(localStorage.getItem('3dvers_users') || '[]');
         const updatedUsers = storedUsers.map((u: User) => {
             if (u.email === user.email) {
                 const friends = u.friends || [];
                 if (!friends.includes(req.fromEmail)) return { ...u, friends: [...friends, req.fromEmail] };
             }
             if (u.email === req.fromEmail) {
                 const friends = u.friends || [];
                 if (!friends.includes(user.email)) return { ...u, friends: [...friends, user.email] };
             }
             return u;
         });
         localStorage.setItem('3dvers_users', JSON.stringify(updatedUsers));
         setMyFriends(prev => [...prev, req.fromEmail]);
     }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (pwdForm.new !== pwdForm.confirm) {
        setPwdError(t('passwordMismatch'));
        return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('3dvers_users') || '[]');
    const currentUserIndex = storedUsers.findIndex((u: any) => u.email === user.email);
    
    if (currentUserIndex === -1) return;

    const storedUser = storedUsers[currentUserIndex];

    if (storedUser.password !== pwdForm.current) {
        setPwdError(t('incorrectPassword'));
        return;
    }

    // Update Password
    storedUsers[currentUserIndex].password = pwdForm.new;
    localStorage.setItem('3dvers_users', JSON.stringify(storedUsers));
    
    setPwdSuccess(t('passwordChanged'));
    setPwdForm({ current: '', new: '', confirm: '' });
    
    setTimeout(() => {
        setShowPasswordModal(false);
        setPwdSuccess('');
    }, 1500);
  };

  const handleEditProfileOpen = () => {
    setProfileForm({ name: user.name, avatar: user.avatar || '' });
    setProfileSuccess('');
    setShowProfileModal(true);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit size to avoid localStorage issues (e.g. 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("L'image est trop volumineuse (Max 2MB).");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storedUsers = JSON.parse(localStorage.getItem('3dvers_users') || '[]');
    const currentUserIndex = storedUsers.findIndex((u: any) => u.email === user.email);
    
    if (currentUserIndex === -1) return;

    // Update fields
    storedUsers[currentUserIndex].name = profileForm.name;
    storedUsers[currentUserIndex].avatar = profileForm.avatar;
    
    localStorage.setItem('3dvers_users', JSON.stringify(storedUsers));
    
    // Update parent state
    onUpdateUser({
      ...user,
      name: profileForm.name,
      avatar: profileForm.avatar
    });

    setProfileSuccess(t('profileUpdated'));
    setTimeout(() => {
      setShowProfileModal(false);
      setProfileSuccess('');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settingsTitle')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{t('settingsDesc')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-zinc-800">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            {t('generalInfo')}
          </button>
          <button 
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'friends' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            {t('contacts')}
          </button>
      </div>

      {activeTab === 'general' ? (
        <>
            {/* Profil Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-3xl font-bold ring-4 ring-white dark:ring-zinc-800 shadow-sm overflow-hidden">
                    {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                </div>
                <div className="text-center sm:text-left flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 mt-2">
                    {user.role}
                    </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleEditProfileOpen}>{t('editProfile')}</Button>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Notifications */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Bell size={20} />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('notifications')}</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">{t('reminders')}</span>
                    <input type="checkbox" defaultChecked className="toggle-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">{t('reports')}</span>
                    <input type="checkbox" defaultChecked className="toggle-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
                    </div>
                    <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">{t('invites')}</span>
                    <input type="checkbox" defaultChecked className="toggle-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
                    </div>
                </div>
                </div>

                {/* Apparence & Langue */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    <Globe size={20} />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('preferences')}</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                        <span>{t('darkMode')}</span>
                    </div>
                    <button 
                        onClick={toggleTheme}
                        className={`w-11 h-6 rounded-full p-1 flex items-center transition-colors duration-300 focus:outline-none ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                    </div>
                    <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">{t('language')}</span>
                    <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="text-sm border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 border rounded-md p-1 text-gray-700 dark:text-gray-200"
                    >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                    </select>
                    </div>
                </div>
                </div>

                {/* Sécurité */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <Shield size={20} />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('security')}</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{t('enable2FA')}</span>
                          <span className="text-gray-400 text-xs">Code envoyé par email à la connexion</span>
                       </div>
                       <input 
                         type="checkbox" 
                         checked={is2FAEnabled}
                         onChange={toggle2FA}
                         className="toggle-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" 
                       />
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-zinc-800"></div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>{t('lastLogin')} : Aujourd'hui à 09:41</p>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            icon={<Lock size={14} />} 
                            onClick={() => setShowPasswordModal(true)}
                        >
                            {t('changePassword')}
                        </Button>
                        <Button variant="danger" size="sm" onClick={onLogout} icon={<LogOut size={16} />}>
                            {t('logout')}
                        </Button>
                        </div>
                    </div>
                </div>
                </div>

                {/* About / Version */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 md:col-span-2 flex items-center gap-4">
                <div className="p-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-lg">
                    <Info size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('about')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0 (Build 2024.10.27)</p>
                </div>
                <div className="text-xs text-gray-400">
                    © 2024 3Dvers Inc.
                </div>
                </div>

            </div>
        </>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             
             {/* Add Friend */}
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                   <UserPlus size={20} className="text-indigo-600 dark:text-indigo-400" />
                   {t('addFriend')}
                </h3>
                <form onSubmit={sendFriendRequest} className="flex gap-2">
                   <input 
                     type="email" 
                     placeholder={t('friendEmailPlaceholder')}
                     className="flex-1 px-3 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg text-sm focus:ring-indigo-500 outline-none dark:text-white"
                     value={friendEmail}
                     onChange={(e) => setFriendEmail(e.target.value)}
                   />
                   <Button type="submit" size="sm" icon={<Send size={16} />}>{t('sendRequest')}</Button>
                </form>
             </div>

             {/* Pending Requests */}
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                   <Bell size={20} className="text-orange-500" />
                   {t('pendingRequests')}
                </h3>
                {requests.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Aucune demande en attente.</p>
                ) : (
                    <div className="space-y-3">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{req.fromName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{req.fromEmail}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRequest(req, 'accepted')} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" title={t('accept')}>
                                        <Check size={16} />
                                    </button>
                                    <button onClick={() => handleRequest(req, 'rejected')} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" title={t('decline')}>
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>

             {/* My Friends List */}
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 md:col-span-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                   <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                   {t('myFriends')} ({myFriends.length})
                </h3>
                {myFriends.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vous n'avez pas encore d'amis.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myFriends.map((friend, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                    {friend.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{friend}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Ami</p>
                                </div>
                                <button className="text-gray-400 hover:text-red-500">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
             </div>

         </div>
      )}

      {/* PASSWORD CHANGE MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Lock size={20} className="text-indigo-600 dark:text-indigo-400" />
                    {t('changePassword')}
                </h3>
                
                {pwdSuccess ? (
                    <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm text-center mb-4 flex items-center justify-center gap-2 animate-in fade-in">
                        <Check size={16} />
                        {pwdSuccess}
                    </div>
                ) : (
                    <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('currentPassword')}</label>
                            <input 
                                type="password" 
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={pwdForm.current}
                                onChange={e => setPwdForm({...pwdForm, current: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('newPassword')}</label>
                            <input 
                                type="password" 
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={pwdForm.new}
                                onChange={e => setPwdForm({...pwdForm, new: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('confirmPassword')}</label>
                            <input 
                                type="password" 
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={pwdForm.confirm}
                                onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                            />
                        </div>
                        
                        {pwdError && (
                            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/50">
                                {pwdError}
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <Button type="button" variant="ghost" onClick={() => { setShowPasswordModal(false); setPwdError(''); setPwdForm({current:'',new:'',confirm:''}); }} className="flex-1">
                                {t('cancel')}
                            </Button>
                            <Button type="submit" className="flex-1">{t('save')}</Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
      )}

      {/* PROFILE EDIT MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <UserIcon size={20} className="text-indigo-600 dark:text-indigo-400" />
                    {t('editProfile')}
                </h3>
                
                {profileSuccess ? (
                    <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm text-center mb-4 flex items-center justify-center gap-2 animate-in fade-in">
                        <Check size={16} />
                        {profileSuccess}
                    </div>
                ) : (
                    <form onSubmit={handleEditProfileSubmit} className="space-y-4">
                        <div className="flex flex-col items-center mb-6">
                           <div 
                             onClick={() => fileInputRef.current?.click()}
                             className="group relative w-24 h-24 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/50 cursor-pointer hover:border-indigo-500 transition-colors"
                           >
                              {profileForm.avatar ? (
                                <img src={profileForm.avatar} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <UserIcon size={32} className="text-gray-400" />
                              )}
                              
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Camera size={24} className="text-white" />
                              </div>
                           </div>
                           <button 
                             type="button" 
                             onClick={() => fileInputRef.current?.click()}
                             className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium hover:underline"
                           >
                             {t('uploadPhoto')}
                           </button>
                           <input 
                             type="file" 
                             ref={fileInputRef} 
                             className="hidden" 
                             accept="image/*"
                             onChange={handleAvatarUpload} 
                           />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fullName')}</label>
                            <input 
                                type="text" 
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={profileForm.name}
                                onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('avatarUrl')}
                            </label>
                            <div className="relative">
                                <Link size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="https://example.com/photo.jpg"
                                    value={profileForm.avatar}
                                    onChange={e => setProfileForm({...profileForm, avatar: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setShowProfileModal(false)} className="flex-1">
                                {t('cancel')}
                            </Button>
                            <Button type="submit" className="flex-1">{t('save')}</Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
      )}
    </div>
  );
};