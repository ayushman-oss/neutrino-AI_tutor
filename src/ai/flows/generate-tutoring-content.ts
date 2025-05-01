'use server';

/**
 * @fileOverview An AI agent for generating tutoring content on engineering topics.
 *
 * - generateTutoringContent - A function that generates tutoring content based on the user's urgency and chosen topic.
 * - GenerateTutoringContentInput - The input type for the generateTutoringContent function.
 * - GenerateTutoringContentOutput - The return type for the generateTutoringContent function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const UrgencyLevel = z.enum(['high', 'medium', 'low']);

const GenerateTutoringContentInputSchema = z.object({
  urgency: UrgencyLevel.describe('The urgency level of learning the topic (high, medium, low).'),
  topic: z.string().describe('The specific engineering topic to learn about.'),
});
export type GenerateTutoringContentInput = z.infer<typeof GenerateTutoringContentInputSchema>;

const GenerateTutoringContentOutputSchema = z.object({
  outline: z.string().describe('The outline of the topic.'),
  subtopics: z.array(z.string()).describe('The subtopics of the main topic.'),
  explanation: z.string().describe('Explanation of the topic.'),
  example: z.string().describe('An example to illustrate the topic.'),
  problem: z.string().describe('A practice problem related to the topic.'),
});
export type GenerateTutoringContentOutput = z.infer<typeof GenerateTutoringContentOutputSchema>;

export async function generateTutoringContent(
  input: GenerateTutoringContentInput
): Promise<GenerateTutoringContentOutput> {
  return generateTutoringContentFlow(input);
}

const generateTutoringContentPrompt = ai.definePrompt({
  name: 'generateTutoringContentPrompt',
  input: {
    schema: z.object({
      urgency: UrgencyLevel.describe('The urgency level of learning the topic (high, medium, low).'),
      topic: z.string().describe('The specific engineering topic to learn about.'),
    }),
  },
  output: {
    schema: z.object({
      outline: z.string().describe('The outline of the topic.'),
      subtopics: z.array(z.string()).describe('The subtopics of the main topic.'),
      explanation: z.string().describe('Explanation of the topic.'),
      example: z.string().describe('An example to illustrate the topic.'),
      problem: z.string().describe('A practice problem related to the topic.'),
    }),
  },
  prompt: `You are an expert engineering tutor. Your goal is to explain engineering topics clearly and concisely.

  The user wants to learn about {{topic}} with {{urgency}} urgency. 

  Generate an outline of the topic, including key subtopics. Provide a detailed explanation of the topic and an example to illustrate the concept. Finally, create a practice problem for the user to solve.

  Here's how to format the output:

  Outline:
  [Outline of the topic]

  Subtopics:
  - [Subtopic 1]
  - [Subtopic 2]
  ...

  Explanation:
  [Detailed explanation of the topic]

  Example:
  [Example illustrating the topic]

  Problem:
  [Practice problem for the user]`,
});

const generateTutoringContentFlow = ai.defineFlow<
  typeof GenerateTutoringContentInputSchema,
  typeof GenerateTutoringContentOutputSchema
>(
  {
    name: 'generateTutoringContentFlow',
    inputSchema: GenerateTutoringContentInputSchema,
    outputSchema: GenerateTutoringContentOutputSchema,
  },
  async input => {
    const {output} = await generateTutoringContentPrompt(input);
    return output!;
  }
);
