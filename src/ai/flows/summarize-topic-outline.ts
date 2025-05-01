'use server';

/**
 * @fileOverview A flow to generate a concise outline of a given engineering topic.
 *
 * - summarizeTopicOutline - A function that generates the topic outline.
 * - SummarizeTopicOutlineInput - The input type for the summarizeTopicOutline function.
 * - SummarizeTopicOutlineOutput - The return type for the summarizeTopicOutline function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeTopicOutlineInputSchema = z.object({
  topic: z.string().describe('The engineering topic to summarize.'),
});
export type SummarizeTopicOutlineInput = z.infer<typeof SummarizeTopicOutlineInputSchema>;

const SummarizeTopicOutlineOutputSchema = z.object({
  outline: z.string().describe('A concise outline of the engineering topic.'),
});
export type SummarizeTopicOutlineOutput = z.infer<typeof SummarizeTopicOutlineOutputSchema>;

export async function summarizeTopicOutline(input: SummarizeTopicOutlineInput): Promise<SummarizeTopicOutlineOutput> {
  return summarizeTopicOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTopicOutlinePrompt',
  input: {
    schema: z.object({
      topic: z.string().describe('The engineering topic to summarize.'),
    }),
  },
  output: {
    schema: z.object({
      outline: z.string().describe('A concise outline of the engineering topic, including key subtopics.'),
    }),
  },
  prompt: `You are an expert in engineering education. Your task is to generate a concise outline of the given engineering topic, including key subtopics, so students can quickly grasp the scope and structure of the subject matter.\n\nTopic: {{{topic}}}\n\nOutline:`, 
});

const summarizeTopicOutlineFlow = ai.defineFlow<
  typeof SummarizeTopicOutlineInputSchema,
  typeof SummarizeTopicOutlineOutputSchema
>(
  {
    name: 'summarizeTopicOutlineFlow',
    inputSchema: SummarizeTopicOutlineInputSchema,
    outputSchema: SummarizeTopicOutlineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
