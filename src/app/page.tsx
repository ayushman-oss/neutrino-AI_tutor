
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { UrgencyTopicForm, type UrgencyTopicFormData } from '@/components/edugemini/urgency-topic-form';
import { TutoringContentDisplay } from '@/components/edugemini/tutoring-content-display';
import { ChatInterface } from '@/components/edugemini/chat-interface';
import { SubtopicSidebar } from '@/components/edugemini/subtopic-sidebar';
import { QuizDisplay } from '@/components/edugemini/quiz-display'; // New component for quiz
import { generateTutoringContent, type GenerateTutoringContentOutput } from '@/ai/flows/generate-tutoring-content';
import { generateSubtopicDetails, type GenerateSubtopicDetailsInput, type GenerateSubtopicDetailsOutput } from '@/ai/flows/generate-subtopic-details';
import { answerEngineeringQuestion, type AnswerEngineeringQuestionInput } from '@/ai/flows/answer-engineering-questions';
import { generateQuiz, type GenerateQuizInput, type GenerateQuizOutput } from '@/ai/flows/generate-quiz'; // New flow import
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Download, Menu, BookOpen, ListTree, HelpCircle, FileQuestion, PartyPopper } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FormattedText } from '@/components/edugemini/formatted-text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


interface SubtopicDetailCache {
  [key: string]: GenerateSubtopicDetailsOutput;
}

interface QnARecord {
  question: string;
  answer: string;
}

export type ViewMode = 'outline' | 'subtopic' | 'qna' | 'quiz'; // Added 'quiz'


export default function Home() {
  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low' | ''>('');
  const [topic, setTopic] = useState('');
  const [tutoringContent, setTutoringContent] = useState<GenerateTutoringContentOutput | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [subtopicDetails, setSubtopicDetails] = useState<GenerateSubtopicDetailsOutput | null>(null);
  const [subtopicDetailCache, setSubtopicDetailCache] = useState<SubtopicDetailCache>({});
  const [learningProgress, setLearningProgress] = useState(''); // Kept for potential future use
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingSubtopic, setIsGeneratingSubtopic] = useState(false);
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false); // State for quiz generation
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State for Q&A and Quiz handling
  const [viewMode, setViewMode] = useState<ViewMode>('outline');
  const [qnaHistory, setQnaHistory] = useState<QnARecord[]>([]);
  const [selectedQnAIndex, setSelectedQnAIndex] = useState<number | null>(null);
  const [quizContent, setQuizContent] = useState<GenerateQuizOutput | null>(null); // State for quiz data
  const [viewedSubtopics, setViewedSubtopics] = useState<Set<string>>(new Set()); // Track viewed subtopics
  const [isQuizAvailable, setIsQuizAvailable] = useState(false); // Control quiz availability in sidebar
  const [showQuizPrompt, setShowQuizPrompt] = useState(false); // Controls the congratulatory dialog


  useEffect(() => {
    setInitialLoad(false);
  }, []);

  // Effect to fetch subtopic details or handle view changes
  useEffect(() => {
    if (viewMode === 'subtopic' && selectedSubtopic && topic && urgency && tutoringContent) {
      fetchSubtopicDetails(selectedSubtopic);
      // Add viewed subtopic to set
      setViewedSubtopics(prev => new Set(prev).add(selectedSubtopic));
    } else if (viewMode === 'outline') {
        setSubtopicDetails(null);
        setSelectedQnAIndex(null);
        setQuizContent(null); // Clear quiz when going to outline
    } else if (viewMode === 'qna') {
        setSubtopicDetails(null);
        setQuizContent(null); // Clear quiz when viewing Q&A
    } else if (viewMode === 'quiz') {
        setSubtopicDetails(null);
        setSelectedQnAIndex(null);
        // Ensure quiz is generated if not already
        if (!quizContent && !isGeneratingQuiz && isQuizAvailable) {
            handleStartQuiz();
        }
    }

    // Close sidebar when selection changes
    setIsSidebarOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedSubtopic, selectedQnAIndex]); // Run when viewMode, subtopic or QnA selection changes

  // Effect to check if all subtopics have been viewed
  useEffect(() => {
    if (tutoringContent && tutoringContent.subtopics.length > 0 && viewedSubtopics.size === tutoringContent.subtopics.length) {
      // Only trigger state change if it's not already available
      if (!isQuizAvailable) {
        setIsQuizAvailable(true);
        setShowQuizPrompt(true); // Show prompt only when it becomes available
      }
    } else {
        // Reset if content changes or subtopics aren't all viewed
        if (isQuizAvailable) {
           setIsQuizAvailable(false);
           setShowQuizPrompt(false);
        }
    }
  }, [viewedSubtopics, tutoringContent, isQuizAvailable]);


  const handleGenerateContent = async (data: UrgencyTopicFormData) => {
    setIsGeneratingContent(true);
    setTutoringContent(null);
    setSelectedSubtopic(null);
    setSubtopicDetails(null);
    setSubtopicDetailCache({});
    setQnaHistory([]);
    setSelectedQnAIndex(null);
    setQuizContent(null);
    setViewedSubtopics(new Set());
    setIsQuizAvailable(false);
    setShowQuizPrompt(false);
    setUrgency(data.urgency);
    setTopic(data.topic);
    setLearningProgress('');
    setViewMode('outline');
    setIsSidebarOpen(false);

    try {
      const content = await generateTutoringContent({ topic: data.topic, urgency: data.urgency });
      setTutoringContent(content);
    } catch (error: any) {
        console.error("Error generating tutoring content:", error);
        let description = "Failed to generate tutoring content. Please try again.";

        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
            description = "The AI service is currently overloaded. Please try again shortly.";
        } else if (error.message?.includes('Invalid output format') || error.message?.includes('template error')) {
            description = "There was an issue formatting the content. Please try again.";
        } else {
            description = error.message || description;
        }

        toast({
            title: "Error Generating Content",
            description: description,
            variant: "destructive",
        });
        setTopic('');
        setUrgency('');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const fetchSubtopicDetails = async (subtopic: string) => {
      if (!topic || !urgency || !tutoringContent) return;

       if (subtopicDetailCache[subtopic]) {
          setSubtopicDetails(subtopicDetailCache[subtopic]);
          return;
       }

    setIsGeneratingSubtopic(true);
    setSubtopicDetails(null);

    try {
      const input: GenerateSubtopicDetailsInput = {
        topic: topic,
        subtopic: subtopic,
        urgency: urgency as 'high' | 'medium' | 'low',
        learningProgress: learningProgress,
      };
      const details = await generateSubtopicDetails(input);
      setSubtopicDetails(details);
      setSubtopicDetailCache(prevCache => ({ ...prevCache, [subtopic]: details }));
    } catch (error: any) {
      console.error(`Error generating details for subtopic "${subtopic}":`, error);
      let description = `Failed to generate details for "${subtopic}". Please try again.`;
      if (error.message?.includes('overloaded')) {
         description = `The AI service is overloaded while fetching details for "${subtopic}". Please try again shortly.`;
      } else {
         description = error.message || description;
      }

      toast({
        title: "Error Fetching Subtopic",
        description: description,
        variant: "destructive",
      });
       setSubtopicDetails({ explanation: `Error loading details for ${subtopic}. ${description}`, keyPoints: [], example: undefined, formula: undefined });
    } finally {
      setIsGeneratingSubtopic(false);
    }
  };

  const handleSubtopicSelect = (subtopic: string | null) => {
    setSelectedSubtopic(subtopic);
    setSelectedQnAIndex(null);
    setQuizContent(null); // Clear quiz if selecting subtopic/outline
    if (subtopic) {
        setViewMode('subtopic');
    } else {
        setViewMode('outline');
    }
  };

   const handleQnASelect = (index: number | null) => {
       setSelectedQnAIndex(index);
       setSelectedSubtopic(null);
       setQuizContent(null); // Clear quiz if selecting Q&A
       if (index !== null) {
           setViewMode('qna');
       } else {
           setViewMode('outline'); // Go back to outline if QnA is deselected
       }
   };

    const handleQuizSelect = () => {
        if (!isQuizAvailable) {
            toast({ title: "Quiz Locked", description: "Please view all subtopics before taking the quiz.", variant: "default"});
            return;
        }
        setSelectedQnAIndex(null);
        setSelectedSubtopic(null);
        setViewMode('quiz');
        setIsSidebarOpen(false);
    };

  const handleSendMessage = async (message: string) => {
    if (!topic || !urgency || !tutoringContent) return;

    setIsAnsweringQuestion(true);

    try {
      const input: AnswerEngineeringQuestionInput = {
          topic: topic,
          question: message,
          urgency: urgency as 'high' | 'medium' | 'low',
          learningProgress: learningProgress,
          selectedSubtopic: viewMode === 'subtopic' ? selectedSubtopic || undefined : undefined,
      };
      const response = await answerEngineeringQuestion(input);
      const newQnA = { question: message, answer: response.answer };

      const newHistory = [...qnaHistory, newQnA];
      const newIndex = newHistory.length - 1;

      setQnaHistory(newHistory);
      // Select the newly added Q&A and switch view
      setSelectedQnAIndex(newIndex);
      setSelectedSubtopic(null);
      setQuizContent(null); // Clear quiz when asking question
      setViewMode('qna');
      setIsSidebarOpen(false);

    } catch (error: any) {
      console.error("Error answering question:", error);
      let description = "Failed to get an answer. Please try again.";

      if (error.message?.includes('503') || error.message?.includes('overloaded')) {
          description = "The AI service is overloaded. Please try asking again shortly.";
      } else if (error.message?.includes('template error')) {
          description = "Internal error processing the request. Please try again.";
      } else {
          description = error.message || description;
      }

      toast({
        title: "Error Answering Question",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsAnsweringQuestion(false);
    }
  };


  // Function to trigger quiz generation
  const handleStartQuiz = async () => {
      if (!topic || !urgency || !tutoringContent || !isQuizAvailable) return;

      setIsGeneratingQuiz(true);
      setQuizContent(null); // Clear previous quiz
      setShowQuizPrompt(false); // Close prompt dialog if open
      setViewMode('quiz'); // Ensure view mode is quiz

      try {
          const input: GenerateQuizInput = {
              topic: topic,
              subtopics: tutoringContent.subtopics,
              urgency: urgency as 'high' | 'medium' | 'low',
          };
          const quiz = await generateQuiz(input);
          setQuizContent(quiz);
      } catch (error: any) {
          console.error("Error generating quiz:", error);
          let description = "Failed to generate the quiz. Please try again.";
          if (error.message?.includes('overloaded')) {
              description = "The AI service is overloaded while generating the quiz. Please try again shortly.";
          } else {
              description = error.message || description;
          }
          toast({
              title: "Error Generating Quiz",
              description: description,
              variant: "destructive",
          });
          setViewMode('outline'); // Go back to outline on error
      } finally {
          setIsGeneratingQuiz(false);
      }
  };


   const handleExportContent = () => {
    if (!tutoringContent || !topic) return;

    let contentString = `Topic: ${topic}\nUrgency: ${urgency || 'N/A'}\n\n`;
    contentString += `== Outline ==\n${tutoringContent.outline}\n\n`;
    contentString += `== Initial Explanation ==\n${tutoringContent.explanation}\n\n`;
    contentString += `== Initial Example ==\n${tutoringContent.example}\n\n`;
    contentString += `== Initial Problem ==\n${tutoringContent.problem}\n\n`;

    contentString += `== Subtopic Details ==\n`;
    Object.entries(subtopicDetailCache).forEach(([subtopic, details]) => {
         contentString += `\n--- Subtopic: ${subtopic} ---\n`;
         contentString += `Explanation:\n${details.explanation}\n\n`;
         contentString += `Key Points:\n${details.keyPoints.map(kp => `- ${kp}`).join('\n')}\n\n`;
         if (details.example) contentString += `Example:\n${details.example}\n\n`;
         if (details.formula) contentString += `Formula:\n${details.formula}\n\n`;
     });

    contentString += `\n== Questions & Answers ==\n`;
    qnaHistory.forEach((qna, index) => {
        contentString += `\n--- Q&A #${index + 1} ---\n`;
        contentString += `Question:\n${qna.question}\n\n`;
        contentString += `Answer:\n${qna.answer}\n\n`;
    });

    // Add Quiz Content if available
    if (quizContent && quizContent.questions.length > 0) {
        contentString += `\n== Quiz ==\n`;
        quizContent.questions.forEach((q, index) => {
            contentString += `\n--- Question #${index + 1} ---\n`;
            contentString += `Question:\n${q.question}\n\n`;
            contentString += `Options:\n${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}\n`;
            contentString += `Correct Answer: ${String.fromCharCode(65 + q.correctAnswerIndex)}\n`;
            if (q.explanation) contentString += `Explanation:\n${q.explanation}\n`;
        });
    }

    const blob = new Blob([contentString], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${topic.replace(/ /g, '_')}_tutoring_session.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Session Exported",
      description: "Full tutoring session including Q&A and Quiz downloaded.",
    });
  };


  if (initialLoad) {
    return (
      <div className="h-dvh bg-secondary flex flex-col items-center justify-center p-4 md:p-8 w-screen">
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const renderMainContent = () => {
     if (isGeneratingContent) {
          return (
              <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full pb-20"> {/* Added pb-20 */}
                  <div className="bg-card p-6 rounded-lg shadow space-y-4 w-full mx-auto max-w-4xl">
                      <p className="text-lg font-semibold text-center text-primary">Generating learning content for "{topic}"...</p>
                      <Skeleton className="h-8 w-1/2 mx-auto" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-10 w-full" />
                   </div>
              </div>
           );
      }

      if (!tutoringContent) {
           return (
               <div className="flex-1 flex items-center justify-center p-4 md:p-6 w-full pb-20"> {/* Added pb-20 */}
                   <div className="bg-card p-6 rounded-lg shadow max-w-2xl w-full">
                      <UrgencyTopicForm onSubmit={handleGenerateContent} isLoading={isGeneratingContent} />
                   </div>
               </div>
           );
      }

      // Main content area
      return (
         <div className={`flex-1 overflow-y-auto w-full pb-20`}> {/* Added padding-bottom */}
             <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
                 {viewMode === 'outline' && (
                     <div className="bg-card p-4 md:p-6 rounded-lg shadow space-y-6">
                         <h2 className="text-xl font-semibold text-primary border-b pb-2 mb-4 flex items-center gap-2">
                             <ListTree /> {topic} - Outline & Overview
                         </h2>
                         <div>
                             <p className="font-semibold mb-2 text-lg">Outline:</p>
                             <FormattedText text={tutoringContent.outline} />
                         </div>
                         <hr className="my-4 border-border" />
                         {tutoringContent.explanation && (
                             <div>
                               <p className="font-semibold mb-2 text-lg">Initial Explanation:</p>
                               <FormattedText text={tutoringContent.explanation} />
                             </div>
                         )}
                         {tutoringContent.example && (
                             <div>
                                 <p className="font-semibold mb-2 text-lg">Initial Example:</p>
                                 <FormattedText text={tutoringContent.example} />
                             </div>
                         )}
                         {tutoringContent.problem && (
                             <div>
                                 <p className="font-semibold mb-2 text-lg">Initial Problem:</p>
                                 <FormattedText text={tutoringContent.problem} />
                             </div>
                         )}
                     </div>
                 )}

                 {viewMode === 'subtopic' && (
                     <div>
                         {isGeneratingSubtopic ? (
                            <div className="bg-card p-4 md:p-6 rounded-lg shadow space-y-4">
                                <p className="text-lg font-semibold text-primary">Loading details for "{selectedSubtopic}"...</p>
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-8 w-full" />
                             </div>
                         ) : subtopicDetails && selectedSubtopic ? (
                            <div className="bg-card p-4 md:p-6 rounded-lg shadow">
                                <TutoringContentDisplay
                                    content={subtopicDetails}
                                    selectedSubtopic={selectedSubtopic}
                                    urgency={urgency as 'high' | 'medium' | 'low'} // Pass urgency
                                    topic={topic} // Pass main topic
                                />
                            </div>
                         ) : (
                            <div className="bg-card p-4 md:p-6 rounded-lg shadow">
                                <p>Loading details or select a subtopic...</p>
                            </div>
                         )}
                     </div>
                 )}

                 {viewMode === 'qna' && (
                     <div>
                        {isAnsweringQuestion && selectedQnAIndex === qnaHistory.length - 1 ? (
                            <div className="bg-card p-4 md:p-6 rounded-lg shadow space-y-4">
                                 <p className="text-lg font-semibold text-primary">Getting answer for Q&amp;A #{selectedQnAIndex + 1}...</p>
                                 <Skeleton className="h-6 w-1/4" />
                                 <Skeleton className="h-4 w-full" />
                                 <Skeleton className="h-4 w-5/6" />
                                 <Skeleton className="h-10 w-full" />
                            </div>
                        ) : selectedQnAIndex !== null && qnaHistory[selectedQnAIndex] ? (
                            <Card className="bg-card p-4 md:p-6 rounded-lg shadow">
                                 <CardHeader className="pb-4">
                                     <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                                        <HelpCircle /> Q&amp;A #{selectedQnAIndex + 1}
                                     </CardTitle>
                                 </CardHeader>
                                 <CardContent className="space-y-4">
                                     <div>
                                        <p className="font-semibold text-lg mb-2">Question:</p>
                                        <p className="ml-4 italic">{qnaHistory[selectedQnAIndex].question}</p>
                                     </div>
                                     <hr className="border-border"/>
                                     <div>
                                        <p className="font-semibold text-lg mb-2">Answer:</p>
                                        <FormattedText text={qnaHistory[selectedQnAIndex].answer} />
                                     </div>
                                 </CardContent>
                            </Card>
                        ) : (
                            <div className="bg-card p-4 md:p-6 rounded-lg shadow">
                                <p>Select a Q&amp;A from the sidebar or ask a question using the input box below.</p>
                            </div>
                        )}
                     </div>
                 )}

                 {viewMode === 'quiz' && (
                     <div>
                         {isGeneratingQuiz ? (
                             <div className="bg-card p-4 md:p-6 rounded-lg shadow space-y-4">
                                <p className="text-lg font-semibold text-primary">Generating your quiz...</p>
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-20 w-full mt-4" />
                             </div>
                         ) : quizContent ? (
                             <div className="bg-card p-4 md:p-6 rounded-lg shadow">
                                <QuizDisplay quiz={quizContent} topic={topic} />
                             </div>
                         ) : (
                             <div className="bg-card p-4 md:p-6 rounded-lg shadow">
                                <p>Loading quiz... If this takes too long, try navigating back to the outline and clicking "Take Quiz" again.</p>
                             </div>
                         )}
                     </div>
                 )}
            </div>
         </div>
      );
  };


  return (
    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
         {/* Main layout: Full height, flex column */}
         <div className="h-dvh bg-secondary flex flex-col w-screen overflow-hidden"> {/* Added overflow-hidden */}
            {/* Header: Fixed height, sticky */}
            <header className="bg-primary text-primary-foreground p-3 md:p-4 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                    {/* Sidebar Trigger - Only show when content is loaded */}
                    {tutoringContent && (
                         <SheetTrigger asChild>
                             <Button
                                 variant="ghost"
                                 size="icon"
                                 className="text-primary-foreground hover:bg-primary/80 flex-shrink-0 h-7 w-7 md:h-8 md:w-8"
                                 aria-label="Toggle Navigation"
                             >
                                <Menu className="h-5 w-5" />
                             </Button>
                         </SheetTrigger>
                    )}
                    {/* Branding */}
                    <GraduationCap size={24} className="flex-shrink-0 md:hidden" />
                    <GraduationCap size={28} className="flex-shrink-0 hidden md:block" />
                    <h1 className="text-lg md:text-2xl font-bold truncate">Neutrino</h1> {/* Changed Name */}
                    {topic && <span className="text-sm md:text-base opacity-80 hidden sm:inline">| {topic}</span>}
                </div>
                {/* Export Button */}
                {tutoringContent && (
                <Button variant="secondary" size="sm" onClick={handleExportContent} className="flex-shrink-0">
                    <Download className="mr-1 md:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export Session</span>
                    <span className="sm:hidden">Export</span>
                </Button>
                )}
            </header>

            {/* Main Content Area: Takes remaining space, scrolls */}
            {renderMainContent()}

            {/* Footer Chat Input Area: Fixed height, standard flow */}
             {tutoringContent && (
                 <footer className={`flex-shrink-0 bg-background border-t px-4 py-3 shadow-md`}>
                    <div className="max-w-4xl mx-auto">
                        <ChatInterface
                            messages={[]} // History not shown here
                            onSendMessage={handleSendMessage}
                            isLoading={isAnsweringQuestion}
                            disabled={!tutoringContent || isGeneratingContent || isGeneratingQuiz} // Disable during generations
                            showHistory={false} // Explicitly hide history display
                            className="w-full"
                        />
                    </div>
                 </footer>
             )}

             {/* Sidebar Content (Sheet) */}
             <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
                 {tutoringContent && (
                    <SubtopicSidebar
                        topic={topic}
                        subtopics={tutoringContent.subtopics}
                        qnaHistory={qnaHistory}
                        selectedSubtopic={selectedSubtopic}
                        selectedQnAIndex={selectedQnAIndex}
                        onSubtopicSelect={handleSubtopicSelect}
                        onQnASelect={handleQnASelect}
                        onQuizSelect={handleQuizSelect} // Pass quiz handler
                        currentView={viewMode}
                        viewedSubtopics={viewedSubtopics} // Pass viewed set
                        isQuizAvailable={isQuizAvailable} // Pass availability flag
                    />
                 )}
            </SheetContent>
         </div>

         {/* Quiz Ready Dialog */}
         <AlertDialog open={showQuizPrompt} onOpenChange={setShowQuizPrompt}>
             <AlertDialogContent>
               <AlertDialogHeader>
                 <AlertDialogTitle className="flex items-center gap-2"><PartyPopper className="text-primary" /> Congratulations!</AlertDialogTitle>
                 <AlertDialogDescription>
                   You've explored all the subtopics for "{topic}". Ready to test your knowledge with a quiz?
                 </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                 <AlertDialogCancel onClick={() => setShowQuizPrompt(false)}>Later</AlertDialogCancel>
                 <AlertDialogAction onClick={handleStartQuiz} className="bg-primary hover:bg-primary/90">
                     Start Quiz
                 </AlertDialogAction>
               </AlertDialogFooter>
             </AlertDialogContent>
        </AlertDialog>
      </Sheet>
   );
 }

