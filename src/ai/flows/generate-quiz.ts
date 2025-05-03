'use server';
/**
 * @fileOverview A flow that generates a quiz for an engineering topic.
 *
 * - generateQuiz - A function that generates the quiz questions and answers.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

const UrgencyLevel = z.enum(['high', 'medium', 'low']);

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question text.'),
  options: z.array(z.string()).length(4).describe('An array of 4 possible answers (multiple choice).'),
  correctAnswerIndex: z.number().min(0).max(3).describe('The 0-based index of the correct answer in the options array.'),
  explanation: z.string().optional().describe('A brief explanation for why the answer is correct (optional).')
});

// Removed export
const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The main engineering topic.'),
  subtopics: z.array(z.string()).describe('The list of subtopics covered.'),
  urgency: UrgencyLevel.describe('The urgency level determines the number of questions.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Removed export
const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {
    schema: GenerateQuizInputSchema,
  },
  output: {
    schema: GenerateQuizOutputSchema,
  },
  prompt: `You are an expert engineering tutor creating a multiple-choice quiz.
The main topic is '{{topic}}'. The subtopics covered are:
{{#each subtopics}}
- {{this}}
{{/each}}

The student's learning urgency was '{{urgency}}'. Generate a quiz with the following number of questions per subtopic based on urgency:
*   **high urgency:** 1 question per subtopic.
*   **medium urgency:** 2 questions per subtopic.
*   **low urgency:** 3 questions per subtopic.

For each question:
1.  Formulate a clear multiple-choice question testing understanding of one of the subtopics.
2.  Provide exactly 4 plausible answer options.
3.  Indicate the 0-based index of the correct answer.
4.  Optionally, provide a brief explanation for the correct answer.

Ensure the questions cover a range of the provided subtopics.

**Output Format:**

Strictly adhere to the JSON output schema: an object with a 'questions' key, which is an array. Each element in the array should be an object with 'question' (string), 'options' (array of 4 strings), 'correctAnswerIndex' (number 0-3), and optionally 'explanation' (string).
`,
});

const generateQuizFlow = ai.defineFlow<
  typeof GenerateQuizInputSchema,
  typeof GenerateQuizOutputSchema
>(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
     // Calculate target question count based on urgency
     let questionsPerSubtopic = 1;
     if (input.urgency === 'medium') {
       questionsPerSubtopic = 2;
     } else if (input.urgency === 'low') {
       questionsPerSubtopic = 3;
     }
     const targetQuestionCount = input.subtopics.length * questionsPerSubtopic;

     try {
        console.log(`Generating quiz for topic "${input.topic}" with urgency "${input.urgency}". Target questions: ${targetQuestionCount}`);
        const {output} = await prompt(input);

        // Basic validation
        if (!output || !Array.isArray(output.questions)) {
            console.error("Invalid output format received for quiz generation:", output);
            throw new Error("AI failed to generate quiz in the expected format.");
        }
         // Optional: Add validation for individual questions if needed

        console.log(`Generated ${output.questions.length} quiz questions.`);
        return output!;

      } catch (error: any) {
          console.error(`Error in generateQuizFlow for topic "${input.topic}":`, error);
          if (error.message?.includes('503') || error.message?.includes('overloaded')) {
             throw new Error("AI service overloaded while generating quiz. Please try again soon.");
          } else if (error.message?.includes('Handlebars')) {
             console.error("Handlebars template error detected in generateQuizFlow.");
             throw new Error(`Internal template error: ${error.message}`);
          }
          throw new Error(`Failed to generate quiz for ${input.topic}: ${error.message}`);
      }
  }
);

