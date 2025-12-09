import { ArrowLeft, LogOut } from 'lucide-react';

interface MobileHeaderProps {
  selectedCompanyId: number | null;
  onBack: () => void;
  onLogout: () => void;
}

export const MobileHeader = ({
  selectedCompanyId,
  onBack,
  onLogout,
}: MobileHeaderProps) => {
  return (
    <div className="md:hidden bg-white p-4 border-b border-slate-200 flex justify-between items-center">
      <div className="font-bold">CorpVault</div>
      <button onClick={selectedCompanyId ? onBack : onLogout}>
        {selectedCompanyId ? (
          <ArrowLeft size={20} />
        ) : (
          <LogOut size={20} />
        )}
      </button>
    </div>
  );
};
