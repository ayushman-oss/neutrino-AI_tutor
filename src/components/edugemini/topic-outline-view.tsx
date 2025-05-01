"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTree } from 'lucide-react';
import { FormattedText } from '@/components/edugemini/formatted-text'; // Import shared component

interface TopicOutlineViewProps {
  outline: string;
  subtopics: string[];
  onSubtopicSelect: (subtopic: string) => void;
}

export function TopicOutlineView({ outline, subtopics, onSubtopicSelect }: TopicOutlineViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <ListTree /> Topic Outline & Subtopics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-semibold mb-2">Outline:</p>
          <FormattedText text={outline} />
        </div>

        <hr className="my-4 border-border" />

        <div>
          <p className="font-semibold mb-2">Subtopics (Click to explore):</p>
          <ul className="list-none space-y-2">
            {subtopics.map((subtopic, index) => (
              <li key={index} className="flex items-start">
                <button
                  onClick={() => onSubtopicSelect(subtopic)}
                  className="flex items-start text-left w-full p-2 rounded-md hover:bg-accent/10 transition-colors duration-150"
                >
                  <span className="text-accent mr-2 mt-1">•</span>
                  <FormattedText text={subtopic} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
