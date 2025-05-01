"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTree } from 'lucide-react';
import { FormattedText } from '@/components/edugemini/formatted-text'; // Import shared component

interface TopicOutlineViewProps {
  topic: string; // Add topic prop
  outline: string;
  subtopics: string[];
  onSubtopicSelect: (subtopic: string) => void;
}

export function TopicOutlineView({ topic, outline, subtopics, onSubtopicSelect }: TopicOutlineViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary text-xl md:text-2xl"> {/* Adjusted size */}
          <ListTree /> {topic} - Outline & Subtopics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-semibold mb-2 text-lg">Outline:</p> {/* Made outline title slightly larger */}
          <FormattedText text={outline} />
        </div>

        <hr className="my-4 border-border" />

        <div>
          <p className="font-semibold mb-2 text-lg">Subtopics (Click to explore):</p> {/* Made subtopic title slightly larger */}
          <ul className="list-none space-y-2">
            {subtopics.map((subtopic, index) => (
              <li key={index} className="flex items-start">
                 {/* Use FormattedText for subtopic button text if subtopics can contain markdown */}
                <button
                  onClick={() => onSubtopicSelect(subtopic)}
                  className="flex items-start text-left w-full p-2 rounded-md hover:bg-accent/10 transition-colors duration-150 text-base" /* Ensure base text size */
                >
                  <span className="text-accent mr-2 mt-1 flex-shrink-0">•</span> {/* Added flex-shrink-0 */}
                  {/* If subtopics are plain text, simple span is fine */}
                   <span className="flex-grow break-words">{subtopic}</span>
                  {/* If subtopics might have markdown: */}
                  {/* <FormattedText text={subtopic} /> */}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
