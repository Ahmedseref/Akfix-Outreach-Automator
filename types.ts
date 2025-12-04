export interface Customer {
  id: string;
  company: string;
  representative: string;
  phone: string;
  country: string; // Adres usually contains country
  email: string;
  website: string;
  notes: string; // The Açıklama column
}

export interface GeneratedMessage {
  subject: string;
  body: string;
  type: 'email' | 'whatsapp';
  whatsappBody?: string;
}

export interface ProcessingStatus {
  isAnalyzing: boolean;
  isGenerating: boolean;
  progress: number;
  total: number;
}