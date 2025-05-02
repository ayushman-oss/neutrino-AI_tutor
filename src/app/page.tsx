
"use client";

import React, { useState, useEffect } from 'react';
import { UrgencyTopicForm, type UrgencyTopicFormData } from '@/components/edugemini/urgency-topic-form';
import { TutoringContentDisplay } from '@/components/edugemini/tutoring-content-display';
import { ChatInterface } from '@/components/edugemini/chat-interface';
// import { TopicOutlineView } from '@/components/edugemini/topic-outline-view'; // No longer used directly here
import { SubtopicSidebar } from '@/components/edugemini/subtopic-sidebar'; // New component for sidebar
import { generateTutoringContent, type GenerateTutoringContentOutput } from '@/ai/flows/generate-tutoring-content';
import { generateSubtopicDetails, type GenerateSubtopicDetailsInput, type GenerateSubtopicDetailsOutput } from '@/ai/flows/generate-subtopic-details'; // New flow import
import { answerEngineeringQuestion, type AnswerEngineeringQuestionInput } from '@/ai/flows/answer-engineering-questions'; // Import input type
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/components/edugemini/chat-interface';
import { BrainCircuit, Download, Menu, BookOpen, ListTree } from 'lucide-react'; // Added Menu, BookOpen, ListTree icons
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarInset } from '@/components/ui/sidebar'; // Import Sidebar components
import { FormattedText } from '@/components/edugemini/formatted-text'; // Import for outline display

interface SubtopicDetailCache {
  [key: string]: GenerateSubtopicDetailsOutput;
}

export default function Home() {
  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low' | ''>('');
  const [topic, setTopic] = useState('');
  const [tutoringContent, setTutoringContent] = useState<GenerateTutoringContentOutput | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [subtopicDetails, setSubtopicDetails] = useState<GenerateSubtopicDetailsOutput | null>(null);
  const [subtopicDetailCache, setSubtopicDetailCache] = useState<SubtopicDetailCache>({}); // Cache for subtopic details
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [learningProgress, setLearningProgress] = useState(''); // Kept for potential future use, but not sent to AI
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingSubtopic, setIsGeneratingSubtopic] = useState(false); // Loading state for subtopic details
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default sidebar state

  useEffect(() => {
    setInitialLoad(false);
  }, []);

  // Effect to fetch subtopic details when selectedSubtopic changes
  useEffect(() => {
    if (selectedSubtopic && topic && urgency && tutoringContent) {
      fetchSubtopicDetails(selectedSubtopic);
    } else {
      setSubtopicDetails(null); // Clear details if no subtopic is selected (showing outline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubtopic]); // Only run when selectedSubtopic changes

  const handleGenerateContent = async (data: UrgencyTopicFormData) => {
    setIsGeneratingContent(true);
    setTutoringContent(null);
    setSelectedSubtopic(null);
    setSubtopicDetails(null);
    setSubtopicDetailCache({}); // Clear cache on new topic
    setChatMessages([]);
    setUrgency(data.urgency);
    setTopic(data.topic);
    setLearningProgress(''); // Clear progress

    try {
      const content = await generateTutoringContent({ topic: data.topic, urgency: data.urgency });
      setTutoringContent(content);
      // No need to set learning progress here anymore
      setChatMessages([
        { id: Date.now().toString(), sender: 'system', text: `Great! Let's start learning about **${data.topic}**. I've generated an outline and key subtopics for you based on your **${data.urgency}** urgency level.` },
        { id: (Date.now() + 1).toString(), sender: 'system', text: `Use the sidebar to navigate through the subtopics or ask me any questions you have!` },
      ]);
      // Keep outline view initially by setting selectedSubtopic to null
      setSelectedSubtopic(null);
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
            description = error.message || description; // Use error message if available
        }


        toast({
            title: "Error Generating Content",
            description: description,
            variant: "destructive",
        });
        setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: chatErrorMessage, timestamp: new Date() }]);
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
          // No need to update learning progress in chat
          return;
       }


    setIsGeneratingSubtopic(true);
    setSubtopicDetails(null); // Clear previous details

    try {
      const input: GenerateSubtopicDetailsInput = {
        topic: topic,
        subtopic: subtopic,
        urgency: urgency,
        learningProgress: learningProgress, // Send current learning progress
      };
      const details = await generateSubtopicDetails(input);
      setSubtopicDetails(details);
      // Add to cache
      setSubtopicDetailCache(prevCache => ({ ...prevCache, [subtopic]: details }));
      // No need to update learning progress in chat
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
       // Display error in the content area
       setSubtopicDetails({ explanation: `Error loading details for ${subtopic}. ${description}`, keyPoints: [], example: undefined, formula: undefined });
    } finally {
      setIsGeneratingSubtopic(false);
    }
  };


  const handleSubtopicSelect = (subtopic: string | null) => {
    setSelectedSubtopic(subtopic);
    // No chat message or learning progress update needed for navigation
  };


  const handleSendMessage = async (message: string) => {
    if (!topic || !urgency || !tutoringContent) return;

    const newUserMessage: Message = { id: Date.now().toString(), sender: 'user', text: message, timestamp: new Date() };
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsAnsweringQuestion(true);

    try {
      const input: AnswerEngineeringQuestionInput = {
          topic: topic,
          question: message,
          urgency: urgency,
          learningProgress: learningProgress, // Send current learning progress
          selectedSubtopic: selectedSubtopic ?? undefined,
      };
      const response = await answerEngineeringQuestion(input);
      const newAiMessage: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: response.answer, timestamp: new Date() };
      setChatMessages(prev => [...prev, newAiMessage]);
       // No need to update learning progress in chat
    } catch (error: any) {
      console.error("Error answering question:", error);
      let description = "Failed to get an answer. Please try again.";
      let chatErrorMessage = "Sorry, I encountered an error answering your question. Please try again.";

      if (error.message?.includes('503') || error.message?.includes('overloaded')) {
          description = "The AI service is overloaded. Please try asking again shortly.";
          chatErrorMessage = "Sorry, the AI service is overloaded. Try asking again soon.";
      } else if (error.message?.includes('template error')) {
          description = "Internal error processing the request. Please try again.";
          chatErrorMessage = "Sorry, an internal error occurred. Please try asking again.";
      } else {
          description = error.message || description;
      }

      const errorAiMessage: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: chatErrorMessage, timestamp: new Date() };
      setChatMessages(prev => [...prev, errorAiMessage]);
      toast({
        title: "Error Answering Question",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsAnsweringQuestion(false);
    }
  };

   const handleExportContent = () => {
    if (!tutoringContent || !topic) return;

    let contentString = `Topic: ${topic}\nUrgency: ${urgency || 'N/A'}\n\n`;
    contentString += `== Outline ==\n${tutoringContent.outline}\n\n`;
    contentString += `== Initial Explanation ==\n${tutoringContent.explanation}\n\n`; // Add initial explanation
    contentString += `== Initial Example ==\n${tutoringContent.example}\n\n`; // Add initial example
    contentString += `== Initial Problem ==\n${tutoringContent.problem}\n\n`; // Add initial problem

     // Include cached subtopic details
     contentString += `== Subtopic Details ==\n`;
     Object.entries(subtopicDetailCache).forEach(([subtopic, details]) => {
         contentString += `\n--- Subtopic: ${subtopic} ---\n`;
         contentString += `Explanation:\n${details.explanation}\n\n`;
         contentString += `Key Points:\n${details.keyPoints.map(kp => `- ${kp}`).join('\n')}\n\n`;
         if (details.example) contentString += `Example:\n${details.example}\n\n`;
         if (details.formula) contentString += `Formula:\n${details.formula}\n\n`;
     });


    contentString += `\n== Chat History ==\n`;
    chatMessages.forEach(msg => {
        const prefix = msg.sender === 'user' ? 'USER' : (msg.sender === 'ai' ? 'AI' : 'SYSTEM');
        const timestamp = msg.timestamp ? `[${msg.timestamp.toLocaleTimeString()}] ` : '';
        contentString += `${timestamp}${prefix}: ${msg.text}\n`;
    });

    const blob = new Blob([contentString], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${topic.replace(/ /g, '_')}_tutoring_session_${urgency}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Session Exported",
      description: "Tutoring content, subtopic details, and chat history downloaded.",
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

  return (
     <SidebarProvider defaultOpen={true} onOpenChange={setIsSidebarOpen}>
         <div className="min-h-screen bg-secondary">
            {tutoringContent && (
            <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r border-border">
                <SidebarContent className="p-0"> {/* Removed padding for full height content */}
                  <SubtopicSidebar
                    topic={topic}
                    subtopics={tutoringContent.subtopics}
                    selectedSubtopic={selectedSubtopic}
                    onSubtopicSelect={handleSubtopicSelect}
                  />
                </SidebarContent>
            </Sidebar>
            )}

            <SidebarInset>
                 {/* Main Application Content Area */}
                <div className="flex flex-col h-screen"> {/* Ensure container takes full height */}
                    <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-sm flex-shrink-0"> {/* Prevent header from shrinking */}
                        <div className="flex items-center gap-3">
                         {tutoringContent && (
                             <SidebarTrigger className="md:hidden text-primary-foreground hover:bg-primary/80" />
                         )}
                         <BrainCircuit size={28} />
                         <h1 className="text-xl md:text-2xl font-bold">EduGemini</h1>
                         {topic && <span className="text-sm md:text-base opacity-80">| {topic} ({urgency})</span>}
                        </div>
                        {tutoringContent && (
                        <Button variant="secondary" size="sm" onClick={handleExportContent}>
                            <Download className="mr-2 h-4 w-4" /> Export Session
                        </Button>
                        )}
                    </header>

                     <main className="flex-1 overflow-hidden"> {/* Use flex-1 and overflow-hidden for layout */}
                       <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
                         {/* Main Content Area (Left/Top) */}
                          <div className="lg:col-span-2 space-y-6 overflow-y-auto"> {/* Make content area scrollable */}
                             {!tutoringContent && !isGeneratingContent && (
                                <div className="bg-card p-6 rounded-lg shadow max-w-2xl mx-auto"> {/* Center form */}
                                   <UrgencyTopicForm onSubmit={handleGenerateContent} isLoading={isGeneratingContent} />
                                </div>
                             )}

                             {isGeneratingContent && (
                              <div className="bg-card p-6 rounded-lg shadow space-y-4">
                                  <p className="text-lg font-semibold text-center text-primary">Generating learning content for "{topic}" ({urgency} urgency)...</p>
                                  <Skeleton className="h-8 w-1/2 mx-auto" />
                                  <Skeleton className="h-4 w-3/4" />
                                  <Skeleton className="h-4 w-1/2" />
                                  <Skeleton className="h-20 w-full" />
                                  <Skeleton className="h-16 w-full" />
                                  <Skeleton className="h-10 w-full" />
                               </div>
                             )}

                             {tutoringContent && (
                                 <div className="bg-card p-6 rounded-lg shadow">
                                 {selectedSubtopic === null ? (
                                      // Show Outline and initial content when no subtopic is selected
                                       <div className="space-y-6">
                                         <h2 className="text-xl font-semibold text-primary border-b pb-2 mb-4 flex items-center gap-2">
                                             <ListTree /> {topic} - Outline & Overview
                                         </h2>
                                         <div>
                                             <p className="font-semibold mb-2 text-lg">Outline:</p>
                                             <FormattedText text={tutoringContent.outline} />
                                         </div>
                                         <hr className="my-4 border-border" />
                                          {/* Display initial explanation, example, problem here if desired */}
                                          {tutoringContent.explanation && (
                                             <div>
                                                <p className="font-semibold mb-2 text-lg">Initial Explanation ({urgency}):</p>
                                                <FormattedText text={tutoringContent.explanation} />
                                             </div>
                                          )}
                                          {tutoringContent.example && (
                                             <div>
                                                 <p className="font-semibold mb-2 text-lg">Initial Example ({urgency}):</p>
                                                 <FormattedText text={tutoringContent.example} />
                                             </div>
                                          )}
                                          {tutoringContent.problem && (
                                             <div>
                                                 <p className="font-semibold mb-2 text-lg">Initial Problem ({urgency}):</p>
                                                 <FormattedText text={tutoringContent.problem} />
                                             </div>
                                          )}
                                          <p className="text-muted-foreground mt-4">Select a subtopic from the sidebar to view detailed content.</p>
                                       </div>
                                  ) : isGeneratingSubtopic ? (
                                     // Loading state for subtopic details
                                      <div className="space-y-4">
                                         <p className="text-lg font-semibold text-primary">Loading details for "{selectedSubtopic}"...</p>
                                         <Skeleton className="h-6 w-1/3" />
                                         <Skeleton className="h-4 w-full" />
                                         <Skeleton className="h-4 w-5/6" />
                                         <Skeleton className="h-10 w-full" />
                                         <Skeleton className="h-8 w-full" />
                                      </div>
                                  ) : subtopicDetails ? (
                                      // Display fetched subtopic details
                                     <TutoringContentDisplay
                                         content={subtopicDetails} // Pass the fetched subtopic details
                                         selectedSubtopic={selectedSubtopic}
                                         urgency={urgency as 'high' | 'medium' | 'low'}
                                     />
                                 ) : (
                                     // Fallback if details somehow aren't loaded but subtopic is selected
                                     <p>Loading details or select a subtopic from the sidebar...</p>
                                 )}
                                 </div>
                             )}
                          </div>


                          {/* Chat Interface Area (Right/Bottom) */}
                         {tutoringContent && ( // Only show chat if content is loaded
                              <div className="lg:col-span-1 h-full flex flex-col"> {/* Use full height */}
                                 <ChatInterface
                                     messages={chatMessages}
                                     onSendMessage={handleSendMessage}
                                     isLoading={isAnsweringQuestion}
                                     disabled={!tutoringContent}
                                     className="flex-1 min-h-0" // Allow chat to shrink and grow, set min-h-0
                                 />
                              </div>
                          )}

                          {/* Show form again if generation failed and no topic set */}
                         {!tutoringContent && !isGeneratingContent && !topic && (
                             <div className="lg:col-span-3">
                                 <div className="bg-card p-6 rounded-lg shadow max-w-2xl mx-auto">
                                     <UrgencyTopicForm onSubmit={handleGenerateContent} isLoading={isGeneratingContent} />
                                 </div>
                             </div>
                         )}
                         </div>
                     </main>
                 </div>
             </SidebarInset>
         </div>
      </SidebarProvider>
   );
 }
