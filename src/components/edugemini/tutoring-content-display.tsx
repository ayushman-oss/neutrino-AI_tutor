"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ListTree, TestTubeDiagonal, HelpCircle } from 'lucide-react';
import type { GenerateTutoringContentOutput } from '@/ai/flows/generate-tutoring-content';

interface TutoringContentDisplayProps {
  content: GenerateTutoringContentOutput;
}

// Helper to format text with potential markdown (simple version)
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  // Basic markdown-like formatting for bold and lists
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/^- (.*)/gm, '<li style="margin-left: 1.5rem; list-style: disc;">$1</li>'); // List items

  // Split by newlines and wrap paragraphs
  const paragraphs = formatted.split('\n\n').map((para, index) => `<p key=${index}>${para.replace(/\n/g, '<br />')}</p>`).join('');


  // Replace list markers within paragraphs back to list elements
  const finalHtml = paragraphs.replace(/<p key=\d+><li/g, '<li').replace(/<\/li><\/p>/g, '</li>');

  return <div dangerouslySetInnerHTML={{ __html: finalHtml }} className="space-y-2" />;
};

export function TutoringContentDisplay({ content }: TutoringContentDisplayProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <ListTree /> Topic Outline & Subtopics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
           <p className="font-semibold">Outline:</p>
           <FormattedText text={content.outline} />
           <Separator className="my-4" />
           <p className="font-semibold">Subtopics:</p>
           <ul className="list-none space-y-1">
             {content.subtopics.map((subtopic, index) => (
               <li key={index} className="flex items-start">
                 <span className="text-accent mr-2 mt-1">•</span>
                 <FormattedText text={subtopic} />
               </li>
             ))}
           </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
             <BookOpen /> Explanation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormattedText text={content.explanation} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
             <TestTubeDiagonal /> Example
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormattedText text={content.example} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
             <HelpCircle /> Practice Problem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormattedText text={content.problem} />
        </CardContent>
      </Card>
    </div>
  );
}
