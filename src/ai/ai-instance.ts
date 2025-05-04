import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    console.warn(`
        ******************************************************************************************************
        * WARNING: GOOGLE_GENAI_API_KEY is not set or is still the placeholder in the .env file.             *
        * The AI features of this application will not work without a valid API key.                         *
        * Please obtain a key from Google AI Studio (https://aistudio.google.com/app/apikey)                 *
        * and add it to the .env file in the root directory (GOOGLE_GENAI_API_KEY="YOUR_ACTUAL_KEY").       *
        ******************************************************************************************************
    `);
    // Optionally, you could throw an error here to prevent the app from running without a key,
    // but a warning allows the rest of the app to potentially load.
    // throw new Error("Missing GOOGLE_GENAI_API_KEY. Please set it in the .env file.");
}


export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      // Pass the apiKey. If it's undefined or the placeholder, googleAI plugin might still throw,
      // but the console warning above gives the user better guidance.
      apiKey: apiKey,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
