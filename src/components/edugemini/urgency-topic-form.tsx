
"use client";

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle, Zap, Turtle, Rabbit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

const urgencyLevels = [
  { value: 'high', label: 'High (Quick Overview)', icon: Zap },
  { value: 'medium', label: 'Medium (Standard Pace)', icon: Rabbit },
  { value: 'low', label: 'Low (Detailed Study)', icon: Turtle },
] as const;

type UrgencyValue = typeof urgencyLevels[number]['value'];

const formSchema = z.object({
  urgency: z.enum(['high', 'medium', 'low'], {
    required_error: 'Please select an urgency level.',
  }),
  topic: z.string().min(3, {
    message: 'Topic must be at least 3 characters long.',
  }),
});

export type UrgencyTopicFormData = z.infer<typeof formSchema>;

interface UrgencyTopicFormProps {
  onSubmit: (data: UrgencyTopicFormData) => void;
  isLoading?: boolean;
}

export function UrgencyTopicForm({ onSubmit, isLoading = false }: UrgencyTopicFormProps) {
  const form = useForm<UrgencyTopicFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      // urgency: 'medium', // Default urgency
    },
  });

  const handleSubmit: SubmitHandler<UrgencyTopicFormData> = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Welcome to Neutrino!</AlertTitle> {/* Changed Name */}
          <AlertDescription>
            Start by telling me what engineering topic you'd like to learn about and how quickly you need to grasp it.
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Engineering Topic</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Thermodynamics, Circuit Analysis, Fluid Mechanics" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="urgency"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>How urgently do you need to learn?</FormLabel>
              <FormControl>
                {/* Use RadioGroup for accessibility and state management */}
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value} // Ensure value is controlled
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  disabled={isLoading}
                >
                  {urgencyLevels.map(({ value, label, icon: Icon }) => (
                    <FormItem key={value} className="relative"> {/* Use relative positioning for peer */}
                       {/* Actual radio button, visually hidden but focusable */}
                      <FormControl>
                        <RadioGroupItem value={value} id={value} className="sr-only peer" />
                      </FormControl>
                      {/* Custom label acting as the visible button */}
                      <FormLabel
                         htmlFor={value}
                         className={cn(
                           "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors",
                           isLoading ? 'opacity-50 cursor-not-allowed' : ''
                         )}
                       >
                         <Icon className="mb-2 h-6 w-6" />
                         <span className="text-sm font-medium text-center">{label}</span>
                       </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          {isLoading ? 'Generating...' : 'Start Learning'}
        </Button>
      </form>
    </Form>
  );
}
