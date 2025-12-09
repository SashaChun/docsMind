import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Clock, Share2, ExternalLink } from 'lucide-react';
import { authApi, sharesApi } from '../services/api.ts';
import type { UserProfile, ReceivedShare } from '../types';

export const ProfileScreen = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shares, setShares] = useState<ReceivedShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      const [profileRes, sharesRes] = await Promise.all([
        authApi.getProfile(),
        sharesApi.getReceived(),
      ]);

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data as UserProfile);
      } else if (!profileRes.success) {
        setError(profileRes.error || 'Не вдалося завантажити профіль');
      }

      if (sharesRes.success && sharesRes.data) {
        setShares(sharesRes.data as ReceivedShare[]);
      } else if (!sharesRes.success && !error) {
        setError(sharesRes.error || 'Не вдалося завантажити спільні документи');
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleOpenShare = (token: string) => {
    navigate(`/share/${token}`);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <main className="flex-1 max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
            <User size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Мій профіль</h1>
            {profile ? (
              <>
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <Mail size={14} />
                  <span className="truncate">{profile.email}</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Clock size={12} />
                  <span>
                    З нами з {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">Завантаження профілю...</p>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Share2 size={18} /> Документи, якими зі мною поділилися
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Список приватних посилань, надісланих на вашу пошту.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Завантаження даних...
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm max-w-md text-center">
                {error}
              </div>
            </div>
          ) : shares.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Поки що ніхто не поділився з вами документами.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto -mx-3 md:mx-0">
              <div className="space-y-3 px-3 md:px-0">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="border border-slate-100 rounded-xl p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3 hover:border-blue-100 hover:bg-blue-50/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {share.document.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span>
                          Від: {share.from.name || share.from.email}
                        </span>
                        <span>•</span>
                        <span>
                          Одержано {new Date(share.createdAt).toLocaleDateString()}
                        </span>
                        {share.document.company?.name && (
                          <>
                            <span>•</span>
                            <span>Компанія: {share.document.company.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-stretch md:self-auto">
                      <button
                        onClick={() => handleOpenShare(share.token)}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                      >
                        <ExternalLink size={14} />
                        Відкрити
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
