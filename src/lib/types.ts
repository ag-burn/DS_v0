export type VerificationSignals = {
  face_match: number;
  liveness_active: number;
  liveness_passive: number;
  av_sync: number;
  audio_antispoof: number;
  ocr_consistency: number;
};

export type VerificationResponse = {
  status: 'verified' | 'review' | 'rejected';
  score: number;
  signals: VerificationSignals;
  explanations: string[];
  referenceId: string;
};

export type VerificationStep =
  | 'welcome'
  | 'name'
  | 'document'
  | 'selfie'
  | 'liveness'
  | 'audio'
  | 'verifying'
  | 'results'
  | 'error';
