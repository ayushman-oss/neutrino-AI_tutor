
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TestTubeDiagonal, Key, Sigma, ImageIcon } from 'lucide-react'; // Added Key, Sigma, and Image icons
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

    // More specific keywords for image search hint - combining topic and subtopic
    const imageKeywords = `${topic} ${selectedSubtopic}`;
    // Encode keywords for URL usage in picsum.photos seed
    const encodedKeywords = encodeURIComponent(imageKeywords);

    return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold text-primary border-b pb-2 mb-4">
            {selectedSubtopic}
        </h2>

         {/* Image Placeholder using Picsum with keywords */}
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary text-lg">
                    <ImageIcon /> Relevant Image (Placeholder)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden border">
                    {/* Placeholder image using picsum.photos seeded with keywords */}
                    <Image
                        // Use encoded keywords in the seed for better variation
                        src={`https://picsum.photos/seed/${encodedKeywords}/600/400`}
                        alt={`Placeholder visual for ${selectedSubtopic} in ${topic}`}
                        width={600}
                        height={400}
                        className="object-cover w-full h-full"
                        // Provide clear keywords for potential future image replacement
                        data-ai-hint={imageKeywords}
                        // Consider adding unoptimized if Picsum rate limits are hit, but it's generally better to optimize
                        // unoptimized
                        priority // Prioritize loading the image placeholder
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Note: This is a placeholder image. A relevant diagram, graph, or visual for "{selectedSubtopic}" would ideally be displayed here. (Search hint: "{imageKeywords}")
                </p>
            </CardContent>
         </Card>


        {explanation && (
            <Card className={isError(explanation) ? 'border-destructive' : ''}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary text-lg">
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
                    <CardTitle className="flex items-center gap-2 text-primary text-lg">
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
                    <CardTitle className="flex items-center gap-2 text-destructive text-lg">
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
                <CardTitle className="flex items-center gap-2 text-primary text-lg">
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
                <CardTitle className="flex items-center gap-2 text-primary text-lg">
                    <Sigma /> Formula / Equations
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <FormattedText text={formula} />
            </CardContent>
            </Card>
         )}
    </div>
    );
}
