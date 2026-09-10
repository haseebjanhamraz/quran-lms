export type MaterialCategory =
  | 'QAIDA'
  | 'TAJWEED'
  | 'QURAN_PARAH'
  | 'DUAS_ADHKAR'
  | 'ISLAMIC_STUDIES'
  | 'GENERAL';

export interface MaterialItem {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  category: MaterialCategory;
  targetLevel: string;
  courseId?: string;
  course?: { id: string; title: string };
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploader?: { id: string; name: string; email: string };
  downloadsCount: number;
  createdAt: string;
}

export interface MaterialsManagerProps {
  userRole?: 'ADMIN' | 'SUPER_ADMIN' | 'TEACHER';
  title?: string;
  subtitle?: string;
  className?: string;
}

export interface CourseOption {
  id?: string;
  _id?: string;
  title: string;
  type?: string;
}
