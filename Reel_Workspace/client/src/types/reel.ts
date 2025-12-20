export interface Reel {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  summary: string;
  transcript: string;
  ocrText: string;
  creatorHandle: string;
  tags: string[];
  folderId?: string;
  createdAt: Date;
  status: 'processing' | 'completed' | 'error';
}

export interface Folder {
  id: string;
  name: string;
  emoji: string;
  reelCount: number;
}

export type ProcessingStep = 
  | 'idle'
  | 'downloading'
  | 'transcribing'
  | 'summarizing'
  | 'extracting'
  | 'completed'
  | 'error';
