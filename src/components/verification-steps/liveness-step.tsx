'use client';

import * as React from 'react';
import { StepWrapper } from './step-wrapper';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUp, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StepErrorPanel, type StepErrorAction } from './step-error-panel';
import type { LivenessAnalysis } from '@/lib/gemini';
import { assessLiveness } from '@/lib/gemini';

type DirectionChallenge = { key: string; label: string; Icon: LucideIcon };

const DIRECTIONS: DirectionChallenge[] = [
  { key: 'up', label: 'Look up', Icon: ArrowUp },
  { key: 'left', label: 'Look left', Icon: ArrowLeft },
  { key: 'right', label: 'Look right', Icon: ArrowRight },
];

type SequencePhase = 'idle' | 'look-straight' | 'challenge' | 'processing' | 'complete';

type LivenessStepProps = {
  onBack: () => void;
  onComplete: (analysis: LivenessAnalysis) => void;
};

export function LivenessStep({ onBack, onComplete }: LivenessStepProps) {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [errorContext, setErrorContext] = React.useState<'camera' | 'processing' | null>(null);
  const [phase, setPhase] = React.useState<SequencePhase>('idle');
  const [challenge, setChallenge] = React.useState<DirectionChallenge>(DIRECTIONS[0]);
  const [status, setStatus] = React.useState<string | null>(null);
  const [, setFrames] = React.useState<string[]>([]);
  const framesRef = React.useRef<string[]>([]);
  const lastChallengeRef = React.useRef<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const sequenceTimeouts = React.useRef<number[]>([]);

  const clearSequenceTimers = React.useCallback(() => {
    sequenceTimeouts.current.forEach((id) => window.clearTimeout(id));
    sequenceTimeouts.current = [];
  }, []);

  const initializeCamera = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorContext(null);
    try {
      stream?.getTracks().forEach((track) => track.stop());
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please check your permissions and try again.');
      setErrorContext('camera');
    } finally {
      setLoading(false);
    }
  }, [stream]);

  React.useEffect(() => {
    initializeCamera();
    return () => {
      clearSequenceTimers();
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureFrame = React.useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setFrames((prev) => {
      const next = prev.length >= 6 ? [...prev.slice(1), dataUrl] : [...prev, dataUrl];
      framesRef.current = next;
      return next;
    });
  }, []);

  const resetState = React.useCallback(() => {
    clearSequenceTimers();
    setPhase('idle');
    setStatus(null);
    framesRef.current = [];
    setFrames([]);
    setError(null);
    setErrorContext(null);
    lastChallengeRef.current = null;
  }, [clearSequenceTimers]);

  const processLiveness = React.useCallback(async (directionKey: string, directionLabel: string, capturedFrames: string[]) => {
    setPhase('processing');
    setStatus('Analyzing liveness with Gemini...');
    try {
      const analysis = await assessLiveness({ frames: capturedFrames, challengeDirection: directionKey });
      setPhase('complete');
      setStatus('Liveness confirmed.');
      onComplete(analysis);
    } catch (err) {
      console.error('Liveness assessment failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'We could not verify liveness. Please try again.'
      );
      setErrorContext('processing');
      setPhase('idle');
      setStatus(null);
    }
  }, [onComplete]);

  const startSequence = React.useCallback(() => {
    if (loading || error) {
      return;
    }
    clearSequenceTimers();
    const availableDirections = DIRECTIONS.filter((direction) => direction.key !== lastChallengeRef.current);
    const pool = availableDirections.length > 0 ? availableDirections : DIRECTIONS;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    lastChallengeRef.current = selected.key;
    setChallenge(selected);
    framesRef.current = [];
    setFrames([]);
    setPhase('look-straight');
    setStatus('Look straight at the camera.');

    const timers: number[] = [];

    timers.push(
      window.setTimeout(() => {
        captureFrame();
      }, 400)
    );

    timers.push(
      window.setTimeout(() => {
        setPhase('challenge');
        setStatus(selected.label);
        captureFrame();
      }, 1800)
    );

    const challengeCaptures = 4;
    for (let i = 0; i < challengeCaptures; i += 1) {
      timers.push(
        window.setTimeout(() => {
          captureFrame();
        }, 2000 + i * 450)
      );
    }

    timers.push(
      window.setTimeout(() => {
        captureFrame();
        const captured = framesRef.current.slice(-6);
        if (captured.length === 0) {
          setError('We could not capture frames for the liveness check. Please try again.');
          setErrorContext('processing');
          setPhase('idle');
          setStatus(null);
          return;
        }
        processLiveness(selected.key, selected.label, captured);
      }, 2000 + challengeCaptures * 450 + 400)
    );

    sequenceTimeouts.current = timers;
  }, [captureFrame, clearSequenceTimers, error, loading, processLiveness]);

  React.useEffect(() => {
    return () => {
      clearSequenceTimers();
    };
  }, [clearSequenceTimers]);

  const errorActions = React.useMemo<StepErrorAction[] | null>(() => {
    if (!error) return null;
    if (errorContext === 'camera') {
      return [
        { label: 'Retry Camera', onClick: initializeCamera, variant: 'destructive' },
        { label: 'Go Back', onClick: onBack, variant: 'outline' },
      ];
    }
    return [
      { label: 'Try Again', onClick: resetState, variant: 'secondary' },
      { label: 'Go Back', onClick: onBack, variant: 'outline' },
    ];
  }, [error, errorContext, initializeCamera, onBack, resetState]);

  const currentPrompt = React.useMemo(() => {
    switch (phase) {
      case 'look-straight':
        return 'Keep looking straight';
      case 'challenge':
        return challenge.label;
      case 'processing':
        return 'Hold still while we analyze the captures';
      case 'complete':
        return 'Liveness check complete';
      default:
        return 'When ready, start the liveness check';
    }
  }, [challenge.label, phase]);

  return (
    <StepWrapper
      title="Liveness Check"
      description="Follow the prompts so we can confirm you are a real person."
      onBack={() => {
        clearSequenceTimers();
        onBack();
      }}
      footerContent={status ? (
        <div className="flex items-center gap-2 text-sm text-foreground/80">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>{status}</span>
        </div>
      ) : undefined}
    >
      {error && errorActions && (
        <StepErrorPanel
          title="Liveness check failed"
          message={error}
          actions={errorActions}
        />
      )}
      <div className="flex flex-col items-center gap-6">
        <div className="relative aspect-square max-w-sm w-full bg-secondary rounded-full overflow-hidden flex items-center justify-center border-4 border-border">
          {loading && !error && (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          )}
          {!loading && !error && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="text-center space-y-3">
          <p className="text-lg font-medium text-accent">{currentPrompt}</p>
          {phase === 'challenge' && (
            <div className="flex flex-col items-center gap-2">
              <challenge.Icon className="h-12 w-12 text-primary" />
              <span className="text-sm text-muted-foreground">Follow the arrow smoothly.</span>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={resetState} disabled={phase === 'processing'}>
            Reset
          </Button>
          <Button
            onClick={startSequence}
            disabled={
              loading ||
              Boolean(error) ||
              phase === 'processing' ||
              phase === 'look-straight' ||
              phase === 'challenge'
            }
          >
            {phase === 'processing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Start'
            )}
          </Button>
        </div>
      </div>
    </StepWrapper>
  );
}
