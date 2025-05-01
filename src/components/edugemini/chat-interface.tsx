"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { FormattedText as FormattedChatMessage } from '@/components/edugemini/formatted-text'; // Import shared component

export interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system'; // Added 'system' for non-chat messages if needed
  text: string;
  timestamp?: Date; // Optional timestamp
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean; // To show loading indicator for AI response
}

export function ChatInterface({ messages, onSendMessage, isLoading = false }: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    if (viewportRef.current) {
      // Use setTimeout to ensure scroll happens after DOM update
      setTimeout(() => {
          if (viewportRef.current) {
            viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
          }
      }, 0);
    }
  }, [messages, isLoading]);


  return (
    <div className="flex flex-col h-[70vh] lg:h-auto lg:min-h-[500px] border rounded-lg overflow-hidden">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef} viewportRef={viewportRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            // Added check for system messages - rendering differently or not at all
            message.sender !== 'system' && (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.sender === 'ai' && (
                  <Avatar className="h-8 w-8 border border-accent flex-shrink-0">
                    {/* Placeholder using picsum - replace with actual AI avatar if available */}
                    <Image
                        src={`https://picsum.photos/seed/${message.id}/40/40`}
                        alt="AI Avatar"
                        width={40}
                        height={40}
                        data-ai-hint="robot bot"
                        className="rounded-full"
                    />
                    <AvatarFallback>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg p-3 text-sm break-words", // Added break-words
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  <FormattedChatMessage text={message.text} />
                </div>
                {message.sender === 'user' && (
                  <Avatar className="h-8 w-8 border flex-shrink-0">
                     {/* Placeholder using picsum - replace with actual User avatar if available */}
                    <Image
                        src={`https://picsum.photos/seed/${message.id}user/40/40`}
                        alt="User Avatar"
                        width={40}
                        height={40}
                        data-ai-hint="person user"
                        className="rounded-full"
                     />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Avatar className="h-8 w-8 border border-accent flex-shrink-0">
                <AvatarFallback>
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-secondary text-secondary-foreground rounded-lg p-3 text-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4 bg-background flex items-center gap-2">
        <Textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question..."
          className="flex-1 resize-none min-h-[40px]"
          rows={1}
          disabled={isLoading}
        />
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={isLoading || !inputMessage.trim()}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}
