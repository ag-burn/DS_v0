'use client';
import * as React from 'react';
import { StepWrapper } from './step-wrapper';
import { Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const challenges = [
  'Blink your eyes',
  'Turn your head slowly to the right',
  'Now, turn your head to the left',
  'Nod your head',
];

export function SelfieCaptureStep({ onNext, onBack }: { onNext: () => void; onBack: () => void; }) {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentChallenge, setCurrentChallenge] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  
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
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions and try again.");
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
    if (loading || error) return;

    const challengeTimer = setInterval(() => {
      setCurrentChallenge(prev => {
        if (prev < challenges.length -1) {
          return prev + 1;
        }
        clearInterval(challengeTimer);
        clearInterval(progressTimer);
        setTimeout(onNext, 500);
        return prev;
      });
    }, 2500);

    const progressTimer = setInterval(() => {
        setProgress(p => p + 100 / (challenges.length * 2.5));
    }, 100);

    return () => {
      clearInterval(challengeTimer);
      clearInterval(progressTimer);
    };
  }, [loading, error, onNext]);

  return (
    <StepWrapper
      title="Liveness Check"
      description="Follow the instructions on screen to confirm you're a real person."
      onBack={onBack}
    >
      <div className="relative aspect-square max-w-sm mx-auto bg-secondary rounded-full overflow-hidden flex items-center justify-center border-4 border-border">
        {error && (
            <div className="text-center text-destructive-foreground p-4">
                <AlertCircle className="mx-auto h-12 w-12" />
                <p className="mt-2">{error}</p>
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
      </div>

      <div className="mt-6 text-center h-16 flex flex-col items-center justify-center">
        <p className="text-xl font-headline font-medium text-accent animate-in fade-in duration-500">
            {challenges[currentChallenge]}
        </p>
        <Progress value={progress} className="w-1/2 mx-auto mt-4 h-2" />
      </div>

    </StepWrapper>
  );
}
