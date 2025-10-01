import type { VerificationResponse, VerificationSignals } from '@/lib/types';
import { StepWrapper } from './step-wrapper';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, ShieldAlert, XCircle, FileQuestion, Info } from 'lucide-react';

type ResultsStepProps = {
  result: VerificationResponse;
  onRestart: () => void;
};

const statusConfig = {
  verified: {
    Icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    title: 'Verification Successful',
    description: 'Your identity has been successfully verified. Thank you.',
  },
  review: {
    Icon: FileQuestion,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    title: 'Review Required',
    description: 'Some of your details require manual review. Our team will look into it shortly.',
  },
  rejected: {
    Icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    title: 'Verification Failed',
    description: 'We were unable to verify your identity at this time.',
  },
};

const signalLabels: Record<keyof VerificationSignals, string> = {
  face_match: 'Face Match',
  liveness: 'Liveness',
  audio_antispoof: 'Audio Anti-Spoof',
  ocr_consistency: 'Document Consistency',
};

function SignalBar({ label, score }: { label: string; score: number }) {
  const percentage = Math.round(score * 100);
  const getScoreColor = () => {
    if (score > 0.8) return 'bg-green-500';
    if (score > 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <p className="text-sm font-medium text-foreground/90">{label}</p>
        <p className="text-sm font-semibold" style={{color: getScoreColor().replace('bg-','text-')}}>{percentage}%</p>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary">
        <div
          className={`h-2 rounded-full ${getScoreColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function ResultsStep({ result, onRestart }: ResultsStepProps) {
  const config = statusConfig[result.status];
  const overallScore = Math.round(result.score * 100);

  return (
    <div className="p-6 md:p-8">
      <div className={`p-6 rounded-lg ${config.bgColor} flex flex-col items-center text-center`}>
        <config.Icon className={`h-16 w-16 ${config.color} mb-4`} />
        <h3 className={`text-2xl font-headline font-semibold ${config.color}`}>{config.title}</h3>
        <p className="text-muted-foreground mt-1">{config.description}</p>
      </div>

      <div className="my-6 space-y-4">
        <h4 className="text-lg font-semibold font-headline">Verification Details</h4>
        <div className="space-y-4 rounded-lg border p-4">
            <SignalBar label="Overall Score" score={result.score} />
            <div className="pt-4 space-y-4">
              {Object.entries(result.signals).map(([key, value]) => (
                <SignalBar key={key} label={signalLabels[key as keyof VerificationSignals]} score={value} />
              ))}
            </div>
        </div>
      </div>
      
      {result.explanations.length > 0 && (
        <div className="my-6">
            <h4 className="text-lg font-semibold font-headline mb-2">AI-Powered Explanations</h4>
             <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>
                        <div className='flex items-center gap-2'>
                           <Info className="h-4 w-4" /> Why is my score low?
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                            {result.explanations.map((exp, i) => <li key={i}>{exp}</li>)}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button onClick={onRestart}>Start New Verification</Button>
      </div>
    </div>
  );
}
