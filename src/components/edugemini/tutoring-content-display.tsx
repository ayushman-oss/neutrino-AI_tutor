
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TestTubeDiagonal, Key, Sigma, Image as ImageIcon } from 'lucide-react'; // Added Key, Sigma, and Image icons
import type { GenerateSubtopicDetailsOutput } from '@/ai/flows/generate-subtopic-details'; // Import the correct type
import { FormattedText } from '@/components/edugemini/formatted-text'; // Import shared component
import Image from 'next/image'; // Import Next Image

interface TutoringContentDisplayProps {
  content: GenerateSubtopicDetailsOutput; // Use the specific output type for subtopic details
  selectedSubtopic: string | null;
  urgency: 'high' | 'medium' | 'low';
  topic: string; // Pass main topic
}


export function TutoringContentDisplay({ content, selectedSubtopic, urgency, topic }: TutoringContentDisplayProps) {

    if (!selectedSubtopic) {
        // This case should ideally not happen if the parent component manages state correctly,
        // but we handle it defensively.
        return <p>Please select a subtopic to view details.</p>;
    }

    const { explanation, keyPoints, example, formula } = content; // Destructure the specific fields

    const urgencyTextMap = {
        high: 'Quick Overview',
        medium: 'Standard Pace',
        low: 'Detailed Study',
    };

    // Handle potential error messages in content fields
    const isError = (text?: string | string[]) => typeof text === 'string' && text.startsWith('Error:');

    // Keywords for image search hint
    const imageKeywords = `${topic} ${selectedSubtopic}`;

    return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold text-primary border-b pb-2 mb-4">
            {selectedSubtopic}
            {/* Removed urgency text from title: ({urgencyTextMap[urgency]}) */}
        </h2>

         {/* Image Placeholder */}
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary text-lg">
                    <ImageIcon /> Relevant Image (Placeholder)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    {/* Placeholder image using picsum.photos */}
                    <Image
                        src={`https://picsum.photos/seed/${encodeURIComponent(imageKeywords)}/600/400`}
                        alt={`Placeholder image related to ${selectedSubtopic}`}
                        width={600}
                        height={400}
                        className="object-cover w-full h-full"
                        data-ai-hint={imageKeywords} // Add hint for AI image generation/search
                        unoptimized // Use unoptimized for picsum for simplicity, optimize later if needed
                    />
                    {/* If you want text instead:
                    <span className="text-muted-foreground italic">Image related to {selectedSubtopic}</span>
                    */}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Note: This is a placeholder image. Relevant diagrams or visuals would appear here. Search hint: "{imageKeywords}"
                </p>
            </CardContent>
         </Card>


        {explanation && (
            <Card className={isError(explanation) ? 'border-destructive' : ''}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary text-lg"> {/* Adjusted size */}
                    <BookOpen /> Explanation
                </CardTitle>
            </CardHeader>
            <CardContent>
                <FormattedText text={explanation} />
            </CardContent>
            </Card>
        )}

        {keyPoints && keyPoints.length > 0 && !isError(keyPoints) && (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary text-lg"> {/* Adjusted size */}
                        <Key /> Key Points
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Use FormattedText to handle potential markdown in points */}
                    <FormattedText text={keyPoints.map(p => `- ${p}`).join('\n')} />
                </CardContent>
             </Card>
        )}
         {/* Display error for keyPoints if present */}
         {isError(keyPoints) && (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive text-lg"> {/* Adjusted size */}
                        <Key /> Key Points Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-destructive">{Array.isArray(keyPoints) ? keyPoints[0] : keyPoints}</p>
                </CardContent>
            </Card>
         )}


        {example && (
            <Card className={isError(example) ? 'border-destructive' : ''}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary text-lg"> {/* Adjusted size */}
                    <TestTubeDiagonal /> Example
                </CardTitle>
            </CardHeader>
            <CardContent>
                <FormattedText text={example} />
            </CardContent>
            </Card>
        )}

         {formula && (
            <Card className={isError(formula) ? 'border-destructive' : ''}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary text-lg"> {/* Adjusted size */}
                    <Sigma /> Formula / Equations
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Formulas might need special formatting (e.g., MathJax, KaTeX) or just pre-formatted text */}
                 {/* Using FormattedText allows basic code/pre formatting if Gemini outputs it */}
                 <FormattedText text={formula} />
                {/* <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-3 rounded-md"><code>{formula}</code></pre> */}
            </CardContent>
            </Card>
         )}
    </div>
    );
}

    