'use client';
import * as React from 'react';
import { Loader2 } from 'lucide-react';

const verificationTexts = [
    'Initializing verification...',
    'Analyzing document integrity...',
    'Matching facial biometrics...',
    'Performing liveness checks...',
    'Verifying audio signature...',
    'Aggregating risk signals...',
    'Finalizing results...',
];

export function VerifyingStep() {
    const [text, setText] = React.useState(verificationTexts[0]);

    React.useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index++;
            if (index < verificationTexts.length) {
                setText(verificationTexts[index]);
            } else {
                clearInterval(interval);
            }
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8 md:p-12 min-h-[400px]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-8" />
            <h3 className="text-2xl font-headline font-semibold text-foreground mb-2">
                Verification in Progress
            </h3>
            <p className="text-muted-foreground text-center">
                Please wait while we securely verify your identity.
            </p>
            <div className="h-6 mt-4 text-center">
                <p className="text-accent font-medium animate-in fade-in duration-300">{text}</p>
            </div>
        </div>
    );
}
