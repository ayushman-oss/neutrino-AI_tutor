
"use client";

import React, { useState, useEffect } from 'react';
import { UrgencyTopicForm, type UrgencyTopicFormData } from '@/components/edugemini/urgency-topic-form';
import { TutoringContentDisplay } from '@/components/edugemini/tutoring-content-display';
import { ChatInterface } from '@/components/edugemini/chat-interface';
import { SubtopicSidebar } from '@/components/edugemini/subtopic-sidebar';
import { generateTutoringContent, type GenerateTutoringContentOutput } from '@/ai/flows/generate-tutoring-content';
import { generateSubtopicDetails, type GenerateSubtopicDetailsInput, type GenerateSubtopicDetailsOutput } from '@/ai/flows/generate-subtopic-details';
import { answerEngineeringQuestion, type AnswerEngineeringQuestionInput } from '@/ai/flows/answer-engineering-questions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/components/edugemini/chat-interface';
import { BrainCircuit, Download, Menu, BookOpen, ListTree, HelpCircle } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarInset } from '@/components/ui/sidebar';
import { FormattedText } from '@/components/edugemini/formatted-text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface SubtopicDetailCache {
  [key: string]: GenerateSubtopicDetailsOutput;
}

interface QnARecord {
  question: string;
  answer: string;
}

export default function Home() {
  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low' | ''>('');
  const [topic, setTopic] = useState('');
  const [tutoringContent, setTutoringContent] = useState<GenerateTutoringContentOutput | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [subtopicDetails, setSubtopicDetails] = useState<GenerateSubtopicDetailsOutput | null>(null);
  const [subtopicDetailCache, setSubtopicDetailCache] = useState<SubtopicDetailCache>({});
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [learningProgress, setLearningProgress] = useState(''); // Kept for potential future use
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingSubtopic, setIsGeneratingSubtopic] = useState(false);
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // State for Q&A handling
  const [viewMode, setViewMode] = useState<'outline' | 'subtopic' | 'qna'>('outline');
  // Removed currentQnA state, will derive from history and selected index
  const [qnaHistory, setQnaHistory] = useState<QnARecord[]>([]); // History of Q&A pairs
  const [selectedQnAIndex, setSelectedQnAIndex] = useState<number | null>(null); // Index of the selected Q&A


  useEffect(() => {
    setInitialLoad(false);
  }, []);

  // Effect to fetch subtopic details when selectedSubtopic changes AND viewMode is 'subtopic'
  useEffect(() => {
    if (viewMode === 'subtopic' && selectedSubtopic && topic && urgency && tutoringContent) {
      fetchSubtopicDetails(selectedSubtopic);
    } else if (viewMode === 'outline') {
        setSubtopicDetails(null); // Clear details when viewing outline
        // Don't clear QnA, just ensure nothing is selected
        setSelectedQnAIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedSubtopic]); // Run when viewMode or selectedSubtopic changes

  const handleGenerateContent = async (data: UrgencyTopicFormData) => {
    setIsGeneratingContent(true);
    setTutoringContent(null);
    setSelectedSubtopic(null);
    setSubtopicDetails(null);
    setSubtopicDetailCache({});
    setChatMessages([]);
    setQnaHistory([]); // Clear Q&A history
    setSelectedQnAIndex(null); // Clear selected Q&A
    setUrgency(data.urgency);
    setTopic(data.topic);
    setLearningProgress('');
    setViewMode('outline'); // Start in outline view

    try {
      const content = await generateTutoringContent({ topic: data.topic, urgency: data.urgency });
      setTutoringContent(content);
      // Clear chat messages
      setChatMessages([]);
    } catch (error: any) {
        console.error("Error generating tutoring content:", error);
        let description = "Failed to generate tutoring content. Please try again.";
        let chatErrorMessage = "Sorry, I encountered an error trying to generate content. Please try selecting the topic and urgency again.";

        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
            description = "The AI service is currently overloaded. Please try again shortly.";
            chatErrorMessage = "Sorry, the AI service is overloaded. Try again soon.";
        } else if (error.message?.includes('Invalid output format') || error.message?.includes('template error')) {
            description = "There was an issue formatting the content. Please try again.";
             chatErrorMessage = "Sorry, I had trouble formatting the content. Please try generating it again.";
        } else {
            description = error.message || description;
        }

        toast({
            title: "Error Generating Content",
            description: description,
            variant: "destructive",
        });
        // Add error message to chat input area? No, chat history is hidden now.
        // Just reset state.
        setTopic('');
        setUrgency('');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const fetchSubtopicDetails = async (subtopic: string) => {
      if (!topic || !urgency || !tutoringContent) return;

       // Check cache first
       if (subtopicDetailCache[subtopic]) {
          setSubtopicDetails(subtopicDetailCache[subtopic]);
          return;
       }

    setIsGeneratingSubtopic(true);
    setSubtopicDetails(null); // Clear previous details

    try {
      const input: GenerateSubtopicDetailsInput = {
        topic: topic,
        subtopic: subtopic,
        urgency: urgency,
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
    setSelectedQnAIndex(null); // Clear QnA selection when navigating subtopics/outline
    if (subtopic) {
        setViewMode('subtopic');
        // Fetching details is handled by the useEffect
    } else {
        setViewMode('outline');
    }
  };

   const handleQnASelect = (index: number | null) => {
       setSelectedQnAIndex(index);
       setSelectedSubtopic(null); // Clear subtopic selection
       if (index !== null) {
           setViewMode('qna');
       } else {
           // If index is null, default to outline view
           setViewMode('outline');
       }
   };

  const handleSendMessage = async (message: string) => {
    if (!topic || !urgency || !tutoringContent) return;

    // Don't add user message to chat history UI
    // const newUserMessage: Message = { id: Date.now().toString(), sender: 'user', text: message, timestamp: new Date() };
    // setChatMessages(prev => [...prev, newUserMessage]);

    setIsAnsweringQuestion(true);

    try {
      const input: AnswerEngineeringQuestionInput = {
          topic: topic,
          question: message,
          urgency: urgency,
          learningProgress: learningProgress,
          // selectedSubtopic: viewMode === 'subtopic' ? selectedSubtopic : undefined, // Keep context if needed? Maybe not for general Q&A.
      };
      const response = await answerEngineeringQuestion(input);
      const newQnA = { question: message, answer: response.answer };

      // Add the new QnA to the history and get its index
      const newHistory = [...qnaHistory, newQnA];
      const newIndex = newHistory.length - 1;

      setQnaHistory(newHistory);
      setSelectedQnAIndex(newIndex); // Select the newly added QnA
      setSelectedSubtopic(null); // Clear subtopic selection
      setViewMode('qna'); // Switch view to show Q&A

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

      // Display error using toast
      toast({
        title: "Error Answering Question",
        description: description,
        variant: "destructive",
      });
      // No chat error message needed as history is hidden
    } finally {
      setIsAnsweringQuestion(false);
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

    // Include Q&A History
    contentString += `\n== Questions & Answers ==\n`;
    qnaHistory.forEach((qna, index) => {
        contentString += `\n--- Q&A #${index + 1} ---\n`;
        contentString += `Question:\n${qna.question}\n\n`;
        contentString += `Answer:\n${qna.answer}\n\n`;
    });


    // Include Chat History (Messages) - Removed as chat history is hidden
    // contentString += `\n== Chat History (Messages) ==\n`;
    // chatMessages.forEach(msg => {
    //     const prefix = msg.sender === 'user' ? 'USER' : (msg.sender === 'ai' ? 'AI' : 'SYSTEM');
    //     const timestamp = msg.timestamp ? `[${msg.timestamp.toLocaleTimeString()}] ` : '';
    //     contentString += `${timestamp}${prefix}: ${msg.text}\n`;
    // });

    const blob = new Blob([contentString], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${topic.replace(/ /g, '_')}_tutoring_session_${urgency}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Session Exported",
      description: "Tutoring content, subtopic details, and Q&A downloaded.",
    });
  };


  if (initialLoad) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4 md:p-8">
        <Skeleton className="h-16 w-full max-w-4xl mb-4" />
        <Skeleton className="h-64 w-full max-w-4xl" />
      </div>
    );
  }

  const renderMainContent = () => {
     if (isGeneratingContent) {
          return (
              <div className="bg-card p-6 rounded-lg shadow space-y-4">
                  <p className="text-lg font-semibold text-center text-primary">Generating learning content for "{topic}"...</p>
                  <Skeleton className="h-8 w-1/2 mx-auto" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-10 w-full" />
               </div>
           );
      }

      // Show form only if no content has been generated yet
      if (!tutoringContent) {
           return (
               <div className="bg-card p-6 rounded-lg shadow max-w-2xl mx-auto mt-8">
                  <UrgencyTopicForm onSubmit={handleGenerateContent} isLoading={isGeneratingContent} />
               </div>
           );
      }

      switch (viewMode) {
        case 'outline':
          return (
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
              <p className="text-muted-foreground mt-4 text-sm">Select a subtopic or Q&amp;A from the sidebar, or ask a new question below.</p>
            </div>
          );

        case 'subtopic':
          if (isGeneratingSubtopic) {
            return (
              <div className="bg-card p-4 md:p-6 rounded-lg shadow space-y-4">
                 <p className="text-lg font-semibold text-primary">Loading details for "{selectedSubtopic}"...</p>
                 <Skeleton className="h-6 w-1/3" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-5/6" />
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-8 w-full" />
              </div>
            );
          }
          if (subtopicDetails && selectedSubtopic) {
            return (
              <div className="bg-card p-4 md:p-6 rounded-lg shadow">
                <TutoringContentDisplay
                    content={subtopicDetails}
                    selectedSubtopic={selectedSubtopic}
                    urgency={urgency as 'high' | 'medium' | 'low'}
                    topic={topic} // Pass topic for image search hint
                />
              </div>
            );
          }
          return (
             <div className="bg-card p-4 md:p-6 rounded-lg shadow">
                 <p>Loading details or select a subtopic...</p>
             </div>
           );

        case 'qna':
           if (isAnsweringQuestion && selectedQnAIndex === qnaHistory.length - 1) { // Show loading only for the *newest* QnA being generated
             return (
               <div className="bg-card p-4 md:p-6 rounded-lg shadow space-y-4">
                  <p className="text-lg font-semibold text-primary">Getting answer for Q&amp;A #{selectedQnAIndex + 1}...</p>
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-10 w-full" />
               </div>
             );
           }
          const currentQnA = selectedQnAIndex !== null ? qnaHistory[selectedQnAIndex] : null;
          if (currentQnA && selectedQnAIndex !== null) {
            return (
              <Card className="bg-card p-4 md:p-6 rounded-lg shadow">
                  <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                         <HelpCircle /> Q&amp;A #{selectedQnAIndex + 1}
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div>
                         <p className="font-semibold text-lg mb-2">Question:</p>
                         <p className="ml-4 italic">{currentQnA.question}</p>
                      </div>
                      <hr className="border-border"/>
                      <div>
                         <p className="font-semibold text-lg mb-2">Answer:</p>
                         <FormattedText text={currentQnA.answer} />
                      </div>
                  </CardContent>
              </Card>
            );
          }
           return (
              <div className="bg-card p-4 md:p-6 rounded-lg shadow">
                  <p>Select a Q&amp;A from the sidebar or ask a question using the input box below.</p>
              </div>
           );

        default:
          return null; // Should not happen
      }
  };

  return (
     <SidebarProvider defaultOpen={true} onOpenChange={setIsSidebarOpen}>
         <div className="min-h-screen bg-secondary">
            {/* Sidebar is only rendered if content exists */}
            {tutoringContent && (
            <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r border-border">
                <SidebarContent className="p-0">
                  <SubtopicSidebar
                    topic={topic}
                    subtopics={tutoringContent.subtopics}
                    qnaHistory={qnaHistory} // Pass Q&A history
                    selectedSubtopic={selectedSubtopic}
                    selectedQnAIndex={selectedQnAIndex} // Pass selected Q&A index
                    onSubtopicSelect={handleSubtopicSelect}
                    onQnASelect={handleQnASelect} // Pass Q&A selection handler
                    currentView={viewMode}
                  />
                </SidebarContent>
            </Sidebar>
            )}

            {/* Main content area */}
            <SidebarInset>
                <div className="flex flex-col h-screen">
                    <header className="bg-primary text-primary-foreground p-3 md:p-4 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-sm flex-shrink-0">
                        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                         {/* Show sidebar trigger only when content exists */}
                         {tutoringContent && (
                             <SidebarTrigger className="md:hidden text-primary-foreground hover:bg-primary/80 flex-shrink-0" />
                         )}
                         <BrainCircuit size={24} className="flex-shrink-0 md:hidden" />
                         <BrainCircuit size={28} className="flex-shrink-0 hidden md:block" />
                         <h1 className="text-lg md:text-2xl font-bold truncate">EduGemini</h1>
                         {/* Display topic only if available */}
                         {topic && <span className="text-sm md:text-base opacity-80 hidden sm:inline">| {topic}</span>}
                        </div>
                        {/* Show export button only when content exists */}
                        {tutoringContent && (
                        <Button variant="secondary" size="sm" onClick={handleExportContent} className="flex-shrink-0">
                            <Download className="mr-1 md:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Export Session</span>
                            <span className="sm:hidden">Export</span>
                        </Button>
                        )}
                    </header>

                     {/* Adjusted layout: Main content flows vertically, chat input at the bottom */}
                     <main className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">
                        {/* Scrollable content area */}
                        <div className="flex-1 overflow-y-auto mb-4"> {/* Removed space-y-6 */}
                            {renderMainContent()}
                        </div>

                        {/* Fixed Chat Input Area at the bottom */}
                        {tutoringContent && (
                            <div className="flex-shrink-0 mt-auto">
                                <ChatInterface
                                    messages={[]} // Pass empty array to hide history
                                    onSendMessage={handleSendMessage}
                                    isLoading={isAnsweringQuestion}
                                    disabled={!tutoringContent || isGeneratingContent}
                                    showHistory={false} // Prop to hide history display
                                    className="border rounded-lg shadow-sm" // Ensure styling is applied
                                />
                            </div>
                        )}

                     </main>
                 </div>
             </SidebarInset>
         </div>
      </SidebarProvider>
   );
 }
