'use client';

import React, { useState } from 'react';
import type { GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, FileQuestion, Brain, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormattedText } from '@/components/edugemini/formatted-text';

interface QuizDisplayProps {
  quiz: GenerateQuizOutput;
  topic: string;
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

interface QuestionState {
  selectedOption: number | null;
  state: AnswerState;
}

export function QuizDisplay({ quiz, topic }: QuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>(
    quiz.questions.map(() => ({ selectedOption: null, state: 'unanswered' }))
  );
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentQuestionState = questionStates[currentQuestionIndex];

  const handleOptionSelect = (optionIndex: number) => {
    if (currentQuestionState.state !== 'unanswered') return; // Don't allow changing answer after submission

    setQuestionStates(prev => {
      const newStates = [...prev];
      newStates[currentQuestionIndex] = {
        ...newStates[currentQuestionIndex],
        selectedOption: optionIndex,
      };
      return newStates;
    });
  };

  const handleSubmitAnswer = () => {
    if (currentQuestionState.selectedOption === null) return;

    const isCorrect = currentQuestionState.selectedOption === currentQuestion.correctAnswerIndex;
    const newState: AnswerState = isCorrect ? 'correct' : 'incorrect';

    setQuestionStates(prev => {
      const newStates = [...prev];
      newStates[currentQuestionIndex] = {
        ...newStates[currentQuestionIndex],
        state: newState,
      };
      return newStates;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered, show results
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    return questionStates.filter(q => q.state === 'correct').length;
  };

  const score = calculateScore();
  const totalQuestions = quiz.questions.length;
  const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;


  if (showResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary"><Brain /> Quiz Results: {topic}</CardTitle>
          <CardDescription>You answered {score} out of {totalQuestions} questions correctly ({scorePercentage}%).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.questions.map((q, index) => (
            <div key={index} className={cn(
                "p-4 border rounded-md",
                questionStates[index].state === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-destructive bg-red-50 dark:bg-red-900/20'
            )}>
               <p className="font-medium mb-2">Question {index + 1}: {q.question}</p>
               <p className="text-sm mb-1">Your answer: {questionStates[index].selectedOption !== null ? q.options[questionStates[index].selectedOption!] : 'Not Answered'}
                 {questionStates[index].state === 'correct' && <CheckCircle className="inline-block h-4 w-4 ml-1 text-green-600" />}
                 {questionStates[index].state === 'incorrect' && <XCircle className="inline-block h-4 w-4 ml-1 text-destructive" />}
               </p>
               {questionStates[index].state === 'incorrect' && (
                 <p className="text-sm text-green-700 dark:text-green-400">Correct answer: {q.options[q.correctAnswerIndex]}</p>
               )}
               {q.explanation && (
                <Alert variant="default" className="mt-2 text-sm bg-background border-border">
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Explanation</AlertTitle>
                    <AlertDescription>
                        <FormattedText text={q.explanation} />
                    </AlertDescription>
                </Alert>
               )}
            </div>
          ))}
        </CardContent>
        <CardFooter>
            {/* Maybe add a button to retake or go back */}
             <Button onClick={() => window.location.reload()} variant="outline">Retake Topic</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary"><FileQuestion /> Quiz: {topic}</CardTitle>
        <CardDescription>Question {currentQuestionIndex + 1} of {quiz.questions.length}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-medium text-lg mb-4">{currentQuestion.question}</p>

        <RadioGroup
          value={currentQuestionState.selectedOption?.toString()}
          onValueChange={(value) => handleOptionSelect(parseInt(value))}
          className="space-y-2"
          disabled={currentQuestionState.state !== 'unanswered'} // Disable after submitting
        >
          {currentQuestion.options.map((option, index) => (
            <Label
              key={index}
              htmlFor={`option-${index}`}
              className={cn(
                "flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-colors",
                currentQuestionState.state === 'unanswered' ? 'hover:bg-muted' : '',
                currentQuestionState.selectedOption === index && currentQuestionState.state === 'unanswered' ? 'border-primary bg-muted' : '',
                currentQuestionState.state !== 'unanswered' && index === currentQuestion.correctAnswerIndex ? 'border-green-500 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : '',
                 currentQuestionState.state === 'incorrect' && currentQuestionState.selectedOption === index ? 'border-destructive bg-red-100 dark:bg-red-900/30 text-destructive' : ''
              )}
            >
              <RadioGroupItem value={index.toString()} id={`option-${index}`} className={cn(
                  currentQuestionState.state !== 'unanswered' && index === currentQuestion.correctAnswerIndex ? 'border-green-600 text-green-600' : '',
                  currentQuestionState.state === 'incorrect' && currentQuestionState.selectedOption === index ? 'border-destructive text-destructive' : ''
              )} />
              <span>{option}</span>
               {currentQuestionState.state === 'correct' && index === currentQuestion.correctAnswerIndex && <CheckCircle className="ml-auto h-5 w-5 text-green-600" />}
               {currentQuestionState.state === 'incorrect' && currentQuestionState.selectedOption === index && <XCircle className="ml-auto h-5 w-5 text-destructive" />}
            </Label>
          ))}
        </RadioGroup>

        {/* Feedback Area */}
        {currentQuestionState.state === 'correct' && (
            <Alert variant="default" className="mt-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-700 dark:text-green-300">Correct!</AlertTitle>
                {currentQuestion.explanation && (
                    <AlertDescription className="text-green-600 dark:text-green-400">
                       <FormattedText text={currentQuestion.explanation} />
                    </AlertDescription>
                )}
            </Alert>
        )}
        {currentQuestionState.state === 'incorrect' && (
            <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Incorrect</AlertTitle>
                <AlertDescription>
                    The correct answer was: {currentQuestion.options[currentQuestion.correctAnswerIndex]}
                    {currentQuestion.explanation && (
                         <>
                            <br />
                            <strong>Explanation:</strong> <FormattedText text={currentQuestion.explanation} />
                         </>
                     )}
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {currentQuestionState.state === 'unanswered' ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={currentQuestionState.selectedOption === null}
            className="bg-primary hover:bg-primary/90"
          >
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} className="bg-accent hover:bg-accent/90">
            {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Show Results'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
