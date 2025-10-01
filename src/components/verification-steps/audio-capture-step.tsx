'use client';

import * as React from 'react';
import { StepWrapper } from './step-wrapper';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Check, Loader2 } from 'lucide-react';
import { StepErrorPanel } from './step-error-panel';

export function AudioCaptureStep({ onNext, onBack }: { onNext: () => void; onBack: () => void; }) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const streamRef = React.useRef<MediaStream | null>(null);

  const setupMic = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setAudioBlob(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Audio recording is not supported on this browser.');
        return;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        setAudioBlob(event.data);
      };
      setMediaRecorder(recorder);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setupMic();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRecording = () => {
    if (!mediaRecorder) {
      setError('Recorder is not ready. Try setting up your microphone again.');
      return;
    }
    if (isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      setAudioBlob(null);
      try {
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Unable to start recording:', err);
        setError('We could not start recording. Please retry microphone setup.');
        setIsRecording(false);
      }
    }
  };

  const phraseToRead = "My voice is my password, and I am verifying my identity.";

  const errorActions = React.useMemo(() => {
    if (!error) return null;
    return [
      { label: 'Retry Microphone', onClick: setupMic, variant: 'destructive' as const },
      { label: 'Go Back', onClick: onBack, variant: 'outline' as const },
    ];
  }, [error, onBack, setupMic]);

  return (
    <StepWrapper
      title="Voice Verification"
      description="Please read the following phrase out loud."
      onNext={onNext}
      onBack={onBack}
      isNextDisabled={!audioBlob}
      nextText="Submit Verification"
    >
      <div className="text-center p-8 border-dashed border-2 rounded-lg bg-secondary/30">
        <p className="text-2xl font-headline font-medium text-foreground">"{phraseToRead}"</p>
      </div>

      {error && errorActions && (
        <StepErrorPanel
          title="We couldn't access your microphone"
          message={error}
          actions={errorActions}
        />
      )}

      {loading && <div className="flex justify-center items-center mt-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
      
      {!loading && !error && (
        <div className="mt-8 flex flex-col items-center gap-4">
            <Button onClick={toggleRecording} size="lg" className={`w-48 ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`}>
            {isRecording ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            {audioBlob && (
            <div className="flex items-center gap-2 text-green-500 animate-in fade-in">
                <Check />
                <p>Recording complete. You can now submit.</p>
            </div>
            )}
        </div>
      )}

    </StepWrapper>
  );
}
