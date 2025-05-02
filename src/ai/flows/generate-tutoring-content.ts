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

// Removed export
const GenerateTutoringContentInputSchema = z.object({
  urgency: UrgencyLevel.describe('The urgency level of learning the topic (high, medium, low).'),
  topic: z.string().describe('The specific engineering topic to learn about.'),
});
export type GenerateTutoringContentInput = z.infer<typeof GenerateTutoringContentInputSchema>;

// Removed export
const GenerateTutoringContentOutputSchema = z.object({
  outline: z.string().describe('The outline of the topic, formatted as a list.'),
  subtopics: z.array(z.string()).describe('The key subtopics of the main topic.'),
  explanation: z.string().describe('Explanation of the topic, adjusted for urgency.'),
  example: z.string().describe('An example to illustrate the topic, adjusted for urgency.'),
  problem: z.string().describe('A practice problem related to the topic, adjusted for urgency.'),
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
    // Use the internal schema directly
    schema: GenerateTutoringContentInputSchema,
  },
  output: {
    // Use the internal schema directly
    schema: GenerateTutoringContentOutputSchema,
  },
  // Updated prompt to instruct the LLM based on the urgency variable, removing #eq helper
  prompt: `You are an expert engineering tutor. Your goal is to explain engineering topics clearly and effectively based on the user's needs.

The user wants to learn about **{{topic}}** with **{{urgency}}** urgency.

Generate the following content, tailoring the detail level based on the urgency:

1.  **Outline:** Provide a concise, bulleted list outlining the main sections of the topic.
2.  **Subtopics:** List the key subtopics within the main topic. Return this as a JSON array of strings.
3.  **Explanation:** Explain the core concepts of the topic.
4.  **Example:** Provide an illustrative example.
5.  **Problem:** Create a relevant practice problem.

**Urgency Guidelines:**

*   **If urgency is 'high':**
    *   Explanation: Keep it very brief. Use one-sentence definitions for key terms. Focus on bullet points for core concepts. Use minimal wording.
    *   Example: Provide a very simple, direct example.
    *   Problem: A straightforward problem testing basic understanding.
*   **If urgency is 'medium':**
    *   Explanation: Provide a standard-level explanation. Cover the main points clearly. Use paragraphs and bullet points where appropriate.
    *   Example: A standard example illustrating the main concept.
    *   Problem: A problem requiring application of the core concepts.
*   **If urgency is 'low':**
    *   Explanation: Offer a detailed explanation. Dive deeper into nuances and related concepts. Use clear paragraphs, lists, and potentially mention key formulas or principles.
    *   Example: A more complex or detailed example, perhaps with variations.
    *   Problem: A challenging problem that may require combining multiple concepts or deeper analysis.

**Output Format:**

Ensure the output strictly follows the JSON schema defined for the output, with fields for 'outline', 'subtopics', 'explanation', 'example', and 'problem'. The 'outline' should be a single string with newline-separated bullet points. The 'subtopics' must be a JSON array of strings.
`,
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
     try {
        const {output} = await generateTutoringContentPrompt(input);
        // Basic validation or refinement could happen here if needed
        // e.g., ensuring subtopics is actually an array
        if (!output || !Array.isArray(output.subtopics)) {
            console.error("Invalid output format received from LLM:", output);
            // Attempt to recover or throw a more specific error
             const fallbackOutput: GenerateTutoringContentOutput = {
                outline: output?.outline || "Error: Outline missing",
                subtopics: ["Error: Subtopics missing or invalid"],
                explanation: output?.explanation || "Error: Explanation missing",
                example: output?.example || "Error: Example missing",
                problem: output?.problem || "Error: Problem missing",
             };

             if (output && typeof output.subtopics === 'string') {
                // Attempt to parse if it looks like a stringified array
                 try {
                    fallbackOutput.subtopics = JSON.parse(output.subtopics);
                 } catch (parseError) {
                     console.error("Failed to parse subtopics string:", parseError);
                     fallbackOutput.subtopics = ["Error: Could not parse subtopics"];
                 }
             }
             return fallbackOutput; // Return the structured fallback
        }
        return output!;
      } catch (error: any) {
          console.error(`Error in generateTutoringContentFlow for topic "${input.topic}" (Urgency: ${input.urgency}):`, error);
          // Check if it's a Handlebars compilation error
          if (error.message?.includes('Handlebars') || error.message?.includes('unknown helper')) {
             console.error("Handlebars template error detected. Prompt might be malformed.");
             throw new Error(`Internal template error: ${error.message}`); // Throw a more specific error for UI handling
          } else if (error.message?.includes('503') || error.message?.includes('overloaded')) {
             throw new Error("AI service overloaded. Please try again soon.");
          }
          // Re-throw other errors to be caught by the calling function in page.tsx
          throw new Error(`Failed to generate content: ${error.message}`);
      }
  }
);
