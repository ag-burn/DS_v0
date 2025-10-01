'use client';

import * as React from 'react';
import { StepWrapper } from './step-wrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type NameEntryStepProps = {
  onNext: (name: string) => void;
  onBack: () => void;
  defaultValue?: string;
};

export function NameEntryStep({ onNext, onBack, defaultValue = '' }: NameEntryStepProps) {
  const [name, setName] = React.useState(defaultValue);
  const [touched, setTouched] = React.useState(false);

  const trimmed = name.trim();
  const isInvalid = trimmed.length < 2;
  const helperText = isInvalid
    ? 'Please enter the full name that appears on the ID.'
    : 'Make sure this matches the spelling on your ID card.';

  const handleContinue = () => {
    if (!isInvalid) {
      onNext(trimmed);
    } else {
      setTouched(true);
    }
  };

  return (
    <StepWrapper
      title="Tell Us Who We're Verifying"
      description="Enter the name exactly as it appears on the ID you will upload."
      onNext={handleContinue}
      onBack={onBack}
      isNextDisabled={isInvalid}
      nextText="Continue"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full-name">Full legal name</Label>
          <Input
            id="full-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!touched) {
                setTouched(true);
              }
            }}
            placeholder="e.g. Priya Sharma"
            autoComplete="name"
          />
          {touched && (
            <p className={`text-sm ${isInvalid ? 'text-destructive' : 'text-muted-foreground'}`}>
              {helperText}
            </p>
          )}
        </div>
      </div>
    </StepWrapper>
  );
}
