export interface CreateNoteData {
  classId: string;
  date: string;
  content: string;
  topics?: string[];
  homework?: string;
  objectives?: string;
}

export interface UpdateNoteData {
  date?: string;
  content?: string;
  topics?: string[];
  homework?: string;
  objectives?: string;
}

export interface NoteFilters {
  classId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  topics?: string[];
  search?: string;
}

export interface NoteResponse {
  id: string;
  classId: string;
  date: string;
  content: string;
  topics: string[];
  homework?: string;
  objectives?: string;
  createdDate: string;
  updatedDate: string;
  createdAt: Date;
  updatedAt: Date;
  class?: {
    id: string;
    name: string;
    subject: string;
  };
}