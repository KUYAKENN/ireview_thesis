export type DocumentType = 'PDF' | 'DOCX' | 'PPT';

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  size: string;
  modifiedDate: string; // We'll populate this with the time uploaded
  tags: string[];
  url?: string; 
  reviewer_url?: string;
}
