'use client';

import * as React from 'react';
import { StepWrapper } from './step-wrapper';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Check, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AudioCaptureStep({ onNext, onBack }: { onNext: () => void; onBack: () => void; }) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function setupMic() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          setMediaRecorder(recorder);
          
          recorder.ondataavailable = (e) => {
            setAudioBlob(e.data);
          };
        } catch (err) {
          console.error("Error accessing microphone:", err);
          setError("Could not access microphone. Please check permissions and try again.");
        } finally {
            setLoading(false);
        }
      } else {
        setError("Audio recording is not supported on this browser.");
        setLoading(false);
      }
    }
    setupMic();
    
    return () => {
        mediaRecorder?.stream.getTracks().forEach(track => track.stop());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorder?.stop();
      setIsRecording(false);
    } else {
      setAudioBlob(null);
      mediaRecorder?.start();
      setIsRecording(true);
    }
  };

  const phraseToRead = "My voice is my password, and I am verifying my identity.";

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

      {error && (
        <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4"/>
            <AlertTitle>Microphone Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
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
