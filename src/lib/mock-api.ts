import type { VerificationResponse } from './types';

const verifiedResult: VerificationResponse = {
  status: 'verified',
  score: 0.92,
  signals: {
    face_match: 0.98,
    liveness_active: 0.95,
    liveness_passive: 0.9,
    av_sync: 0.88,
    audio_antispoof: 0.91,
    ocr_consistency: 0.99,
  },
  explanations: [],
  referenceId: 'VRF-20240728-ABC',
};

const reviewResult: VerificationResponse = {
  status: 'review',
  score: 0.68,
  signals: {
    face_match: 0.95,
    liveness_active: 0.8,
    liveness_passive: 0.7,
    av_sync: 0.55,
    audio_antispoof: 0.9,
    ocr_consistency: 0.6,
  },
  explanations: [
    'A/V sync score is low, which might indicate a lip-sync deepfake attempt.',
    'OCR consistency between document fields is low. Manual review of document details is recommended.',
  ],
  referenceId: 'VRF-20240728-DEF',
};

const rejectedResult: VerificationResponse = {
  status: 'rejected',
  score: 0.45,
  signals: {
    face_match: 0.85,
    liveness_active: 0.3,
    liveness_passive: 0.4,
    av_sync: 0.5,
    audio_antispoof: 0.6,
    ocr_consistency: 0.9,
  },
  explanations: [
    'Active liveness check failed. The system detected non-compliant user behavior.',
    'Passive liveness score is low, indicating potential signs of a presentation attack (e.g., screen replay).',
  ],
  referenceId: 'VRF-20240728-GHI',
};

// In a real app, these would be API calls.
export const mockCreateSession = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    sessionId: `sid_${Date.now()}`,
    uploadUrls: {
      selfie: '#',
      audio: '#',
      doc_front: '#',
      doc_back: '#',
    },
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  };
};

export const mockVerify = async (): Promise<VerificationResponse> => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  const results = [verifiedResult, reviewResult, rejectedResult];
  // Return a random result for demonstration purposes
  return results[Math.floor(Math.random() * results.length)];
};
