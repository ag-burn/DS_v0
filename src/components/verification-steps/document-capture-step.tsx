'use client';
import * as React from 'react';
import { StepWrapper } from './step-wrapper';
import { Button } from '@/components/ui/button';
import { Camera, Check, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

type CaptureMode = 'front' | 'back';

export function DocumentCaptureStep({ onNext, onBack }: { onNext: () => void; onBack: () => void; }) {
  const [mode, setMode] = React.useState<CaptureMode>('front');
  const [frontImage, setFrontImage] = React.useState<string | null>(null);
  const [backImage, setBackImage] = React.useState<string | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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

  const currentImage = mode === 'front' ? frontImage : backImage;

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      if (mode === 'front') {
        setFrontImage(dataUrl);
      } else {
        setBackImage(dataUrl);
      }
    }
  };

  const retakeImage = () => {
    if (mode === 'front') {
      setFrontImage(null);
    } else {
      setBackImage(null);
    }
  };

  const confirmImage = () => {
    if (mode === 'front') {
      setMode('back');
    } else {
      onNext();
    }
  };

  const description = mode === 'front' 
    ? 'Position the front of your ID card within the frame.'
    : 'Now, position the back of your ID card within the frame.';

  return (
    <StepWrapper
      title="Scan Your ID Document"
      description={description}
      onNext={confirmImage}
      onBack={mode === 'front' ? onBack : () => { setMode('front'); setBackImage(null); }}
      isNextDisabled={!currentImage}
      nextText={mode === 'front' ? 'Confirm Front' : 'Confirm Back & Continue'}
    >
      <div className="relative aspect-video w-full bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
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
          className={`w-full h-full object-cover ${currentImage || loading || error ? 'hidden' : 'block'}`}
          onCanPlay={() => setLoading(false)}
        />
        {currentImage && <img src={currentImage} alt={`${mode} of ID`} className="w-full h-full object-contain" />}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-6 flex justify-center gap-4">
        {!currentImage ? (
          <Button onClick={captureImage} disabled={loading || !!error} size="lg" className="w-40">
            <Camera className="mr-2 h-5 w-5" />
            Capture
          </Button>
        ) : (
          <>
            <Button onClick={retakeImage} variant="outline" size="lg" className="w-40">
              <RefreshCw className="mr-2 h-5 w-5" />
              Retake
            </Button>
            <Button onClick={confirmImage} size="lg" className="w-40 bg-green-600 hover:bg-green-700">
              <Check className="mr-2 h-5 w-5" />
              Confirm
            </Button>
          </>
        )}
      </div>
    </StepWrapper>
  );
}
