'use client';
import * as React from 'react';
import { StepWrapper } from './step-wrapper';
import { Button } from '@/components/ui/button';
import { Camera, Check, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { StepErrorPanel } from './step-error-panel';

type DocumentCaptureStepProps = {
  onBack: () => void;
  onConfirm: (image: string) => Promise<{ success: boolean; message: string; extractedName?: string }>;
  onVerified: (message: string) => void;
};

export function DocumentCaptureStep({ onBack, onConfirm, onVerified }: DocumentCaptureStepProps) {
  const [image, setImage] = React.useState<string | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [errorContext, setErrorContext] = React.useState<'camera' | 'verification' | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const initializeCamera = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorContext(null);
    try {
      stream?.getTracks().forEach((track) => track.stop());
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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

  const captureImage = React.useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImage(dataUrl);
      setStatus(null);
      setError(null);
      setErrorContext(null);
    }
  }, []);

  const retakeImage = React.useCallback(() => {
    setImage(null);
    setStatus(null);
    setError(null);
    setErrorContext(null);
  }, []);

  const confirmImage = React.useCallback(async () => {
    if (!image) return;
    setIsSubmitting(true);
    setStatus('Checking ID details with Gemini...');
    try {
      const result = await onConfirm(image);
      if (result.success) {
        const successMessage = result.message ?? 'ID details look good.';
        setIsSubmitting(false);
        onVerified(successMessage);
        return;
      }
      setError(result.message);
      setErrorContext('verification');
      setStatus(null);
    } catch (err) {
      console.error('Error confirming ID:', err);
      setError('We could not verify the ID. Please try again.');
      setErrorContext('verification');
      setStatus(null);
    }
    setIsSubmitting(false);
  }, [image, onConfirm, onVerified]);

  const errorActions = React.useMemo(() => {
    if (!error) return null;
    if (errorContext === 'camera') {
      return [
        { label: 'Retry Camera', onClick: initializeCamera, variant: 'destructive' as const },
        { label: 'Go Back', onClick: onBack, variant: 'outline' as const },
      ];
    }
    return [
      { label: 'Retake ID Photo', onClick: retakeImage, variant: 'secondary' as const },
      { label: 'Go Back', onClick: onBack, variant: 'outline' as const },
    ];
  }, [error, errorContext, initializeCamera, onBack, retakeImage]);

  return (
    <StepWrapper
      title="Scan the Front of Your ID"
      description="Align the front of your government-issued ID within the frame and capture a clear photo."
      onNext={confirmImage}
      onBack={onBack}
      isNextDisabled={!image || isSubmitting}
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
      <div className="relative aspect-video w-full bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
        {loading && !error && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${image || loading || error ? 'hidden' : 'block'}`}
          onCanPlay={() => setLoading(false)}
        />
        {image && <img src={image} alt="Front of ID" className="w-full h-full object-contain" />}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-6 flex justify-center gap-4">
        {!image ? (
          <Button onClick={captureImage} disabled={loading || !!error} size="lg" className="w-40">
            <Camera className="mr-2 h-5 w-5" />
            Capture
          </Button>
        ) : (
          <>
            <Button onClick={retakeImage} variant="outline" size="lg" className="w-40" disabled={isSubmitting}>
              <RefreshCw className="mr-2 h-5 w-5" />
              Retake
            </Button>
            <Button onClick={confirmImage} size="lg" className="w-40 bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              <Check className="mr-2 h-5 w-5" />
              Confirm
            </Button>
          </>
        )}
      </div>
    </StepWrapper>
  );
}
