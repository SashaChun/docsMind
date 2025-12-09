import { X } from 'lucide-react';
import type { FormEvent } from 'react';
import type { Company } from '../../types';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (company: Omit<Company, 'id'>) => void;
}

export const AddCompanyModal = ({
  isOpen,
  onClose,
  onSubmit,
}: AddCompanyModalProps) => {
  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const company: Omit<Company, 'id'> = {
      name: formData.get('name') as string,
      edrpou: formData.get('edrpou') as string,
      director: formData.get('director') as string,
      accountant: formData.get('accountant') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
    };

    onSubmit(company);
    e.currentTarget.reset();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Нова компанія</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            required
            placeholder="Назва (напр. ТОВ Ромашка)"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
          />
          <input
            name="edrpou"
            required
            placeholder="ЄДРПОУ"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              name="director"
              placeholder="Директор"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
            />
            <input
              name="accountant"
              placeholder="Бухгалтер"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <input
            name="phone"
            placeholder="Телефон"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
          />
          <input
            name="email"
            placeholder="Email"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
          />
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800"
          >
            Створити
          </button>
        </form>
      </div>
    </div>
  );
};
