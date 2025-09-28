'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WelcomeStep } from '@/components/verification-steps/welcome-step';
import { DocumentCaptureStep } from '@/components/verification-steps/document-capture-step';
import { SelfieCaptureStep } from '@/components/verification-steps/selfie-capture-step';
import { AudioCaptureStep } from '@/components/verification-steps/audio-capture-step';
import { VerifyingStep } from '@/components/verification-steps/verifying-step';
import { ResultsStep } from '@/components/verification-steps/results-step';
import { mockVerify } from '@/lib/mock-api';
import type { VerificationResponse, VerificationStep } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

export function HybridIdGuardian() {
  const [step, setStep] = React.useState<VerificationStep>('welcome');
  const [result, setResult] = React.useState<VerificationResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleVerification = async () => {
    setStep('verifying');
    try {
      const verificationResult = await mockVerify();
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
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeStep onNext={() => setStep('document')} />;
      case 'document':
        return <DocumentCaptureStep onNext={() => setStep('selfie')} onBack={() => setStep('welcome')}/>;
      case 'selfie':
        return <SelfieCaptureStep onNext={() => setStep('audio')} onBack={() => setStep('document')} />;
      case 'audio':
        return <AudioCaptureStep onNext={handleVerification} onBack={() => setStep('selfie')} />;
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
