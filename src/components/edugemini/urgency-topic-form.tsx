"use client";

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle, Zap, Turtle, Rabbit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
          <AlertTitle>Welcome to EduGemini!</AlertTitle>
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
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4"
                  disabled={isLoading}
                >
                  {urgencyLevels.map(({ value, label, icon: Icon }) => (
                    <FormItem key={value} className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={value} />
                      </FormControl>
                      <FormLabel className="font-normal flex items-center gap-2 cursor-pointer">
                         <Icon className="h-4 w-4 text-muted-foreground" />
                         {label}
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
