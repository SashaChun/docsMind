import type { Company, Document } from '../types';

const COMPANIES_KEY = 'companies';
const DOCUMENTS_KEY = 'documents';

const INITIAL_COMPANIES: Company[] = [
  {
    id: 1,
    name: 'ТОВ "Мега Буд"',
    edrpou: '33445566',
    director: 'Іваненко І.І.',
    accountant: 'Петренко О.О.',
    phone: '+380501112233',
    email: 'buh@mega.bud',
  },
  {
    id: 2,
    name: 'ФОП Сидоренко',
    edrpou: '1234567890',
    director: 'Сидоренко А.А.',
    accountant: 'Сам',
    phone: '+380679998877',
    email: 'fop@gmail.com',
  },
];

const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 101,
    companyId: 1,
    name: 'Виписка ЄДР',
    category: 'statutory',
    date: '2023-10-15',
  },
  {
    id: 102,
    companyId: 1,
    name: 'Статут (Скан)',
    category: 'statutory',
    date: '2023-01-20',
  },
  {
    id: 103,
    companyId: 1,
    name: 'Паспорт Директора',
    category: 'personal',
    date: '2023-05-11',
  },
  {
    id: 201,
    companyId: 2,
    name: 'Витяг платника ЄП',
    category: 'tax',
    date: '2024-01-10',
  },
];

export const loadCompanies = (): Company[] => {
  const saved = localStorage.getItem(COMPANIES_KEY);
  return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
};

export const loadDocuments = (): Document[] => {
  const saved = localStorage.getItem(DOCUMENTS_KEY);
  return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
};

export const saveCompanies = (companies: Company[]): void => {
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
};

export const saveDocuments = (documents: Document[]): void => {
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
};

export const initializeStorage = (): void => {
  if (!localStorage.getItem(COMPANIES_KEY)) {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(INITIAL_COMPANIES));
  }
  if (!localStorage.getItem(DOCUMENTS_KEY)) {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(INITIAL_DOCUMENTS));
  }
};
