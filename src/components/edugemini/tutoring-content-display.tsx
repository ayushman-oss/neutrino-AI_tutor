
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TestTubeDiagonal, Key, Sigma } from 'lucide-react'; // Added Key and Sigma icons
import type { GenerateSubtopicDetailsOutput } from '@/ai/flows/generate-subtopic-details'; // Import the correct type
import { FormattedText } from '@/components/edugemini/formatted-text'; // Import shared component

interface TutoringContentDisplayProps {
  content: GenerateSubtopicDetailsOutput; // Use the specific output type for subtopic details
  selectedSubtopic: string | null;
  urgency: 'high' | 'medium' | 'low';
}


export function TutoringContentDisplay({ content, selectedSubtopic, urgency }: TutoringContentDisplayProps) {

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

    return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold text-primary border-b pb-2 mb-4">
            Details for: <span className="font-bold">{selectedSubtopic}</span> ({urgencyTextMap[urgency]})
        </h2>

        {explanation && (
            <Card className={isError(explanation) ? 'border-destructive' : ''}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <BookOpen /> Explanation ({urgencyTextMap[urgency]})
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
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Key /> Key Points
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc space-y-1 pl-5">
                        {keyPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                        ))}
                    </ul>
                    {/* If keyPoints can contain markdown, use FormattedText instead */}
                    {/* <FormattedText text={keyPoints.map(p => `- ${p}`).join('\n')} /> */}
                </CardContent>
             </Card>
        )}
         {/* Display error for keyPoints if present */}
         {isError(keyPoints) && (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
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
                <CardTitle className="flex items-center gap-2 text-primary">
                    <TestTubeDiagonal /> Example ({urgencyTextMap[urgency]})
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
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Sigma /> Formula / Equations
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Formulas might need special formatting (e.g., MathJax, KaTeX) or just pre-formatted text */}
                 <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-3 rounded-md"><code>{formula}</code></pre>
                {/* Or use FormattedText if formulas are simple text */}
                {/* <FormattedText text={formula} /> */}
            </CardContent>
            </Card>
         )}
    </div>
    );
}
