import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Image, Film, File, ExternalLink, Clock, User } from 'lucide-react';
import { sharesApi } from '../services/api';
import type { ReceivedShare } from '../types';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import type { Company } from '../types';

interface ReceivedSharesProps {
  companies: Company[];
  onSelectCompany: (id: number | null) => void;
  onLogout: () => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) {
    return { icon: Image, color: 'text-pink-600 bg-pink-50' };
  }
  if (mimeType.startsWith('video/')) {
    return { icon: Film, color: 'text-purple-600 bg-purple-50' };
  }
  if (mimeType === 'application/pdf') {
    return { icon: FileText, color: 'text-red-600 bg-red-50' };
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return { icon: FileText, color: 'text-blue-600 bg-blue-50' };
  }
  return { icon: File, color: 'text-slate-600 bg-slate-50' };
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isExpired = (expiresAt: string) => {
  return new Date(expiresAt) < new Date();
};

export const ReceivedShares = ({
  companies,
  onSelectCompany,
  onLogout,
}: ReceivedSharesProps) => {
  const navigate = useNavigate();
  const [shares, setShares] = useState<ReceivedShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await sharesApi.getReceived();
      if (response.success && response.data) {
        setShares(response.data);
      } else {
        setError(response.error || 'Не вдалося завантажити');
      }
    } catch (err) {
      setError('Помилка при завантаженні');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShare = (share: ReceivedShare) => {
    navigate(`/share/${share.token}`);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar
        companies={companies}
        selectedCompanyId={null}
        onSelectCompany={onSelectCompany}
        onLogout={onLogout}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader
          selectedCompanyId={null}
          onBack={() => navigate('/')}
          onLogout={onLogout}
        />

        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Поділилися зі мною</h1>
              <p className="text-sm text-slate-500">Документи та файли, якими з вами поділилися</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">Завантаження...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">{error}</div>
            </div>
          ) : shares.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Users size={48} className="mb-4 opacity-30" />
              <p>Поки що ніхто не поділився з вами документами</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shares.map((share) => {
                const expired = isExpired(share.expiresAt);
                const fileInfo = getFileIcon(share.document.mimeType);
                const IconComponent = fileInfo.icon;

                return (
                  <div
                    key={share.id}
                    className={`bg-white p-4 rounded-xl border shadow-sm transition-all ${
                      expired
                        ? 'border-red-200 opacity-60'
                        : 'border-slate-100 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2.5 rounded-lg ${fileInfo.color}`}>
                        <IconComponent size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-medium text-slate-800 truncate"
                          title={share.document.name}
                        >
                          {share.document.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {share.document.category}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User size={12} />
                        <span>Від: {share.from.name || share.from.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock size={12} />
                        <span>
                          {expired ? (
                            <span className="text-red-500">Термін дії закінчився</span>
                          ) : (
                            <>Дійсний до: {formatDate(share.expiresAt)}</>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50">
                      <button
                        onClick={() => handleOpenShare(share)}
                        disabled={expired}
                        className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                          expired
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <ExternalLink size={14} />
                        {expired ? 'Недоступний' : 'Відкрити'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
