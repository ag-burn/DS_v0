'use client';
import * as React from 'react';
import { StepWrapper } from './step-wrapper';
import { Button } from '@/components/ui/button';
import { Camera, Check, Loader2, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

type SelfieCaptureStepProps = {
  onNext: () => void;
  onBack: () => void;
  onConfirm: (image: string) => Promise<{ success: boolean; message: string }>;
};

export function SelfieCaptureStep({ onNext, onBack, onConfirm }: SelfieCaptureStepProps) {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
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
          stream.getTracks().forEach((track) => track.stop());
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
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleCapture = () => {
    const captured = captureSnapshot();
    if (!captured) {
      setError('Unable to capture selfie. Please try again.');
      return;
    }
    setSelfie(captured);
    setError(null);
    setStatus('Selfie captured. Review before confirming.');
  };

  const handleRetake = () => {
    setSelfie(null);
    setStatus(null);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selfie) return;
    setIsSubmitting(true);
    setStatus('Matching your selfie with the ID photo using Gemini...');
    try {
      const result = await onConfirm(selfie);
      if (result.success) {
        setStatus(result.message ?? 'Face match successful.');
        setTimeout(() => {
          onNext();
        }, 900);
      } else {
        setError(result.message ?? 'We could not match your face to the ID.');
        setStatus(null);
      }
    } catch (err) {
      console.error('Error confirming selfie:', err);
      setError('We could not validate the selfie. Please try again.');
      setStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="relative aspect-square max-w-sm mx-auto bg-secondary rounded-full overflow-hidden flex items-center justify-center border-4 border-border">
        {error && !selfie && (
          <div className="text-center text-destructive-foreground p-4">
            <AlertCircle className="mx-auto h-12 w-12" />
            <p className="mt-2">{error}</p>
          </div>
        )}
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
