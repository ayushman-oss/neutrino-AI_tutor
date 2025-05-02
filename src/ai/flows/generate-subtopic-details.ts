'use server';
/**
 * @fileOverview A flow that generates detailed content for a specific subtopic of an engineering subject.
 *
 * - generateSubtopicDetails - A function that generates the detailed content.
 * - GenerateSubtopicDetailsInput - The input type for the generateSubtopicDetails function.
 * - GenerateSubtopicDetailsOutput - The return type for the generateSubtopicDetails function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const UrgencyLevel = z.enum(['high', 'medium', 'low']);

// Removed export
const GenerateSubtopicDetailsInputSchema = z.object({
  topic: z.string().describe('The main engineering topic.'),
  subtopic: z.string().describe('The specific subtopic to get details for.'),
  urgency: UrgencyLevel.describe('The urgency level for learning.'),
  learningProgress: z.string().optional().describe('The current learning progress of the user (optional context).'),
});
export type GenerateSubtopicDetailsInput = z.infer<typeof GenerateSubtopicDetailsInputSchema>;

// Removed export
const GenerateSubtopicDetailsOutputSchema = z.object({
  explanation: z.string().describe('Detailed explanation of the subtopic, adjusted for urgency.'),
  keyPoints: z.array(z.string()).describe('Bullet points summarizing the key concepts of the subtopic.'),
  example: z.string().optional().describe('An illustrative example for the subtopic, adjusted for urgency.'),
  formula: z.string().optional().describe('Relevant formulas or equations for the subtopic, if applicable.'),
});
export type GenerateSubtopicDetailsOutput = z.infer<typeof GenerateSubtopicDetailsOutputSchema>;

export async function generateSubtopicDetails(input: GenerateSubtopicDetailsInput): Promise<GenerateSubtopicDetailsOutput> {
  return generateSubtopicDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSubtopicDetailsPrompt',
  input: {
    // Use the internal schema directly
    schema: GenerateSubtopicDetailsInputSchema,
  },
  output: {
    // Use the internal schema directly
    schema: GenerateSubtopicDetailsOutputSchema,
  },
  prompt: `You are an expert engineering tutor. The user is learning about the main topic '{{topic}}' and wants details about the subtopic '{{subtopic}}'. Their learning urgency is '{{urgency}}'.
{{#if learningProgress}}Their current progress is: {{learningProgress}}{{/if}}

Generate detailed content specifically for the subtopic '{{subtopic}}', tailored to the '{{urgency}}' level:

1.  **Explanation:** Provide an explanation of the core concepts for '{{subtopic}}'.
2.  **Key Points:** List the most important takeaways or concepts as a JSON array of strings (bullet points).
3.  **Example:** (Optional) If relevant, provide an illustrative example.
4.  **Formula:** (Optional) If relevant, list key formulas or equations associated with '{{subtopic}}'.

**Urgency Guidelines:**

*   **If urgency is 'high':**
    *   Explanation: Very brief, focus on definition. Use bullet points for core concepts. Minimal wording.
    *   Key Points: 2-3 essential points.
    *   Example: Simple, direct example if included.
    *   Formula: Only the most critical formula, if applicable.
*   **If urgency is 'medium':**
    *   Explanation: Standard-level explanation. Cover main points clearly.
    *   Key Points: 3-5 key points.
    *   Example: Standard example.
    *   Formula: Key formulas, briefly explained.
*   **If urgency is 'low':**
    *   Explanation: Detailed explanation, covering nuances.
    *   Key Points: Comprehensive list of key points.
    *   Example: More complex or detailed example.
    *   Formula: Relevant formulas with explanations of variables.

**Output Format:**

Ensure the output strictly follows the JSON schema defined for the output, with fields for 'explanation', 'keyPoints' (as a JSON array of strings), 'example' (optional string), and 'formula' (optional string).
`,
});

const generateSubtopicDetailsFlow = ai.defineFlow<
  typeof GenerateSubtopicDetailsInputSchema,
  typeof GenerateSubtopicDetailsOutputSchema
>(
  {
    name: 'generateSubtopicDetailsFlow',
    inputSchema: GenerateSubtopicDetailsInputSchema,
    outputSchema: GenerateSubtopicDetailsOutputSchema,
  },
  async input => {
     try {
        const {output} = await prompt(input);
        // Basic validation or refinement could happen here
         if (!output || !Array.isArray(output.keyPoints)) {
            console.error("Invalid output format received for subtopic details:", output);
             const fallbackOutput: GenerateSubtopicDetailsOutput = {
                explanation: output?.explanation || "Error: Explanation missing.",
                keyPoints: output?.keyPoints && Array.isArray(output.keyPoints) ? output.keyPoints : ["Error: Key points missing or invalid."],
                example: output?.example || undefined,
                formula: output?.formula || undefined,
             };
             // Attempt to parse keyPoints if it's a stringified array
             if (output && typeof output.keyPoints === 'string') {
                 try {
                     fallbackOutput.keyPoints = JSON.parse(output.keyPoints);
                 } catch (e) {
                     console.error("Failed to parse keyPoints string:", e);
                     fallbackOutput.keyPoints = ["Error: Could not parse key points."];
                 }
             }
             return fallbackOutput;
         }
        return output!;
      } catch (error: any) {
          console.error(`Error in generateSubtopicDetailsFlow for subtopic "${input.subtopic}" (Urgency: ${input.urgency}):`, error);
          if (error.message?.includes('503') || error.message?.includes('Service Unavailable') || error.message?.includes('overloaded')) {
             throw new Error("AI service overloaded. Please try again soon."); // Specific error for UI
          } else if (error.message?.includes('Handlebars')) {
             console.error("Handlebars template error detected.");
             throw new Error(`Internal template error: ${error.message}`);
          }
          throw new Error(`Failed to generate details for ${input.subtopic}: ${error.message}`); // General error
      }
  }
);
