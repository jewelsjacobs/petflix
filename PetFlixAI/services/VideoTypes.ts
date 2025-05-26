export interface ClipInput {
  uri: string;
  duration: number;
}

export interface GenerationProgress {
  stage: 'initializing' | 'generating' | 'stitching' | 'complete' | 'error';
  currentClip?: number;
  totalClips?: number;
  overallProgress: number; 
  message?: string;
}

export interface NarrativeGenerationOptions {
  imageUri: string;
  themeId: string;
  onProgress?: (progress: GenerationProgress) => void;
}

export interface NarrativeGenerationResult {
  success: boolean;
  videoUrls?: string[];
  stitchedVideoUri?: string;
  error?: string;
}

export interface GenerationOptions {
  imageUri: string;
  themeId: string;
  onProgress?: (progress: number) => void;
}

export interface GenerationResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

export interface ThemeDetails {
  prompt: string;
  style?: string;
  aspect_ratio?: string;
}

// Vidu API response interfaces
export interface CreateTaskResponse {
  task_id: string;
  state: string;
  model: string;
  images: string[];
  prompt: string;
  duration: number;
  seed?: number;
  aspect_ratio: string;
  resolution: string;
  movement_amplitude?: string;
  created_at: string;
}

export interface QueryStatusResponse {
  state: 'created' | 'queueing' | 'processing' | 'success' | 'failed';
  err_code: string;
  creations: {
    id: string;
    url: string;
    cover_url: string;
  }[];
}

export interface ViduTaskCompletionResult {
  videoUrl: string;
  durationSeconds: number;
}

export interface TaskStatusResult {
  success: boolean;
  state?: QueryStatusResponse['state'];
  videoUrl?: string;
  error?: string;
  durationSeconds?: number;
} 