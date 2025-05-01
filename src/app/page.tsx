"use client";

import React, { useState, useEffect } from 'react';
import { UrgencyTopicForm, type UrgencyTopicFormData } from '@/components/edugemini/urgency-topic-form';
import { TutoringContentDisplay } from '@/components/edugemini/tutoring-content-display';
import { ChatInterface } from '@/components/edugemini/chat-interface';
import { generateTutoringContent, type GenerateTutoringContentOutput } from '@/ai/flows/generate-tutoring-content';
import { answerEngineeringQuestion } from '@/ai/flows/answer-engineering-questions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/components/edugemini/chat-interface';
import { BrainCircuit } from 'lucide-react';

export default function Home() {
  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low' | ''>('');
  const [topic, setTopic] = useState('');
  const [tutoringContent, setTutoringContent] = useState<GenerateTutoringContentOutput | null>(null);
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
    setChatMessages([]); // Clear chat history
    setUrgency(data.urgency);
    setTopic(data.topic);

    try {
      const content = await generateTutoringContent({ topic: data.topic, urgency: data.urgency });
      setTutoringContent(content);
      setLearningProgress(`Started learning about ${data.topic}. Covered outline and initial explanation.`);
      setChatMessages([
        { id: Date.now().toString(), sender: 'ai', text: `Great! Let's start learning about ${data.topic}. Here's an overview:` },
        { id: (Date.now() + 1).toString(), sender: 'ai', text: `**Outline:**\n${content.outline}\n\n**Subtopics:**\n${content.subtopics.map(s => `- ${s}`).join('\n')}\n\n**Explanation:**\n${content.explanation}\n\n**Example:**\n${content.example}\n\n**Practice Problem:**\n${content.problem}` },
        { id: (Date.now() + 2).toString(), sender: 'ai', text: `Do you have any questions about this initial content, or shall we move to the first subtopic?` },
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
        <header className="bg-primary text-primary-foreground p-4 md:p-6 flex items-center gap-3">
           <BrainCircuit size={32} />
           <h1 className="text-2xl md:text-3xl font-bold">EduGemini</h1>
        </header>

        <div className="p-6 md:p-8">
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
            <div className="space-y-6">
              {/* Display area for core content (optional, as chat shows initial content) */}
              {/* <TutoringContentDisplay content={tutoringContent} /> */}

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
