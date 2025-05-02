
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { List, BookOpen } from 'lucide-react'; // Import necessary icons

interface SubtopicSidebarProps {
  topic: string;
  subtopics: string[];
  selectedSubtopic: string | null;
  onSubtopicSelect: (subtopic: string | null) => void;
  currentView: 'outline' | 'subtopic' | 'qna'; // Added to know which view is active
}

export function SubtopicSidebar({
  topic,
  subtopics,
  selectedSubtopic,
  onSubtopicSelect,
  currentView, // Receive currentView
}: SubtopicSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {topic}
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
           {/* Button to go back to Outline View */}
           <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sm",
                  // Highlight if selectedSubtopic is null OR if view is qna (implies outline context)
                  (currentView === 'outline' || currentView === 'qna') && selectedSubtopic === null
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/80'
                )}
                onClick={() => onSubtopicSelect(null)}
            >
                <List className="mr-2 h-4 w-4" />
                Outline / Overview
            </Button>

          {subtopics.map((subtopic) => (
            <Button
              key={subtopic}
              variant="ghost"
              className={cn(
                "w-full justify-start text-sm truncate", // Added truncate for long subtopic names
                // Highlight only if currentView is 'subtopic' and this subtopic is selected
                currentView === 'subtopic' && selectedSubtopic === subtopic
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/80'
              )}
              onClick={() => onSubtopicSelect(subtopic)}
              title={subtopic} // Add title for tooltip on hover for truncated text
            >
              <span className="flex-grow text-left">{subtopic}</span>
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
