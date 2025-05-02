
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator'; // Import Separator
import { cn } from '@/lib/utils';
import { List, BookOpen, HelpCircle } from 'lucide-react'; // Import necessary icons

interface QnARecord {
  question: string;
  answer: string;
}

interface SubtopicSidebarProps {
  topic: string;
  subtopics: string[];
  qnaHistory: QnARecord[]; // Add Q&A history
  selectedSubtopic: string | null;
  selectedQnAIndex: number | null; // Add selected Q&A index
  onSubtopicSelect: (subtopic: string | null) => void;
  onQnASelect: (index: number | null) => void; // Add Q&A selection handler
  currentView: 'outline' | 'subtopic' | 'qna';
}

export function SubtopicSidebar({
  topic,
  subtopics,
  qnaHistory,
  selectedSubtopic,
  selectedQnAIndex,
  onSubtopicSelect,
  onQnASelect,
  currentView,
}: SubtopicSidebarProps) {

   const isOutlineSelected = currentView === 'outline' || (currentView !== 'subtopic' && currentView !== 'qna');

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
                  isOutlineSelected && selectedQnAIndex === null // Highlight only if outline is the active view and no QnA is selected
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/80'
                )}
                onClick={() => onSubtopicSelect(null)} // This should also implicitly trigger QnA deselect via parent logic
            >
                <List className="mr-2 h-4 w-4" />
                Outline / Overview
            </Button>

          {/* Subtopics Section */}
          {subtopics.map((subtopic) => (
            <Button
              key={subtopic}
              variant="ghost"
              className={cn(
                "w-full justify-start text-sm truncate",
                currentView === 'subtopic' && selectedSubtopic === subtopic
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/80'
              )}
              onClick={() => onSubtopicSelect(subtopic)}
              title={subtopic}
            >
              <span className="flex-grow text-left">{subtopic}</span>
            </Button>
          ))}

           {/* Q&A Section */}
           {qnaHistory.length > 0 && (
               <>
                  <Separator className="my-2 bg-sidebar-border" />
                  <p className="px-2 pt-2 text-xs font-semibold text-sidebar-foreground/70 flex items-center gap-1">
                    <HelpCircle className="h-4 w-4" /> Questions & Answers
                  </p>
                  {qnaHistory.map((qna, index) => (
                      <Button
                         key={`qna-${index}`}
                         variant="ghost"
                         className={cn(
                           "w-full justify-start text-sm truncate",
                           currentView === 'qna' && selectedQnAIndex === index
                             ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                             : 'hover:bg-sidebar-accent/80'
                         )}
                         onClick={() => onQnASelect(index)}
                         title={`Q&A #${index + 1}: ${qna.question.substring(0, 50)}${qna.question.length > 50 ? '...' : ''}`}
                       >
                         <span className="flex-grow text-left">Q&amp;A #{index + 1}</span>
                       </Button>
                  ))}
               </>
           )}
        </nav>
      </ScrollArea>
    </div>
  );
}
