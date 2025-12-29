import { X } from 'lucide-react';
import { FormEvent, useEffect, useRef } from 'react';
import type { Company } from '../../types';

interface EditCompanyModalProps {
  isOpen: boolean;
  company: Company | null;
  onClose: () => void;
  onSubmit: (id: number, company: Omit<Company, 'id'>) => void;
}

export const EditCompanyModal = ({
  isOpen,
  company,
  onClose,
  onSubmit,
}: EditCompanyModalProps) => {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpen && company && formRef.current) {
      const form = formRef.current;
      (form.elements.namedItem('name') as HTMLInputElement).value = company.name;
      (form.elements.namedItem('edrpou') as HTMLInputElement).value = company.edrpou;
      (form.elements.namedItem('director') as HTMLInputElement).value = company.director;
      (form.elements.namedItem('accountant') as HTMLInputElement).value = company.accountant;
      (form.elements.namedItem('phone') as HTMLInputElement).value = company.phone;
      (form.elements.namedItem('email') as HTMLInputElement).value = company.email;
    }
  }, [isOpen, company]);

  if (!isOpen || !company) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const updatedCompany: Omit<Company, 'id'> = {
      name: formData.get('name') as string,
      edrpou: formData.get('edrpou') as string,
      director: formData.get('director') as string,
      accountant: formData.get('accountant') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
    };

    onSubmit(company.id, updatedCompany);
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Редагувати компанію</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
            Зберегти
          </button>
        </form>
      </div>
    </div>
  );
};
