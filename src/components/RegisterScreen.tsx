import { useState, type FormEvent } from 'react';
import { ShieldCheck, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { authApi, apiClient } from '../services/api.ts';

interface RegisterScreenProps {
  onRegister: (token: string) => void;
  onSwitchToLogin: () => void;
}

export const RegisterScreen = ({ onRegister, onSwitchToLogin }: RegisterScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Паролі не збігаються');
      return;
    }

    if (password.length < 8) {
      setError('Пароль повинен бути не менше 8 символів');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register(email, password, name);

      if (!response.success || !response.data) {
        setError(response.error || 'Registration failed');
        return;
      }

      const { accessToken, user } = response.data;
      apiClient.setToken(accessToken);
      if (user?.email) {
        localStorage.setItem('userEmail', user.email);
      }
      onRegister(accessToken);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-xl">
            <ShieldCheck className="text-white" size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
          Створити обліковий запис
        </h2>
        <p className="text-center text-slate-500 mb-6 text-sm">
          Приєднайтеся до CorpVault
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ім'я
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 outline-none transition-all"
                placeholder="Ваше ім'я"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 outline-none transition-all"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Мінімум 8 символів</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Підтвердіть пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Завантаження...' : 'Зареєструватися'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-center text-slate-600 text-sm">
            Вже маєте обліковий запис?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Увійти
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Secure Local Environment
        </p>
      </div>
    </div>
  );
};
