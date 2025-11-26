
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Lock, Mail, User as UserIcon, ArrowRight, Eye, EyeOff, ShieldCheck, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import { User } from '../types';
import { useApp } from '../contexts/AppContext';
import { Logo3D } from '../components/Logo3D';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useApp();
  
  // View State: 'login' | 'register' | 'forgot' | '2fa'
  const [view, setView] = useState<'login' | 'register' | 'forgot' | '2fa'>('login');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  // UX States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [tempUser, setTempUser] = useState<User | null>(null); // Store user during 2FA step

  // Password Strength
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 6) score++;
    if (pass.length > 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 5
  };
  const strength = calculateStrength(password);

  const getStrengthColor = (s: number) => {
    if (s < 2) return 'bg-red-500';
    if (s < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (s: number) => {
    if (s < 2) return t('weak');
    if (s < 4) return t('medium');
    return t('strong');
  };

  // --- HANDLERS ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const storedUsers = JSON.parse(localStorage.getItem('3dvers_users') || '[]');
      const foundUser = storedUsers.find((u: any) => u.email === email && u.password === password);

      if (foundUser) {
        if (foundUser.twoFactorEnabled) {
          // Trigger 2FA Flow
          setTempUser(foundUser);
          setView('2fa');
          // Simulate sending code
          console.log("Code 2FA: 123456");
          setIsLoading(false);
        } else {
          // Direct Login
          completeLogin(foundUser);
        }
      } else {
        setError('Email ou mot de passe incorrect.');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères.');
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      const storedUsers = JSON.parse(localStorage.getItem('3dvers_users') || '[]');
      if (storedUsers.find((u: any) => u.email === email)) {
        setError('Un compte existe déjà avec cet email.');
        setIsLoading(false);
        return;
      }

      const newUser = {
        email,
        name,
        password,
        role: 'Admin', 
        avatar: '',
        friends: [],
        twoFactorEnabled: false
      };

      localStorage.setItem('3dvers_users', JSON.stringify([...storedUsers, newUser]));
      completeLogin(newUser);
    }, 800);
  };

  const handle2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      if (twoFactorCode === '123456') {
        if (tempUser) completeLogin(tempUser);
      } else {
        setError('Code incorrect.');
        setIsLoading(false);
      }
    }, 600);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setSuccessMsg(`Si un compte existe pour ${email}, un lien de réinitialisation a été envoyé.`);
      setIsLoading(false);
    }, 1000);
  };

  const completeLogin = (userData: any) => {
    onLogin({
      email: userData.email,
      name: userData.name,
      role: userData.role || 'Utilisateur',
      avatar: userData.avatar || '',
      friends: userData.friends || [],
      twoFactorEnabled: userData.twoFactorEnabled
    });
  };

  // --- VIEWS ---

  if (view === '2fa') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 dark:border-zinc-800 text-center">
             <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
               <ShieldCheck className="text-indigo-600 dark:text-indigo-300" size={24} />
             </div>
             <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('enterCode')}</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('codeSent')}</p>
             
             <form onSubmit={handle2FA} className="space-y-6">
                <div className="flex justify-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g,''))}
                    className="block w-32 text-center tracking-[0.5em] text-xl font-bold border-gray-300 dark:border-zinc-700 rounded-md py-3 border outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white"
                    placeholder="000000"
                    autoFocus
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full" loading={isLoading}>{t('verify')}</Button>
             </form>
             <button 
               onClick={() => setView('login')} 
               className="mt-4 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
             >
               {t('cancel')}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <Logo3D size="lg" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {view === 'register' ? t('createAccount') : view === 'forgot' ? t('resetPassword') : t('welcome')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {view === 'register' ? t('createAccountSubtitle') : view === 'forgot' ? "Nous vous enverrons les instructions." : t('loginSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 dark:border-zinc-800 relative">
          
          {view === 'forgot' && successMsg ? (
             <div className="text-center py-6">
               <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle className="text-green-600" size={24} />
               </div>
               <p className="text-gray-900 dark:text-white font-medium mb-2">Email envoyé !</p>
               <p className="text-sm text-gray-500 mb-6">{successMsg}</p>
               <Button onClick={() => { setView('login'); setSuccessMsg(''); }} className="w-full">
                 {t('backToLogin')}
               </Button>
             </div>
          ) : (
            <form className="space-y-6" onSubmit={view === 'login' ? handleLogin : view === 'register' ? handleRegister : handleForgot}>
              
              {view === 'register' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('fullName')}
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-zinc-700 rounded-md py-2 border outline-none dark:bg-zinc-800 dark:text-white"
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('email')}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-zinc-700 rounded-md py-2 border outline-none dark:bg-zinc-800 dark:text-white"
                    placeholder="vous@entreprise.com"
                  />
                </div>
              </div>

              {view !== 'forgot' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('password')}
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 dark:border-zinc-700 rounded-md py-2 border outline-none dark:bg-zinc-800 dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Strength Meter */}
                  {view === 'register' && password && (
                    <div className="mt-2 animate-in fade-in">
                      <div className="flex gap-1 h-1 mb-1">
                        <div className={`flex-1 rounded-full ${strength >= 1 ? getStrengthColor(strength) : 'bg-gray-200 dark:bg-zinc-700'}`}></div>
                        <div className={`flex-1 rounded-full ${strength >= 2 ? getStrengthColor(strength) : 'bg-gray-200 dark:bg-zinc-700'}`}></div>
                        <div className={`flex-1 rounded-full ${strength >= 3 ? getStrengthColor(strength) : 'bg-gray-200 dark:bg-zinc-700'}`}></div>
                        <div className={`flex-1 rounded-full ${strength >= 4 ? getStrengthColor(strength) : 'bg-gray-200 dark:bg-zinc-700'}`}></div>
                      </div>
                      <p className="text-xs text-right text-gray-500 dark:text-gray-400">{getStrengthLabel(strength)}</p>
                    </div>
                  )}

                  {view === 'login' && (
                    <div className="flex justify-end mt-1">
                      <button type="button" onClick={() => setView('forgot')} className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                        {t('forgotPassword')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded animate-pulse border border-red-100 dark:border-red-900/50">
                  {error}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full flex justify-center"
                  loading={isLoading}
                  icon={!isLoading ? (view === 'forgot' ? <KeyRound size={18} /> : <ArrowRight size={18} />) : undefined}
                >
                  {view === 'login' ? t('login') : view === 'register' ? t('signup') : t('resetPassword')}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-zinc-900 text-gray-500">
                  {t('or')}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              {view === 'forgot' ? (
                 <button
                  onClick={() => { setView('login'); setSuccessMsg(''); setError(''); }}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft size={16} /> {t('backToLogin')}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setView(view === 'login' ? 'register' : 'login');
                    setError('');
                    setEmail('');
                    setPassword('');
                    setName('');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium text-sm transition-colors focus:outline-none"
                >
                  {view === 'login' ? t('noAccount') : t('hasAccount')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
