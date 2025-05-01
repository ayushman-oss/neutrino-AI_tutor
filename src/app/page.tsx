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

    try {
      const content = await generateTutoringContent({ topic: data.topic, urgency: data.urgency });
      setTutoringContent(content);
      setLearningProgress(`Started learning about ${data.topic}. Received outline and subtopics.`);
      // Simpler initial chat messages
      setChatMessages([
        { id: Date.now().toString(), sender: 'ai', text: `Great! Let's start learning about **${data.topic}**. I've generated an outline and key subtopics for you.` },
        { id: (Date.now() + 1).toString(), sender: 'ai', text: `Click on a subtopic to dive deeper, or ask me any questions you have!` },
      ]);
    } catch (error) {
      console.error("Error generating tutoring content:", error);
      toast({
        title: "Error",
        description: "Failed to generate tutoring content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSubtopicSelect = (subtopic: string) => {
    setSelectedSubtopic(subtopic);
    setLearningProgress(prev => `${prev}\nSelected subtopic: "${subtopic}".`);
    // Optionally add a chat message indicating selection
    // setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'system', text: `Viewing details for ${subtopic}` }]);
  };

  const handleBackToOutline = () => {
    setSelectedSubtopic(null);
    setLearningProgress(prev => `${prev}\nReturned to outline view.`);
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
    } catch (error) {
      console.error("Error answering question:", error);
      const errorAiMessage: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: "Sorry, I encountered an error trying to answer your question. Please try asking again." };
      setChatMessages(prev => [...prev, errorAiMessage]);
      toast({
        title: "Error",
        description: "Failed to get an answer from the AI. Please try again.",
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
    contentString += `== Explanation (Overall) ==\n${explanation}\n\n`;
    contentString += `== Example (Overall) ==\n${example}\n\n`;
    contentString += `== Practice Problem (Overall) ==\n${problem}\n\n`;
    // Note: The explanation, example, and problem are currently for the main topic, not per subtopic.

    const blob = new Blob([contentString], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${topic.replace(/ /g, '_')}_tutoring_content.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Content Exported",
      description: "The tutoring content has been downloaded as a text file.",
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
              <Download className="mr-2 h-4 w-4" /> Export Content
            </Button>
          )}
        </header>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area (Left/Top) */}
          <div className="lg:col-span-2 space-y-6">
            {!tutoringContent && !isGeneratingContent && (
              <UrgencyTopicForm onSubmit={handleGenerateContent} />
            )}

            {isGeneratingContent && (
               <div className="space-y-4">
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
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Outline
                    </Button>
                    <TutoringContentDisplay
                        content={tutoringContent}
                        selectedSubtopic={selectedSubtopic} // Pass selected subtopic
                    />
                  </>
                ) : (
                  <TopicOutlineView
                    outline={tutoringContent.outline}
                    subtopics={tutoringContent.subtopics}
                    onSubtopicSelect={handleSubtopicSelect}
                  />
                )}
              </>
            )}
          </div>

          {/* Chat Interface Area (Right/Bottom) */}
          {tutoringContent && (
            <div className="lg:col-span-1">
              <ChatInterface
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isLoading={isAnsweringQuestion}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
