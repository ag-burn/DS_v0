'use client';
import * as React from 'react';
import { StepWrapper } from './step-wrapper';
import { Loader2, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const challenges = [
  'Blink twice',
  'Turn your head slowly to the right',
  'Turn your head to the left',
  'Smile for the camera',
];

type SelfieCaptureStepProps = {
  onNext: () => void;
  onBack: () => void;
  onConfirm: (image: string) => Promise<{ success: boolean; message: string }>;
};

export function SelfieCaptureStep({ onNext, onBack, onConfirm }: SelfieCaptureStepProps) {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentChallenge, setCurrentChallenge] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<string | null>(null);
  const [isSequenceActive, setIsSequenceActive] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selfie, setSelfie] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    async function setupCamera() {
      setLoading(true);
      setError(null);
      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please check permissions and try again.');
      } finally {
        setLoading(false);
      }
    }
    setupCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!isSequenceActive || loading || error) return;

    setCurrentChallenge(0);
    setProgress(0);
    setStatus('Follow the prompts to capture your selfie.');

    let challengeIndex = 0;
    const totalDurationMs = challenges.length * 2500;
    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.min(prev + 100 / (totalDurationMs / 100), 100));
    }, 100);

    const challengeTimer = setInterval(() => {
      challengeIndex += 1;
      if (challengeIndex < challenges.length) {
        setCurrentChallenge(challengeIndex);
      } else {
        clearInterval(challengeTimer);
        clearInterval(progressTimer);
        captureAndConfirm();
      }
    }, 2500);

    return () => {
      clearInterval(challengeTimer);
      clearInterval(progressTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSequenceActive, loading, error]);

  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      return canvas.toDataURL('image/jpeg');
    }
    return null;
  };

  const captureAndConfirm = async () => {
    const captured = captureSnapshot();
    if (!captured) {
      setError('Unable to capture selfie. Please try again.');
      setIsSequenceActive(false);
      setStatus(null);
      return;
    }

    setSelfie(captured);
    setIsSubmitting(true);
    setStatus('Matching your selfie with the ID photo using Gemini...');

    try {
      const result = await onConfirm(captured);
      if (result.success) {
        setStatus(result.message ?? 'Face match successful.');
        setTimeout(() => {
          onNext();
        }, 900);
      } else {
        setError(result.message ?? 'We could not match your face to the ID.');
        setStatus(null);
        setIsSequenceActive(false);
      }
    } catch (err) {
      console.error('Error confirming selfie:', err);
      setError('We could not validate the selfie. Please try again.');
      setStatus(null);
      setIsSequenceActive(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSequence = () => {
    setError(null);
    setStatus(null);
    setProgress(0);
    setSelfie(null);
    setIsSequenceActive(true);
  };

  React.useEffect(() => {
    if (!loading && !error && !isSequenceActive && !selfie) {
      setIsSequenceActive(true);
    }
  }, [loading, error, isSequenceActive, selfie]);

  return (
    <StepWrapper
      title="Liveness & Selfie Capture"
      description="Complete the short liveness sequence. We'll capture a selfie automatically at the end."
      onBack={onBack}
      footerContent={status ? (
        <div className="flex items-center gap-2 text-sm text-foreground/80">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>{status}</span>
        </div>
      ) : undefined}
    >
      <div className="relative aspect-square max-w-sm mx-auto bg-secondary rounded-full overflow-hidden flex items-center justify-center border-4 border-border">
        {error && (
          <div className="text-center text-destructive-foreground p-4">
            <AlertCircle className="mx-auto h-12 w-12" />
            <p className="mt-2">{error}</p>
            <Button onClick={resetSequence} variant="outline" size="sm" className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        )}
        {loading && !error && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover scale-x-[-1] ${loading || error ? 'hidden' : 'block'}`}
          onCanPlay={() => setLoading(false)}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-6 text-center min-h-[6rem] flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-headline font-medium text-accent animate-in fade-in duration-500">
          {error ? 'Sequence interrupted' : challenges[currentChallenge]}
        </p>
        <Progress value={progress} className="w-1/2 mx-auto mt-2 h-2" />
        {isSubmitting && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>

      {selfie && !error && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground text-center mb-2">Captured selfie preview</p>
          <img src={selfie} alt="Captured selfie" className="mx-auto h-32 w-32 rounded-full object-cover border-4 border-primary/30" />
        </div>
      )}

    </StepWrapper>
  );
}
