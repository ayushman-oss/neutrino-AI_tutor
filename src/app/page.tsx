"use client";

import React, { useState, useEffect } from 'react';
import { UrgencyTopicForm, type UrgencyTopicFormData } from '@/components/edugemini/urgency-topic-form';
import { TutoringContentDisplay } from '@/components/edugemini/tutoring-content-display';
import { ChatInterface } from '@/components/edugemini/chat-interface';
import { TopicOutlineView } from '@/components/edugemini/topic-outline-view'; // New component
import { generateTutoringContent, type GenerateTutoringContentOutput } from '@/ai/flows/generate-tutoring-content';
import { answerEngineeringQuestion } from '@/ai/flows/answer-engineering-questions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Import Button
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/components/edugemini/chat-interface';
import { BrainCircuit, Download, ArrowLeft } from 'lucide-react';

export default function Home() {
  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low' | ''>('');
  const [topic, setTopic] = useState('');
  const [tutoringContent, setTutoringContent] = useState<GenerateTutoringContentOutput | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null); // Track selected subtopic
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [learningProgress, setLearningProgress] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // To prevent hydration issues
  const { toast } = useToast();

  useEffect(() => {
    setInitialLoad(false); // Mark initial load as complete after component mounts
  }, []);

  const handleGenerateContent = async (data: UrgencyTopicFormData) => {
    setIsGeneratingContent(true);
    setTutoringContent(null); // Clear previous content
    setSelectedSubtopic(null); // Reset selected subtopic
    setChatMessages([]); // Clear chat history
    setUrgency(data.urgency);
    setTopic(data.topic);
    // Clear previous learning progress on new topic generation
    setLearningProgress('');

    try {
      const content = await generateTutoringContent({ topic: data.topic, urgency: data.urgency });
      setTutoringContent(content);
      // Initial learning progress message
      setLearningProgress(`Started learning about ${data.topic}. Received outline and subtopics.`);
      // Initial chat messages guiding the user
      setChatMessages([
        { id: Date.now().toString(), sender: 'ai', text: `Great! Let's start learning about **${data.topic}**. I've generated an outline and key subtopics for you based on your **${data.urgency}** urgency level.` },
        { id: (Date.now() + 1).toString(), sender: 'ai', text: `You can review the outline below. Click on a subtopic to see more details, or ask me any questions you have!` },
      ]);
    } catch (error: any) {
        console.error("Error generating tutoring content:", error);
        let description = "Failed to generate tutoring content. Please try again.";
        let chatErrorMessage = "Sorry, I encountered an error trying to generate content. Please try selecting the topic and urgency again.";

        // Check for specific service unavailable/overloaded errors
        if (error.message?.includes('503') || error.message?.includes('Service Unavailable') || error.message?.includes('overloaded')) {
            description = "The AI service is currently experiencing high load. Please try again in a few moments.";
            chatErrorMessage = "Sorry, the AI service is currently overloaded. Please try again in a few moments.";
        } else if (error.message?.includes('Invalid output format')) {
            // Handle potential format errors from the flow
            description = "There was an issue formatting the content from the AI. Please try again.";
             chatErrorMessage = "Sorry, I had trouble formatting the content correctly. Please try generating it again.";
        }

        toast({
            title: "Error Generating Content",
            description: description,
            variant: "destructive",
        });

        // Add a more informative error message to the chat
        const errorAiMessage: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: chatErrorMessage };
        setChatMessages(prev => [...prev, errorAiMessage]);
        // Reset topic/urgency state so user *must* use the form again
        setTopic('');
        setUrgency('');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSubtopicSelect = (subtopic: string) => {
    setSelectedSubtopic(subtopic);
    setLearningProgress(prev => `${prev}\nSelected subtopic: "${subtopic}".`);
    // Add a chat message indicating selection for clarity
    setChatMessages(prev => [
        ...prev,
        {
            id: Date.now().toString(),
            sender: 'system', // Use 'system' for non-chat info, or 'ai' if preferred
            text: `Now viewing details for subtopic: **${subtopic}**`
        }
    ]);
  };

  const handleBackToOutline = () => {
    setSelectedSubtopic(null);
    setLearningProgress(prev => `${prev}\nReturned to outline view.`);
     // Add a chat message indicating return to outline
     setChatMessages(prev => [
        ...prev,
        {
            id: Date.now().toString(),
            sender: 'system',
            text: `Returned to the main outline for **${topic}**.`
        }
    ]);
  };

  const handleSendMessage = async (message: string) => {
    if (!topic || !urgency || !tutoringContent) return;

    const newUserMessage: Message = { id: Date.now().toString(), sender: 'user', text: message };
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsAnsweringQuestion(true);

    try {
      const response = await answerEngineeringQuestion({
        topic: topic,
        question: message,
        urgency: urgency,
        learningProgress: learningProgress,
        selectedSubtopic: selectedSubtopic ?? undefined, // Pass selected subtopic if available
      });
      const newAiMessage: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: response.answer };
      setChatMessages(prev => [...prev, newAiMessage]);
      // Update learning progress based on the question and answer (simplified)
      setLearningProgress(prev => `${prev}\nAsked: "${message}". Received answer.`);
    } catch (error: any) {
      console.error("Error answering question:", error);
      let description = "Failed to get an answer from the AI. Please try again.";
      let chatErrorMessage = "Sorry, I encountered an error trying to answer your question. Please try asking again.";

      // Check for specific service unavailable errors
      if (error.message?.includes('503') || error.message?.includes('Service Unavailable') || error.message?.includes('overloaded')) {
          description = "The AI service is currently experiencing high load. Please try asking again in a few moments.";
          chatErrorMessage = "Sorry, the AI service is currently overloaded. Please try asking again in a few moments.";
      }

      const errorAiMessage: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: chatErrorMessage };
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

   // Basic Export Functionality
   const handleExportContent = () => {
    if (!tutoringContent || !topic) return;

    const { outline, subtopics, explanation, example, problem } = tutoringContent;

    let contentString = `Topic: ${topic}\nUrgency: ${urgency || 'N/A'}\n\n`;
    contentString += `== Outline ==\n${outline}\n\n`;
    contentString += `== Subtopics ==\n${subtopics.map(s => `- ${s}`).join('\n')}\n\n`;
    contentString += `== Explanation (Urgency: ${urgency}) ==\n${explanation}\n\n`;
    contentString += `== Example (Urgency: ${urgency}) ==\n${example}\n\n`;
    contentString += `== Practice Problem (Urgency: ${urgency}) ==\n${problem}\n\n`;
    // Note: The explanation, example, and problem are currently for the main topic, not per subtopic.
    // Append chat history
    contentString += `== Chat History ==\n`;
    chatMessages.forEach(msg => {
        // Include system messages for context during export
        const prefix = msg.sender === 'user' ? 'USER' : (msg.sender === 'ai' ? 'AI' : 'SYSTEM');
        contentString += `${prefix}: ${msg.text}\n`;

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
      description: "The tutoring content and chat history have been downloaded.",
    });
  };

  // Render skeleton during initial load to avoid hydration issues
  if (initialLoad) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-4xl bg-card rounded-lg shadow-lg p-6 md:p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl bg-card rounded-lg shadow-lg overflow-hidden">
        <header className="bg-primary text-primary-foreground p-4 md:p-6 flex items-center justify-between gap-3">
           <div className="flex items-center gap-3">
             <BrainCircuit size={32} />
             <h1 className="text-2xl md:text-3xl font-bold">EduGemini</h1>
           </div>
           {tutoringContent && (
            <Button variant="secondary" size="sm" onClick={handleExportContent}>
              <Download className="mr-2 h-4 w-4" /> Export Session
            </Button>
          )}
        </header>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area (Left/Top) */}
          <div className="lg:col-span-2 space-y-6">
            {!tutoringContent && !isGeneratingContent && (
              <UrgencyTopicForm onSubmit={handleGenerateContent} isLoading={isGeneratingContent} />
            )}

            {isGeneratingContent && (
               <div className="space-y-4">
                 <p className="text-lg font-semibold text-center text-primary">Generating learning content for "{topic}" ({urgency} urgency)...</p>
                 <Skeleton className="h-8 w-1/2" />
                 <Skeleton className="h-4 w-3/4" />
                 <Skeleton className="h-4 w-1/2" />
                 <Skeleton className="h-20 w-full" />
                 <Skeleton className="h-16 w-full" />
                 <Skeleton className="h-10 w-full" />
              </div>
            )}

            {tutoringContent && (
              <>
                {selectedSubtopic ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleBackToOutline}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Outline & Subtopics
                    </Button>
                    <TutoringContentDisplay
                        content={tutoringContent}
                        selectedSubtopic={selectedSubtopic} // Pass selected subtopic
                        urgency={urgency as 'high' | 'medium' | 'low'} // Pass urgency
                    />
                  </>
                ) : (
                  <TopicOutlineView
                    outline={tutoringContent.outline}
                    subtopics={tutoringContent.subtopics}
                    onSubtopicSelect={handleSubtopicSelect}
                    topic={topic} // Pass topic for title
                  />
                )}
              </>
            )}
          </div>

          {/* Chat Interface Area (Right/Bottom) */}
          {/* Show chat only when content generation is complete OR if there was an error after trying */}
          {(tutoringContent || (!isGeneratingContent && topic)) && (
            <div className="lg:col-span-1">
              <ChatInterface
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isLoading={isAnsweringQuestion}
                // Disable input if initial content generation failed
                disabled={!tutoringContent}
              />
            </div>
          )}

           {/* Show form again if generation failed and no content exists and not currently generating */}
           {!tutoringContent && !isGeneratingContent && !topic && (
             <div className="lg:col-span-3"> {/* Span full width if form reappears */}
                <UrgencyTopicForm onSubmit={handleGenerateContent} isLoading={isGeneratingContent} />
             </div>
            )}
        </div>
      </div>
    </div>
  );
}
