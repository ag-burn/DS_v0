'use server';
/**
 * @fileOverview Generates AI-powered explanations for low KYC verification scores.
 *
 * - generateKycExplanations - A function that generates explanations for low KYC scores.
 * - GenerateKycExplanationsInput - The input type for the generateKycExplanations function.
 * - GenerateKycExplanationsOutput - The return type for the generateKycExplanations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateKycExplanationsInputSchema = z.object({
  signals: z.record(z.number()).describe('A map of signal names to their scores (0-1).'),
  threshold: z.number().describe('The threshold for passing verification (0-1).'),
});
export type GenerateKycExplanationsInput = z.infer<
  typeof GenerateKycExplanationsInputSchema
>;

const GenerateKycExplanationsOutputSchema = z.object({
  explanations: z
    .array(z.string())
    .describe('Explanations for why the verification score is low.'),
});
export type GenerateKycExplanationsOutput = z.infer<
  typeof GenerateKycExplanationsOutputSchema
>;

export async function generateKycExplanations(
  input: GenerateKycExplanationsInput
): Promise<GenerateKycExplanationsOutput> {
  return generateKycExplanationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateKycExplanationsPrompt',
  input: {schema: GenerateKycExplanationsInputSchema},
  output: {schema: GenerateKycExplanationsOutputSchema},
  prompt: `You are an AI assistant that explains why a KYC verification failed based on signal scores.

  The threshold for passing verification is {{threshold}}.

  The signal scores are:
  {{#each signals}}
  - {{@key}}: {{this}}
  {{/each}}

  Provide concise and clear explanations for the low scores, focusing on the potential issues.
  Limit to one sentence per signal.
  The output should be an array of explanations.
  `,
});

const generateKycExplanationsFlow = ai.defineFlow(
  {
    name: 'generateKycExplanationsFlow',
    inputSchema: GenerateKycExplanationsInputSchema,
    outputSchema: GenerateKycExplanationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
