import { HybridIdGuardian } from '@/components/hybrid-id-guardian';
import { ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <header className="py-4 px-4 sm:px-8 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-headline font-bold text-primary">
              DS
            </h1>
          </div>
        </div>
      </header>
      <main className="min-h-[calc(100vh-81px)] flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl mx-auto text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-headline font-bold text-foreground mb-4">
            Secure Your Digital Identity
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Our cutting-edge, deepfake-resistant verification ensures your identity is protected. Complete the secure check below to get started.
          </p>
        </div>
        <HybridIdGuardian />
      </main>
    </div>
  );
}
