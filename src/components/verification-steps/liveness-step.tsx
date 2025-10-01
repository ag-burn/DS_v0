'use client';

import { StepWrapper } from './step-wrapper';
import { ListChecks } from 'lucide-react';

const prompts = [
  'Blink twice to confirm responsiveness.',
  'Turn your head slowly to the right, then back to center.',
  'Turn your head to the left and hold for a moment.',
  'Smile naturally to finish the sequence.',
];

type LivenessStepProps = {
  onNext: () => void;
  onBack: () => void;
};

export function LivenessStep({ onNext, onBack }: LivenessStepProps) {
  return (
    <StepWrapper
      title="Liveness Check"
      description="Follow these quick prompts so we can confirm you are a real person."
      onNext={onNext}
      onBack={onBack}
      nextText="Continue"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-foreground/90">
          <ListChecks className="h-6 w-6 text-primary" />
          <p className="text-base font-medium">When you're ready, perform each action below:</p>
        </div>
        <ul className="list-decimal list-inside space-y-3 text-muted-foreground">
          {prompts.map((prompt, index) => (
            <li key={index}>{prompt}</li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          These prompts are placeholders for now - we will plug in the full liveness detection soon.
        </p>
      </div>
    </StepWrapper>
  );
}
