
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { List, BookOpen, HelpCircle, FileQuestion, CheckSquare, Lock } from 'lucide-react'; // Added CheckSquare, Lock
import type { ViewMode } from '@/app/page'; // Import ViewMode type


interface QnARecord {
  question: string;
  answer: string;
}

interface SubtopicSidebarProps {
  topic: string;
  subtopics: string[];
  qnaHistory: QnARecord[];
  selectedSubtopic: string | null;
  selectedQnAIndex: number | null;
  onSubtopicSelect: (subtopic: string | null) => void;
  onQnASelect: (index: number | null) => void;
  onQuizSelect: () => void; // Handler for selecting the quiz
  currentView: ViewMode;
  viewedSubtopics: Set<string>; // Set of viewed subtopic names
  isQuizAvailable: boolean; // Flag indicating if quiz can be taken
}

export function SubtopicSidebar({
  topic,
  subtopics,
  qnaHistory,
  selectedSubtopic,
  selectedQnAIndex,
  onSubtopicSelect,
  onQnASelect,
  onQuizSelect,
  currentView,
  viewedSubtopics,
  isQuizAvailable,
}: SubtopicSidebarProps) {

   const isOutlineSelected = currentView === 'outline';

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
           {/* Outline Button */}
           <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sm",
                  isOutlineSelected
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/80'
                )}
                onClick={() => onSubtopicSelect(null)}
            >
                <List className="mr-2 h-4 w-4" />
                Outline / Overview
            </Button>

          {/* Subtopics Section */}
          {subtopics.map((subtopic) => {
            const isViewed = viewedSubtopics.has(subtopic);
            return (
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
                 {isViewed ? (
                    <CheckSquare className="mr-2 h-4 w-4 text-green-500" />
                 ) : (
                    <span className="mr-2 h-4 w-4"></span> // Placeholder for alignment
                 )}
                <span className="flex-grow text-left">{subtopic}</span>
                </Button>
            );
           })}

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

            {/* Quiz Section */}
            <>
               <Separator className="my-2 bg-sidebar-border" />
               <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sm",
                    currentView === 'quiz'
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'hover:bg-sidebar-accent/80',
                    !isQuizAvailable && 'opacity-50 cursor-not-allowed hover:bg-transparent' // Style for disabled state
                  )}
                  onClick={onQuizSelect}
                  disabled={!isQuizAvailable}
                  title={isQuizAvailable ? "Take the quiz!" : "View all subtopics to unlock the quiz"}
                >
                  {isQuizAvailable ? <FileQuestion className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                  Quiz
                </Button>
            </>

        </nav>
      </ScrollArea>
      {/* Progress indicator (optional) */}
       <div className="p-2 border-t border-sidebar-border text-xs text-center text-sidebar-foreground/70">
          {subtopics.length > 0 ? (
            <span>
               {viewedSubtopics.size} / {subtopics.length} subtopics viewed
             </span>
           ) : (
             <span>Loading subtopics...</span>
           )}
       </div>
    </div>
  );
}
