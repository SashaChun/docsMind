import { useMemo } from 'react';
import type { Company, Document, CategoryType, Folder } from '../types';
import { Sidebar } from './Sidebar.tsx';
import { MobileHeader } from './MobileHeader.tsx';
import { CompaniesGrid } from './CompaniesGrid.tsx';
import { CompanyInfo } from './CompanyInfo.tsx';
import { DocumentsList } from './DocumentsList.tsx';

interface DashboardProps {
  companies: Company[];
  documents: Document[];
  folders?: Folder[];
  selectedCompanyId: number | null;
  activeCategory: CategoryType;
  onSelectCompany: (id: number | null) => void;
  onCategoryChange: (category: CategoryType) => void;
  onLogout: () => void;
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  onUploadDoc: () => void;
  onShareDoc: (doc: Document) => void;
  onShareFolder: (company: Company) => void;
  onShareDocFolder?: (folder: Folder) => void;
  onShareMultipleDocs?: (docs: Document[]) => void;
  onViewDoc: (doc: Document) => void;
  onEditDoc: (doc: Document) => void;
  onDeleteDoc: (doc: Document) => void;
  onDeleteFolder?: (folder: Folder) => void;
  onMoveDocToFolder?: (documentId: number, folderId: number | null) => void;
  onCreateFolder?: (name: string, category: string) => void;
}

export const Dashboard = ({
  companies,
  documents,
  folders = [],
  selectedCompanyId,
  activeCategory,
  onSelectCompany,
  onCategoryChange,
  onLogout,
  onAddCompany,
  onEditCompany,
  onUploadDoc,
  onShareDoc,
  onShareFolder,
  onShareDocFolder,
  onShareMultipleDocs,
  onViewDoc,
  onEditDoc,
  onDeleteDoc,
  onDeleteFolder,
  onMoveDocToFolder,
  onCreateFolder,
}: DashboardProps) => {
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const filteredDocs = useMemo(() => {
    if (!selectedCompanyId) return [];
    return documents.filter(
      (d) =>
        d.companyId === selectedCompanyId &&
        (activeCategory === 'all' || d.category === activeCategory)
    );
  }, [selectedCompanyId, documents, activeCategory]);

  const filteredFolders = useMemo(() => {
    if (!selectedCompanyId) return [];
    return folders.filter(
      (f) =>
        f.companyId === selectedCompanyId &&
        (activeCategory === 'all' || f.category === activeCategory)
    );
  }, [selectedCompanyId, folders, activeCategory]);

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={onSelectCompany}
        onLogout={onLogout}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <MobileHeader
          selectedCompanyId={selectedCompanyId}
          onBack={() => onSelectCompany(null)}
          onLogout={onLogout}
        />

        {!selectedCompanyId ? (
          <CompaniesGrid
            companies={companies}
            documents={documents}
            onSelectCompany={onSelectCompany}
            onAddCompany={onAddCompany}
          />
        ) : selectedCompany ? (
          <div className="flex-1 flex flex-col md:flex-row h-full">
            <CompanyInfo
              company={selectedCompany}
              onBack={() => onSelectCompany(null)}
              onShare={() => onShareFolder(selectedCompany)}
              onEdit={() => onEditCompany(selectedCompany)}
            />

            <DocumentsList
              documents={filteredDocs}
              folders={filteredFolders}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
              onUpload={onUploadDoc}
              onShare={onShareDoc}
              onShareFolder={onShareDocFolder}
              onShareMultiple={onShareMultipleDocs}
              onView={onViewDoc}
              onEdit={onEditDoc}
              onDelete={onDeleteDoc}
              onDeleteFolder={onDeleteFolder}
              onMoveToFolder={onMoveDocToFolder}
              onCreateFolder={onCreateFolder}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
};
