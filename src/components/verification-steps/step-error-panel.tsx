'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type StepErrorAction = {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  Icon?: LucideIcon;
};

type StepErrorPanelProps = {
  title: string;
  message: string;
  actions: StepErrorAction[];
  icon?: LucideIcon;
};

export function StepErrorPanel({ title, message, actions, icon: Icon = AlertTriangle }: StepErrorPanelProps) {
  return (
    <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-left shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h4 className="text-lg font-semibold text-destructive">{title}</h4>
            <p className="mt-1 text-sm text-destructive-foreground/80">{message}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          {actions.map(({ label, onClick, variant = 'default', Icon: ActionIcon }, index) => (
            <Button key={`${label}-${index}`} variant={variant} onClick={onClick} className="min-w-[8rem]">
              {ActionIcon && <ActionIcon className="h-4 w-4" />}
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
