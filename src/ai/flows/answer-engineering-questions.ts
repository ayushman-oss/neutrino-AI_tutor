'use server';
/**
 * @fileOverview A flow that answers engineering questions.
 *
 * - answerEngineeringQuestion - A function that answers the engineering question.
 * - AnswerEngineeringQuestionInput - The input type for the answerEngineeringQuestion function.
 * - AnswerEngineeringQuestionOutput - The return type for the answerEngineeringQuestion function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnswerEngineeringQuestionInputSchema = z.object({
  topic: z.string().describe('The engineering topic the question is about.'),
  question: z.string().describe('The question about the engineering topic.'),
  urgency: z.enum(['high', 'medium', 'low']).describe('The urgency level of the user.'),
  learningProgress: z.string().describe('The current learning progress of the user in the topic.'),
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
      topic: z.string().describe('The engineering topic the question is about.'),
      question: z.string().describe('The question about the engineering topic.'),
      urgency: z.string().describe('The urgency level of the user.'),
      learningProgress: z.string().describe('The current learning progress of the user in the topic.'),
    }),
  },
  output: {
    schema: z.object({
      answer: z.string().describe('The answer to the engineering question.'),
    }),
  },
  prompt: `You are an expert engineering tutor. A student is learning about the topic '{{topic}}'. They have the following question: '{{question}}'.

The student's urgency level is '{{urgency}}'. Take this into account to decide how much detail to include in your answer.  If the urgency is high, give a short answer, if it is low give a detailed answer.

The student's current learning progress is: '{{learningProgress}}'. Take this into account to decide what to cover and what to assume the student already knows.

Answer the question clearly and concisely, providing helpful explanations and examples.`, // Ensure this is a single string
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
  return output!;
});
