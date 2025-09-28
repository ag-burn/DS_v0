import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepWrapperProps = {
  title: string;
  description: string;
  children: ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  isNextDisabled?: boolean;
  nextText?: string;
  isLoading?: boolean;
  footerContent?: ReactNode;
};

export function StepWrapper({
  title,
  description,
  children,
  onNext,
  onBack,
  isNextDisabled = false,
  nextText = 'Next',
  isLoading = false,
  footerContent,
}: StepWrapperProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 md:p-8 border-b">
        <h3 className="text-2xl font-headline font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="p-6 md:p-8 flex-grow">{children}</div>
      <div className={cn("p-6 bg-secondary/30 border-t flex items-center", onBack ? "justify-between" : "justify-end")}>
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            <ArrowLeft />
            Back
          </Button>
        )}
        {footerContent}
        {onNext && (
          <Button onClick={onNext} disabled={isNextDisabled || isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {nextText}
            <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
