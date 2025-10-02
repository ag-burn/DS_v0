'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

type TransitionStepProps = {
  title: string;
  description?: string;
  onContinue: () => void;
};

export function TransitionStep({ title, description, onContinue }: TransitionStepProps) {
  return (
    <div className="p-10 md:p-14 flex flex-col items-center justify-center text-center gap-8 animate-in fade-in zoom-in-95">
      <div className="relative flex items-center justify-center">
        <div className="absolute -inset-6 rounded-full bg-emerald-500/20 blur-2xl opacity-80 animate-pulse" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-emerald-500/70 bg-emerald-500/10">
          <div className="absolute -bottom-9 flex items-center gap-1 text-emerald-400/80">
            <ArrowRight className="h-6 w-6 animate-slide-right" />
            <ArrowRight className="h-4 w-4 animate-slide-right" style={{ animationDelay: '150ms' }} />
          </div>
          <CheckCircle2 className="h-20 w-20 text-emerald-500 animate-success-pop" />
        </div>
      </div>
      <div className="space-y-3 max-w-md">
        <h3 className="text-2xl md:text-3xl font-headline font-semibold text-emerald-500">{title}</h3>
        {description && (
          <p className="text-sm md:text-base text-muted-foreground/90">{description}</p>
        )}
      </div>
      <Button
        type="button"
        onClick={onContinue}
        className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
      >
        Continue
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
