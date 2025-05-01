"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TestTubeDiagonal, HelpCircle } from 'lucide-react';
import type { GenerateTutoringContentOutput } from '@/ai/flows/generate-tutoring-content';
import { FormattedText } from '@/components/edugemini/formatted-text'; // Import shared component

interface TutoringContentDisplayProps {
  content: GenerateTutoringContentOutput;
  selectedSubtopic: string | null; // Receive the selected subtopic
}


export function TutoringContentDisplay({ content, selectedSubtopic }: TutoringContentDisplayProps) {
    // In a future enhancement, the AI response would ideally provide content *per subtopic*.
    // For now, we'll display the general explanation, example, and problem,
    // clearly indicating they relate to the selected subtopic context.

    if (!selectedSubtopic) {
        // This case should ideally not happen if the parent component manages state correctly,
        // but we handle it defensively.
        return <p>Please select a subtopic to view details.</p>;
    }

    // Future: If content object had subtopic-specific details like content.subtopicDetails[selectedSubtopic].explanation
    const explanation = content.explanation; // Use general explanation for now
    const example = content.example;         // Use general example for now
    const problem = content.problem;         // Use general problem for now

    return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold text-primary border-b pb-2 mb-4">
            Details for: {selectedSubtopic}
        </h2>

        <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
                <BookOpen /> Explanation
            </CardTitle>
        </CardHeader>
        <CardContent>
            <FormattedText text={explanation} />
        </CardContent>
        </Card>

        <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
                <TestTubeDiagonal /> Example
            </CardTitle>
        </CardHeader>
        <CardContent>
            <FormattedText text={example} />
        </CardContent>
        </Card>

        <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
                <HelpCircle /> Practice Problem
            </CardTitle>
        </CardHeader>
        <CardContent>
            <FormattedText text={problem} />
        </CardContent>
        </Card>
    </div>
    );
}
