import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MessageCircle, TrendingUp } from 'lucide-react';

interface Question {
  question: string;
  count: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
}

interface PopularQuestionsProps {
  questions: Question[];
  loading?: boolean;
}

const PopularQuestions: React.FC<PopularQuestionsProps> = ({ questions, loading = false }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Asked Questions</CardTitle>
          <CardDescription>Loading popular questions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Most Asked Questions
        </CardTitle>
        <CardDescription>Top user queries and their frequency</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <p className="font-medium text-sm">{question.question}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{question.count}</span>
                  {question.trend === 'up' && (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{question.percentage.toFixed(1)}% of all questions</span>
                </div>
                <Progress value={question.percentage} className="h-2" />
              </div>
            </div>
          ))}
          
          {questions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No questions data available</p>
              <p className="text-sm">Start conversations to see popular questions</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PopularQuestions;