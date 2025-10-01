const MODEL_NAME = 'gemini-2.5-flash';
const API_ROOT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

export type IdAnalysis = {
  matched: boolean;
  extractedName?: string | null;
  confidence?: number | null;
  reason?: string;
  rawText?: string;
};

export type FaceAnalysis = {
  matched: boolean;
  similarity?: number | null;
  reason?: string;
  rawText?: string;
};

export type LivenessAnalysis = {
  liveness_active: number | null;
  liveness_passive: number | null;
  challenge_direction: string;
  explanations: string[];
  rawText?: string;
};

export type AudioAnalysis = {
  phrase_match: boolean | null;
  transcript?: string | null;
  antispoof?: number | null;
  av_sync?: number | null;
  explanations: string[];
  rawText?: string;
};

let warnedAboutKey = false;

const toBase64 = (dataUrl: string) => {
  const commaIndex = dataUrl.indexOf(',');
  return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
};

const stripCodeFence = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/```json?\s*/i, '').replace(/```$/, '').trim();
  }
  return trimmed;
};

const parseJson = (raw: string) => {
  try {
    return JSON.parse(stripCodeFence(raw));
  } catch (error) {
    console.warn('Failed to parse Gemini response as JSON:', { raw });
    return null;
  }
};

const normalizeScore = (value: unknown) => {
  if (typeof value !== 'number') {
    return undefined;
  }
  if (Number.isNaN(value)) {
    return undefined;
  }
  if (value > 1) {
    return Math.min(value / 100, 1);
  }
  if (value < 0) {
    return 0;
  }
  return value;
};

const pickFirstText = (payload: any): string | null => {
  const candidates = payload?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }
  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return null;
  }
  return parts
    .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
};

const warnIfMissingKey = () => {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY && !warnedAboutKey) {
    warnedAboutKey = true;
    console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not set. Falling back to mocked Gemini responses.');
  }
};

const fallbackIdAnalysis = (expectedName: string): IdAnalysis => ({
  matched: true,
  extractedName: expectedName,
  confidence: 0.88,
  reason: 'Gemini mock: set NEXT_PUBLIC_GEMINI_API_KEY for live responses.',
});

const fallbackFaceAnalysis = (): FaceAnalysis => ({
  matched: true,
  similarity: 0.84,
  reason: 'Gemini mock: set NEXT_PUBLIC_GEMINI_API_KEY for live responses.',
});

const fallbackLivenessAnalysis = (direction: string): LivenessAnalysis => ({
  liveness_active: 0.82,
  liveness_passive: 0.78,
  challenge_direction: direction,
  explanations: ['Gemini mock: set NEXT_PUBLIC_GEMINI_API_KEY for live responses.'],
});

const fallbackAudioAnalysis = (phrase: string): AudioAnalysis => ({
  phrase_match: true,
  transcript: phrase,
  antispoof: 0.82,
  av_sync: 0.8,
  explanations: ['Gemini mock: set NEXT_PUBLIC_GEMINI_API_KEY for live responses.'],
});

export const verifyIdName = async ({
  imageDataUrl,
  expectedName,
}: {
  imageDataUrl: string;
  expectedName: string;
}): Promise<IdAnalysis> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    warnIfMissingKey();
    return fallbackIdAnalysis(expectedName);
  }

  const response = await fetch(`${API_ROOT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are helping with an identity verification flow. Extract the primary full name on this ID. Then compare it to "${expectedName}" and respond strictly with JSON using the shape { "extractedName": string, "match": boolean, "confidence": number (0-1), "reason": string }. Only output valid JSON, no prose.`,
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: toBase64(imageDataUrl),
              },
            },
          ],
        },
      ],
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini ID analysis failed: ${response.statusText} - ${errorText}`);
  }

  const payload = await response.json();
  const text = pickFirstText(payload);
  if (!text) {
    throw new Error('Gemini did not provide a usable response for the ID analysis.');
  }

  const parsed = parseJson(text);
  if (!parsed) {
    return {
      matched: false,
      reason: 'Could not parse Gemini response for ID analysis.',
      rawText: text,
    };
  }

  return {
    matched: Boolean(parsed.match),
    extractedName: typeof parsed.extractedName === 'string' ? parsed.extractedName : undefined,
    confidence: normalizeScore(parsed.confidence),
    reason: typeof parsed.reason === 'string' ? parsed.reason : undefined,
    rawText: text,
  };
};

export const matchFaces = async ({
  idImageDataUrl,
  selfieDataUrl,
}: {
  idImageDataUrl: string;
  selfieDataUrl: string;
}): Promise<FaceAnalysis> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    warnIfMissingKey();
    return fallbackFaceAnalysis();
  }

  const response = await fetch(`${API_ROOT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'You will receive two images: first an ID photo, then a live selfie. Respond strictly with JSON using { "match": boolean, "similarity": number (0-1), "reason": string }. Assess whether they belong to the same person.',
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: toBase64(idImageDataUrl),
              },
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: toBase64(selfieDataUrl),
              },
            },
          ],
        },
      ],
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini face match failed: ${response.statusText} - ${errorText}`);
  }

  const payload = await response.json();
  const text = pickFirstText(payload);
  if (!text) {
    throw new Error('Gemini did not provide a usable response for the face comparison.');
  }

  const parsed = parseJson(text);
  if (!parsed) {
    return {
      matched: false,
      reason: 'Could not parse Gemini response for face comparison.',
      rawText: text,
    };
  }

  return {
    matched: Boolean(parsed.match),
    similarity: normalizeScore(parsed.similarity),
    reason: typeof parsed.reason === 'string' ? parsed.reason : undefined,
    rawText: text,
  };
};

export const assessLiveness = async ({
  frames,
  challengeDirection,
}: {
  frames: string[];
  challengeDirection: string;
}): Promise<LivenessAnalysis> => {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new Error('No frames captured for liveness assessment.');
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    warnIfMissingKey();
    return fallbackLivenessAnalysis(challengeDirection);
  }

  const trimmedFrames = frames.slice(0, 6);

  const response = await fetch(`${API_ROOT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a liveness detection system.\nStep 1: User looked straight.\nStep 2: User was instructed to look ${challengeDirection}.\nProvided: sequential frames during the test.\nTasks:\n1) Did the user follow the challenge?\n2) Do the images look like a real live capture vs spoof/replay?\nReturn ONLY JSON:\n{\n "liveness_active": number,\n "liveness_passive": number,\n "challenge_direction": "${challengeDirection}",\n "explanations": string[]\n}`,
            },
            ...trimmedFrames.map((frame) => ({
              inline_data: {
                mime_type: 'image/jpeg',
                data: toBase64(frame),
              },
            })),
          ],
        },
      ],
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini liveness assessment failed: ${response.statusText} - ${errorText}`);
  }

  const payload = await response.json();
  const text = pickFirstText(payload);
  if (!text) {
    throw new Error('Gemini did not provide a usable response for the liveness assessment.');
  }

  const parsed = parseJson(text);
  if (!parsed) {
    return {
      liveness_active: null,
      liveness_passive: null,
      challenge_direction: challengeDirection,
      explanations: ['Could not parse Gemini response for liveness assessment.'],
      rawText: text,
    };
  }

  const activeScore = normalizeScore(parsed.liveness_active);
  const passiveScore = normalizeScore(parsed.liveness_passive);
  const explanations: string[] = Array.isArray(parsed.explanations)
    ? parsed.explanations.filter((item: unknown): item is string => typeof item === 'string')
    : [];

  return {
    liveness_active: typeof activeScore === 'number' ? activeScore : null,
    liveness_passive: typeof passiveScore === 'number' ? passiveScore : null,
    challenge_direction: typeof parsed.challenge_direction === 'string'
      ? parsed.challenge_direction
      : challengeDirection,
    explanations,
    rawText: text,
  };
};

export const assessAudio = async ({
  audioDataUrl,
  phrase,
  mimeType,
}: {
  audioDataUrl: string;
  phrase: string;
  mimeType: string;
}): Promise<AudioAnalysis> => {
  if (!audioDataUrl) {
    throw new Error('No audio provided for voice verification.');
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    warnIfMissingKey();
    return fallbackAudioAnalysis(phrase);
  }

  const response = await fetch(`${API_ROOT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are verifying an identity using a spoken passphrase.\nPrompt given to user: "${phrase}".\nTasks:\n1) Transcribe the audio.\n2) Decide if the spoken audio matches the prompt (phrase_match).\n3) Estimate anti-spoof score (0-1) for replay/voice conversion detection.\n4) Estimate A/V sync score (0-1) if applicable.\nReturn ONLY JSON:\n{\n "phrase_match": boolean,\n "transcript": string,\n "antispoof": number,\n "av_sync": number,\n "explanations": string[]\n}`,
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: toBase64(audioDataUrl),
              },
            },
          ],
        },
      ],
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini audio assessment failed: ${response.statusText} - ${errorText}`);
  }

  const payload = await response.json();
  const text = pickFirstText(payload);
  if (!text) {
    throw new Error('Gemini did not provide a usable response for the audio assessment.');
  }

  const parsed = parseJson(text);
  if (!parsed) {
    return {
      phrase_match: null,
      transcript: null,
      antispoof: null,
      av_sync: null,
      explanations: ['Could not parse Gemini response for voice verification.'],
      rawText: text,
    };
  }

  const antispoofScore = normalizeScore(parsed.antispoof);
  const avSyncScore = normalizeScore(parsed.av_sync);
  const explanations: string[] = Array.isArray(parsed.explanations)
    ? parsed.explanations.filter((item: unknown): item is string => typeof item === 'string')
    : [];

  return {
    phrase_match: typeof parsed.phrase_match === 'boolean' ? parsed.phrase_match : null,
    transcript: typeof parsed.transcript === 'string' ? parsed.transcript : undefined,
    antispoof: typeof antispoofScore === 'number' ? antispoofScore : null,
    av_sync: typeof avSyncScore === 'number' ? avSyncScore : null,
    explanations,
    rawText: text,
  };
};
