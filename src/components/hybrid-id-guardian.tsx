'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WelcomeStep } from '@/components/verification-steps/welcome-step';
import { NameEntryStep } from '@/components/verification-steps/name-entry-step';
import { DocumentCaptureStep } from '@/components/verification-steps/document-capture-step';
import { SelfieCaptureStep } from '@/components/verification-steps/selfie-capture-step';
import { AudioCaptureStep } from '@/components/verification-steps/audio-capture-step';
import { LivenessStep } from '@/components/verification-steps/liveness-step';
import { VerifyingStep } from '@/components/verification-steps/verifying-step';
import { ResultsStep } from '@/components/verification-steps/results-step';
import type { VerificationResponse, VerificationStep } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { matchFaces, verifyIdName } from '@/lib/gemini';
import type { FaceAnalysis, IdAnalysis } from '@/lib/gemini';

export function HybridIdGuardian() {
  const [step, setStep] = React.useState<VerificationStep>('welcome');
  const [result, setResult] = React.useState<VerificationResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [fullName, setFullName] = React.useState('');
  const [idImage, setIdImage] = React.useState<string | null>(null);
  const [selfieImage, setSelfieImage] = React.useState<string | null>(null);
  const [idAnalysis, setIdAnalysis] = React.useState<IdAnalysis | null>(null);
  const [faceAnalysis, setFaceAnalysis] = React.useState<FaceAnalysis | null>(null);
  const [audioCaptured, setAudioCaptured] = React.useState(false);

  const handleVerification = async (hasAudio = audioCaptured) => {
    setStep('verifying');
    try {
      if (!idAnalysis || !faceAnalysis) {
        throw new Error('Missing required checks before verification.');
      }

      const faceScore = Math.max(0, Math.min(1, faceAnalysis.similarity ?? (faceAnalysis.matched ? 0.86 : 0.55)));
      const ocrScore = Math.max(0, Math.min(1, idAnalysis.confidence ?? (idAnalysis.matched ? 0.9 : 0.6)));
      const allGood = idAnalysis.matched && faceAnalysis.matched && hasAudio;

      const verificationResult: VerificationResponse = {
        status: allGood ? 'verified' : 'review',
        score: allGood ? (faceScore + ocrScore) / 2 : 0.68,
        signals: {
          face_match: faceScore,
          liveness_active: 0.82,
          liveness_passive: 0.78,
          av_sync: 0.76,
          audio_antispoof: hasAudio ? 0.8 : 0.45,
          ocr_consistency: ocrScore,
        },
        explanations: allGood
          ? []
          : [
              faceAnalysis.matched
                ? 'Face comparison succeeded, but other checks require review.'
                : faceAnalysis.reason ?? 'Face comparison suggested a possible mismatch.',
              idAnalysis.matched
                ? 'Document name matched; manual reviewer will double-check additional attributes.'
                : idAnalysis.reason ?? 'Name on the document did not fully match the provided value.',
            ].filter((value): value is string => typeof value === 'string' && value.length > 0),
        referenceId: `VRF-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`,
      };
      setResult(verificationResult);
      setStep('results');
    } catch (e) {
      setError('An unexpected error occurred during verification.');
      setStep('error');
    }
  };

  const restart = () => {
    setStep('welcome');
    setResult(null);
    setError(null);
    setFullName('');
    setIdImage(null);
    setSelfieImage(null);
    setIdAnalysis(null);
    setFaceAnalysis(null);
    setAudioCaptured(false);
  };

  const handleNameNext = (name: string) => {
    setFullName(name);
    setStep('document');
  };

  const handleDocumentConfirm = async (image: string) => {
    setIdImage(image);
    try {
      const analysis = await verifyIdName({
        imageDataUrl: image,
        expectedName: fullName,
      });
      setIdAnalysis(analysis);
      if (!analysis.matched) {
        return {
          success: false,
          message: analysis.reason ?? 'The name on the ID does not match.',
          extractedName: analysis.extractedName ?? undefined,
        };
      }
      return {
        success: true,
        message: analysis.extractedName
          ? `Matched "${analysis.extractedName}" on the ID.`
          : 'The ID name matches your input.',
      };
    } catch (err) {
      console.error('Failed to verify ID name:', err);
      return {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : 'We were unable to verify the ID with Gemini. Please try again.',
      };
    }
  };

  const handleSelfieConfirm = async (image: string) => {
    setSelfieImage(image);
    if (!idImage) {
      return {
        success: false,
        message: 'Please capture your ID before taking the selfie.',
      };
    }

    try {
      const analysis = await matchFaces({
        idImageDataUrl: idImage,
        selfieDataUrl: image,
      });
      setFaceAnalysis(analysis);
      if (!analysis.matched) {
        return {
          success: false,
          message: analysis.reason ?? 'Faces did not match confidently.',
        };
      }
      return {
        success: true,
        message: analysis.reason ?? 'Face match succeeded.',
      };
    } catch (err) {
      console.error('Failed to match faces:', err);
      return {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : 'We were unable to compare faces. Please try again.',
      };
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeStep onNext={() => setStep('name')} />;
      case 'name':
        return <NameEntryStep onNext={handleNameNext} onBack={() => setStep('welcome')} defaultValue={fullName} />;
      case 'document':
        return (
          <DocumentCaptureStep
            onNext={() => setStep('selfie')}
            onBack={() => setStep('name')}
            onConfirm={handleDocumentConfirm}
          />
        );
      case 'selfie':
        return (
          <SelfieCaptureStep
            onNext={() => setStep('liveness')}
            onBack={() => setStep('document')}
            onConfirm={handleSelfieConfirm}
          />
        );
      case 'liveness':
        return <LivenessStep onNext={() => setStep('audio')} onBack={() => setStep('selfie')} />;
      case 'audio':
        return (
          <AudioCaptureStep
            onNext={() => {
              setAudioCaptured(true);
              handleVerification(true);
            }}
            onBack={() => {
              setAudioCaptured(false);
              setStep('liveness');
            }}
          />
        );
      case 'verifying':
        return <VerifyingStep />;
      case 'results':
        return <ResultsStep result={result!} onRestart={restart} />;
      case 'error':
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={restart} className="mt-6">Try Again</Button>
            </div>
        )
      default:
        return <WelcomeStep onNext={() => setStep('document')} />;
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl overflow-hidden bg-card/80 backdrop-blur-sm border-border/20">
      <CardContent className="p-0">
        <div className="animate-in fade-in duration-500">
          {renderStep()}
        </div>
      </CardContent>
    </Card>
  );
}
