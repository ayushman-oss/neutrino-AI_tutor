'use server';
/**
 * @fileOverview A flow that answers engineering questions, potentially focusing on a specific subtopic.
 *
 * - answerEngineeringQuestion - A function that answers the engineering question.
 * - AnswerEngineeringQuestionInput - The input type for the answerEngineeringQuestion function.
 * - AnswerEngineeringQuestionOutput - The return type for the answerEngineeringQuestion function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnswerEngineeringQuestionInputSchema = z.object({
  topic: z.string().describe('The main engineering topic the question is about.'),
  question: z.string().describe('The question about the engineering topic.'),
  urgency: z.enum(['high', 'medium', 'low']).describe('The urgency level of the user.'),
  learningProgress: z.string().describe('The current learning progress of the user in the topic.'),
  selectedSubtopic: z.string().optional().describe('The specific subtopic the user is currently focused on, if any.'), // Added optional subtopic
});
export type AnswerEngineeringQuestionInput = z.infer<typeof AnswerEngineeringQuestionInputSchema>;

const AnswerEngineeringQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the engineering question.'),
});
export type AnswerEngineeringQuestionOutput = z.infer<typeof AnswerEngineeringQuestionOutputSchema>;

export async function answerEngineeringQuestion(input: AnswerEngineeringQuestionInput): Promise<AnswerEngineeringQuestionOutput> {
  return answerEngineeringQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerEngineeringQuestionPrompt',
  input: {
    schema: z.object({
      topic: z.string().describe('The main engineering topic the question is about.'),
      question: z.string().describe('The question about the engineering topic.'),
      urgency: z.string().describe('The urgency level of the user.'),
      learningProgress: z.string().describe('The current learning progress of the user in the topic.'),
      selectedSubtopic: z.string().optional().describe('The specific subtopic the user is currently focused on, if any.'), // Added optional subtopic
    }),
  },
  output: {
    schema: z.object({
      answer: z.string().describe('The answer to the engineering question.'),
    }),
  },
  // Updated prompt to include subtopic context
  prompt: `You are an expert engineering tutor. A student is learning about the topic '{{topic}}'.
{{#if selectedSubtopic}}They are currently focused on the subtopic '{{selectedSubtopic}}'.{{/if}}
They have the following question: '{{question}}'.

The student's urgency level is '{{urgency}}'. Take this into account to decide how much detail to include in your answer. If the urgency is high, give a concise answer; if it is low, provide a more detailed explanation.

The student's current learning progress is:
{{learningProgress}}
Take this progress into account to decide what concepts to explain and what to assume the student already knows.

{{#if selectedSubtopic}}Answer the question specifically in the context of the '{{selectedSubtopic}}' subtopic if relevant.{{else}}Answer the question in the general context of '{{topic}}'.{{/if}} Provide clear explanations and examples where appropriate.`,
});

const answerEngineeringQuestionFlow = ai.defineFlow<
  typeof AnswerEngineeringQuestionInputSchema,
  typeof AnswerEngineeringQuestionOutputSchema
>({
  name: 'answerEngineeringQuestionFlow',
  inputSchema: AnswerEngineeringQuestionInputSchema,
  outputSchema: AnswerEngineeringQuestionOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  // Basic error handling or refinement could be added here if needed
  return output!;
});

