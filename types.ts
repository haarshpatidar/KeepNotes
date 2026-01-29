
export type Category = 'Work' | 'Personal' | 'Idea' | 'Urgent' | 'General' | 'Private';

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  reminderAt?: string; // ISO string
  dueAt?: string;      // ISO string
  category: Category;
  isCompleted: boolean;
  isPrivate: boolean;
  isPinned: boolean;
  color: string;
}

export interface SmartSuggestion {
  title: string;
  category: Category;
  summary: string;
  colorSuggestion: string;
}
