'use client';
import * as React from 'react';
import { StepWrapper } from './step-wrapper';
import { Button } from '@/components/ui/button';
import { Camera, Check, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { StepErrorPanel } from './step-error-panel';

type SelfieCaptureStepProps = {
  onBack: () => void;
  onConfirm: (image: string) => Promise<{ success: boolean; message: string }>;
  onVerified: (message: string) => void;
};

export function SelfieCaptureStep({ onBack, onConfirm, onVerified }: SelfieCaptureStepProps) {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [errorContext, setErrorContext] = React.useState<'camera' | 'capture' | 'verification' | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selfie, setSelfie] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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
      setError('Could not access camera. Please check permissions and try again.');
      setErrorContext('camera');
    } finally {
      setLoading(false);
    }
  }, [stream]);

  React.useEffect(() => {
    initializeCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureSnapshot = React.useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      return canvas.toDataURL('image/jpeg');
    }
    return null;
  }, []);

  const handleCapture = React.useCallback(() => {
    const captured = captureSnapshot();
    if (!captured) {
      setError('Unable to capture selfie. Please try again.');
      setErrorContext('capture');
      return;
    }
    setSelfie(captured);
    setError(null);
    setErrorContext(null);
    setStatus('Selfie captured. Review before confirming.');
  }, [captureSnapshot]);

  const handleRetake = React.useCallback(() => {
    setSelfie(null);
    setStatus(null);
    setError(null);
    setErrorContext(null);
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (!selfie) return;
    setIsSubmitting(true);
    setStatus('Matching your selfie with the ID photo using Gemini...');
    try {
      const result = await onConfirm(selfie);
      if (result.success) {
        const successMessage = result.message ?? 'Face match successful.';
        setIsSubmitting(false);
        onVerified(successMessage);
        return;
      }
      setError(result.message ?? 'We could not match your face to the ID.');
      setErrorContext('verification');
      setStatus(null);
    } catch (err) {
      console.error('Error confirming selfie:', err);
      setError('We could not validate the selfie. Please try again.');
      setErrorContext('verification');
      setStatus(null);
    }
    setIsSubmitting(false);
  }, [onConfirm, onVerified, selfie]);

  const errorActions = React.useMemo(() => {
    if (!error) return null;
    if (errorContext === 'camera' || errorContext === 'capture') {
      return [
        { label: 'Retry Camera', onClick: initializeCamera, variant: 'destructive' as const },
        { label: 'Go Back', onClick: onBack, variant: 'outline' as const },
      ];
    }
    return [
      { label: 'Retake Selfie', onClick: handleRetake, variant: 'secondary' as const },
      { label: 'Go Back', onClick: onBack, variant: 'outline' as const },
    ];
  }, [error, errorContext, handleRetake, initializeCamera, onBack]);

  return (
    <StepWrapper
      title="Capture Your Selfie"
      description="Position yourself in frame and capture a clear selfie to match against your ID."
      onNext={handleConfirm}
      onBack={onBack}
      isNextDisabled={!selfie || isSubmitting}
      nextText={isSubmitting ? 'Verifying...' : 'Confirm & Continue'}
      isLoading={isSubmitting}
      footerContent={status ? (
        <div className="flex items-center gap-2 text-sm text-foreground/80">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>{status}</span>
        </div>
      ) : undefined}
    >
      {error && errorActions && (
        <StepErrorPanel
          title="We ran into a problem"
          message={error}
          actions={errorActions}
        />
      )}
      <div className="relative aspect-square max-w-sm mx-auto bg-secondary rounded-full overflow-hidden flex items-center justify-center border-4 border-border">
        {loading && !error && !selfie && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}

        {!selfie && !loading && !error && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
            onCanPlay={() => setLoading(false)}
          />
        )}
        {selfie && <img src={selfie} alt="Captured selfie" className="w-full h-full object-cover" />}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-6 flex justify-center gap-4">
        {!selfie ? (
          <Button onClick={handleCapture} disabled={loading || !!error} size="lg" className="w-40">
            <Camera className="mr-2 h-5 w-5" />
            Capture
          </Button>
        ) : (
          <>
            <Button onClick={handleRetake} variant="outline" size="lg" className="w-40" disabled={isSubmitting}>
              <RefreshCw className="mr-2 h-5 w-5" />
              Retake
            </Button>
            <Button onClick={handleConfirm} size="lg" className="w-40 bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              <Check className="mr-2 h-5 w-5" />
              Confirm
            </Button>
          </>
        )}
      </div>

      {selfie && !error && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          Make sure your face is well lit and not obstructed before confirming.
        </p>
      )}
    </StepWrapper>
  );
}
