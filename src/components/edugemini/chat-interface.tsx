"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image'; // Import next/image

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: Date; // Optional timestamp
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean; // To show loading indicator for AI response
}

// Helper to format text with potential markdown (simple version) - same as in TutoringContentDisplay
const FormattedChatMessage: React.FC<{ text: string }> = ({ text }) => {
    // Basic markdown-like formatting for bold and lists
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/^- (.*)/gm, '<li style="margin-left: 1.5rem; list-style: disc;">$1</li>'); // List items

    // Split by newlines and wrap paragraphs, handling list context
    let html = '';
    let inList = false;
    formatted.split('\n').forEach(line => {
      if (line.startsWith('<li')) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += line;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        // Add paragraph tags only if the line is not empty
        if (line.trim()) {
         html += `<p>${line}</p>`;
        } else {
         // Preserve empty lines for spacing if needed, or just skip
         // html += '<br />'; // Optional: if you want to represent empty lines
        }
      }
    });
    if (inList) {
      html += '</ul>'; // Close list if it's the last element
    }

    return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-2" />;
  };


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
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);


  return (
    <div className="flex flex-col h-[60vh] border rounded-lg overflow-hidden">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef} viewportRef={viewportRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.sender === 'ai' && (
                <Avatar className="h-8 w-8 border border-accent">
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
                  "max-w-[75%] rounded-lg p-3 text-sm",
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                <FormattedChatMessage text={message.text} />
              </div>
              {message.sender === 'user' && (
                <Avatar className="h-8 w-8 border">
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
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Avatar className="h-8 w-8 border border-accent">
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
