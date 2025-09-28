import { StepWrapper } from './step-wrapper';
import { FileText, Camera, Mic } from 'lucide-react';

type WelcomeStepProps = {
  onNext: () => void;
};

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const requirements = [
    { icon: FileText, text: 'A valid government-issued ID' },
    { icon: Camera, text: 'A device with a front-facing camera' },
    { icon: Mic, text: 'A device with a microphone' },
  ];

  return (
    <StepWrapper
      title="Start Your Secure Verification"
      description="This process will take a few minutes. Please have the following ready:"
      onNext={onNext}
      nextText="Begin Verification"
    >
      <ul className="space-y-4 my-6">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <req.icon className="h-6 w-6" />
            </div>
            <span className="font-medium text-foreground/90">{req.text}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground text-center mt-8">
        Your data is encrypted and handled with the utmost security.
      </p>
    </StepWrapper>
  );
}
