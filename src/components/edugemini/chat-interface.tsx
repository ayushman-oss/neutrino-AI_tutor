
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, Info } from 'lucide-react'; // Added Info icon
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
  disabled?: boolean; // To disable input/sending
  className?: string; // Allow passing custom classes
}

export function ChatInterface({ messages, onSendMessage, isLoading = false, disabled = false, className }: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (inputMessage.trim() && !isLoading && !disabled) {
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
      }, 100); // Increased delay slightly
    }
  }, [messages, isLoading]);


  return (
    // Use flex-1 to take available space, min-h-0 to allow shrinking, and overflow-hidden
    <div className={cn("flex flex-col border rounded-lg overflow-hidden bg-card shadow-sm", className)}>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef} viewportRef={viewportRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.sender === 'user' ? 'justify-end' : 'justify-start',
                 message.sender === 'system' ? 'text-muted-foreground text-xs italic justify-center' : '' // Style system messages
              )}
            >
              {message.sender === 'ai' && (
                <Avatar className="h-8 w-8 border border-accent flex-shrink-0">
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
              {message.sender === 'system' && (
                  <Info className="h-4 w-4 mr-2 flex-shrink-0" /> // Icon for system messages
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-lg p-3 text-sm break-words",
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.sender === 'ai'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-transparent p-0', // No background for system messages
                  message.sender !== 'system' ? 'shadow-sm' : '' // Add slight shadow to user/ai messages
                )}
              >
                 {/* System messages are plain text, others use formatting */}
                {message.sender === 'system' ? (
                    <span>{message.text}</span>
                ) : (
                    <FormattedChatMessage text={message.text} />
                )}
              </div>
              {message.sender === 'user' && (
                <Avatar className="h-8 w-8 border flex-shrink-0">
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
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Avatar className="h-8 w-8 border border-accent flex-shrink-0">
                 <Image
                      src={`https://picsum.photos/seed/ai_loading/40/40`}
                      alt="AI Avatar"
                      width={40}
                      height={40}
                      data-ai-hint="robot bot loading"
                      className="rounded-full"
                  />
                <AvatarFallback>
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-secondary text-secondary-foreground rounded-lg p-3 text-sm shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4 bg-background flex items-center gap-2 flex-shrink-0"> {/* Prevent input area from shrinking */}
        <Textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "Generate content first..." : "Ask a follow-up question..."}
          className="flex-1 resize-none min-h-[40px]"
          rows={1}
          disabled={isLoading || disabled} // Disable if AI is thinking OR if main content failed
          aria-label="Chat input"
        />
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={isLoading || disabled || !inputMessage.trim()} // Also disable if input is empty
          className="bg-accent hover:bg-accent/90 text-accent-foreground disabled:bg-muted disabled:text-muted-foreground"
          aria-label="Send message"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}
