'use client';

import * as React from 'react';
import { StepWrapper } from './step-wrapper';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Check, Loader2, RefreshCw } from 'lucide-react';
import { StepErrorPanel } from './step-error-panel';
import { assessAudio, type AudioAnalysis } from '@/lib/gemini';

const PASSPHRASES = [
  'My voice unlocks secure access today.',
  'Deepfakes cannot imitate my real voice.',
  'Secure gateways open when I speak truly.',
  'Authenticity is confirmed with my spoken phrase.',
  'Biometrics verify me beyond any doubt.',
  'Synthetic voices fail where humans prevail.',
  'I hereby confirm my identity vocally.',
  'Trust my voice to safeguard this session.',
  'This spoken code resists spoofing attempts.',
  'Audio verification keeps imposters away.',
  'Real users adapt, synthetic voices lag.',
  'Sound the phrase to prove I am present.',
];

type AudioCaptureStepProps = {
  onBack: () => void;
  onComplete: (analysis: AudioAnalysis) => void;
};

export function AudioCaptureStep({ onBack, onComplete }: AudioCaptureStepProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioDataUrl, setAudioDataUrl] = React.useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [errorContext, setErrorContext] = React.useState<'setup' | 'recording' | 'processing' | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [phrase, setPhrase] = React.useState(() => PASSPHRASES[Math.floor(Math.random() * PASSPHRASES.length)]);

  const setupMic = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorContext(null);
    setAudioBlob(null);
    setAudioDataUrl(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Audio recording is not supported on this browser.');
        setErrorContext('setup');
        return;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.onstart = () => {
        chunks.length = 0;
      };
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        setIsRecording(false);
        if (chunks.length === 0) {
          setAudioBlob(null);
          setAudioDataUrl(null);
          setStatus(null);
          return;
        }
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = typeof reader.result === 'string' ? reader.result : null;
          setAudioDataUrl(result);
          setStatus('Recording captured. Review the result and submit.');
        };
        reader.onerror = () => {
          setError('We could not process the recording. Please try again.');
          setErrorContext('recording');
          setAudioDataUrl(null);
        };
        reader.readAsDataURL(blob);
      };
      setMediaRecorder(recorder);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions and try again.');
      setErrorContext('setup');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setupMic();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [setupMic]);

  const toggleRecording = React.useCallback(() => {
    if (!mediaRecorder) {
      setError('Recorder is not ready. Try setting up your microphone again.');
      setErrorContext('setup');
      return;
    }
    if (isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      setAudioBlob(null);
      setAudioDataUrl(null);
      setStatus('Recording...');
      try {
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Unable to start recording:', err);
        setError('We could not start recording. Please retry microphone setup.');
        setErrorContext('recording');
        setIsRecording(false);
        setStatus(null);
      }
    }
  }, [isRecording, mediaRecorder]);

  const errorActions = React.useMemo(() => {
    if (!error) return null;
    if (errorContext === 'setup') {
      return [
        { label: 'Retry Microphone', onClick: setupMic, variant: 'destructive' as const },
        { label: 'Go Back', onClick: onBack, variant: 'outline' as const },
      ];
    }
    if (errorContext === 'recording') {
      return [
        { label: 'Try Again', onClick: () => { setError(null); setErrorContext(null); toggleRecording(); }, variant: 'secondary' as const },
        { label: 'Retry Microphone', onClick: setupMic, variant: 'outline' as const },
      ];
    }
    return [
      { label: 'Try Again', onClick: () => {
          setError(null);
          setErrorContext(null);
          setStatus(null);
          setIsSubmitting(false);
        }, variant: 'secondary' as const },
      { label: 'Go Back', onClick: onBack, variant: 'outline' as const },
    ];
  }, [error, errorContext, onBack, setupMic, toggleRecording]);

  const regeneratePhrase = () => {
    if (isRecording || isSubmitting) {
      return;
    }
    const remaining = PASSPHRASES.filter((candidate) => candidate !== phrase);
    const next = remaining[Math.floor(Math.random() * remaining.length)] ?? phrase;
    setPhrase(next);
    setAudioBlob(null);
    setAudioDataUrl(null);
    setStatus(null);
    setError(null);
    setErrorContext(null);
  };

  const handleSubmit = async () => {
    if (!audioDataUrl || !audioBlob) {
      setError('Please record the phrase before submitting.');
      setErrorContext('recording');
      return;
    }
    setIsSubmitting(true);
    setStatus('Validating your voice sample with Gemini...');
    setError(null);
    setErrorContext(null);
    try {
      const analysis = await assessAudio({
        audioDataUrl,
        phrase,
        mimeType: audioBlob.type || 'audio/webm',
      });
      setStatus('Voice verification complete.');
      setTimeout(() => {
        onComplete(analysis);
      }, 400);
    } catch (err) {
      console.error('Audio assessment failed:', err);
      setError(
        err instanceof Error ? err.message : 'We could not verify the recording. Please try again.'
      );
      setErrorContext('processing');
      setIsSubmitting(false);
      setStatus(null);
    }
  };

  return (
    <StepWrapper
      title="Voice Verification"
      description="Please read the following phrase out loud."
      onNext={handleSubmit}
      onBack={onBack}
      isNextDisabled={!audioDataUrl || isRecording || isSubmitting}
      nextText={isSubmitting ? 'Submitting...' : 'Submit Verification'}
      footerContent={isSubmitting && status && !error ? (
        <div className="text-sm text-foreground/80 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>{status}</span>
        </div>
      ) : undefined}
    >
      <div className="text-center p-8 border-dashed border-2 rounded-lg bg-secondary/30 space-y-4">
        <p className="text-2xl font-headline font-medium text-foreground">"{phrase}"</p>
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={regeneratePhrase} disabled={isRecording || isSubmitting}>
            <RefreshCw className="mr-2 h-4 w-4" /> Try another phrase
          </Button>
        </div>
      </div>

      {error && errorActions && (
        <StepErrorPanel
          title="Voice verification issue"
          message={error}
          actions={errorActions}
        />
      )}

      {loading && <div className="flex justify-center items-center mt-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
      
      {!loading && !error && (
        <div className="mt-8 flex flex-col items-center gap-4">
            <Button
              onClick={toggleRecording}
              size="lg"
              className={`w-48 ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`}
              disabled={loading || isSubmitting}
            >
            {isRecording ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            {audioBlob && (
            <div className="flex items-center gap-2 text-green-500 animate-in fade-in">
                <Check />
                <p>Recording complete. You can now submit.</p>
            </div>
            )}
            {status && !isRecording && !isSubmitting && (
              <p className="text-sm text-muted-foreground text-center max-w-sm">{status}</p>
            )}
        </div>
      )}

    </StepWrapper>
  );
}
