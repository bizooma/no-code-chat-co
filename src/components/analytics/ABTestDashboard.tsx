import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  FlaskConical, 
  Plus, 
  Play, 
  Pause, 
  BarChart3,
  Target,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ABTest {
  id: string;
  chatbot_id: string;
  workspace_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  test_type: 'video_layout' | 'video_content' | 'message_flow' | 'interactive_elements';
  variants: any[];
  traffic_split: any;
  success_metric: 'completion_rate' | 'interaction_rate' | 'conversion_rate' | 'engagement_time';
  start_date?: string;
  end_date?: string;
  results?: any;
  created_at: string;
  updated_at: string;
}

interface ABTestDashboardProps {
  chatbotId: string;
  workspaceId: string;
}

export const ABTestDashboard: React.FC<ABTestDashboardProps> = ({
  chatbotId,
  workspaceId
}) => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    test_type: 'video_layout' as ABTest['test_type'],
    success_metric: 'completion_rate' as ABTest['success_metric'],
    variants: [
      { name: 'Control', description: 'Original version', config: {} },
      { name: 'Variant B', description: 'Test version', config: {} }
    ],
    traffic_split: { A: 50, B: 50 }
  });

  useEffect(() => {
    fetchABTests();
  }, [chatbotId]);

  const fetchABTests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests((data || []) as ABTest[]);
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createABTest = async () => {
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .insert({
          chatbot_id: chatbotId,
          workspace_id: workspaceId,
          name: newTest.name,
          description: newTest.description,
          test_type: newTest.test_type,
          success_metric: newTest.success_metric,
          variants: newTest.variants,
          traffic_split: newTest.traffic_split
        })
        .select()
        .single();

      if (error) throw error;
      
      setTests(prev => [data as ABTest, ...prev]);
      setDialogOpen(false);
      resetNewTest();
    } catch (error) {
      console.error('Error creating A/B test:', error);
    }
  };

  const updateTestStatus = async (testId: string, status: ABTest['status']) => {
    try {
      const updateData: any = { status };
      
      if (status === 'running') {
        updateData.start_date = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.end_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ab_tests')
        .update(updateData)
        .eq('id', testId);

      if (error) throw error;
      
      setTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status, ...updateData }
          : test
      ));
    } catch (error) {
      console.error('Error updating test status:', error);
    }
  };

  const resetNewTest = () => {
    setNewTest({
      name: '',
      description: '',
      test_type: 'video_layout',
      success_metric: 'completion_rate',
      variants: [
        { name: 'Control', description: 'Original version', config: {} },
        { name: 'Variant B', description: 'Test version', config: {} }
      ],
      traffic_split: { A: 50, B: 50 }
    });
  };

  const getStatusIcon = (status: ABTest['status']) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'running':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTestResults = (test: ABTest) => {
    // Simulate test results based on test type and variants
    const baseConversion = 0.15 + Math.random() * 0.1; // 15-25%
    const results = test.variants.map((variant, index) => ({
      variant: variant.name,
      visitors: Math.floor(Math.random() * 1000) + 500,
      conversions: Math.floor((Math.random() * 0.1 + baseConversion) * 1000),
      confidence: Math.random() * 30 + 70, // 70-100%
    }));

    return results;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-video-primary" />
            A/B Testing
          </h2>
          <p className="text-muted-foreground">
            Test different video layouts, content, and flows to optimize conversions
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-video-primary hover:bg-video-primary-glow">
              <Plus className="h-4 w-4 mr-2" />
              New A/B Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
              <DialogDescription>
                Set up a new A/B test to optimize your video chatbot performance
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Test Name</Label>
                  <Input
                    value={newTest.name}
                    onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Video Layout Test"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Test Type</Label>
                  <Select
                    value={newTest.test_type}
                    onValueChange={(value: ABTest['test_type']) => 
                      setNewTest(prev => ({ ...prev, test_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video_layout">Video Layout</SelectItem>
                      <SelectItem value="video_content">Video Content</SelectItem>
                      <SelectItem value="message_flow">Message Flow</SelectItem>
                      <SelectItem value="interactive_elements">Interactive Elements</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Testing portrait vs landscape video layouts for engagement"
                />
              </div>

              <div className="space-y-2">
                <Label>Success Metric</Label>
                <Select
                  value={newTest.success_metric}
                  onValueChange={(value: ABTest['success_metric']) => 
                    setNewTest(prev => ({ ...prev, success_metric: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completion_rate">Completion Rate</SelectItem>
                    <SelectItem value="interaction_rate">Interaction Rate</SelectItem>
                    <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                    <SelectItem value="engagement_time">Engagement Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Variants</Label>
                {newTest.variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                    <Input
                      value={variant.name}
                      onChange={(e) => {
                        const updatedVariants = [...newTest.variants];
                        updatedVariants[index] = { ...variant, name: e.target.value };
                        setNewTest(prev => ({ ...prev, variants: updatedVariants }));
                      }}
                      placeholder="Variant name"
                    />
                    <Input
                      value={variant.description}
                      onChange={(e) => {
                        const updatedVariants = [...newTest.variants];
                        updatedVariants[index] = { ...variant, description: e.target.value };
                        setNewTest(prev => ({ ...prev, variants: updatedVariants }));
                      }}
                      placeholder="Variant description"
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createABTest}>
                Create Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => {
          const results = test.status === 'completed' ? calculateTestResults(test) : null;
          
          return (
            <Card key={test.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{test.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {test.description}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(test.status)} flex items-center gap-1`}>
                    {getStatusIcon(test.status)}
                    {test.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Test Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Type</p>
                    <p className="text-muted-foreground capitalize">
                      {test.test_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Metric</p>
                    <p className="text-muted-foreground capitalize">
                      {test.success_metric.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Variants */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Variants</p>
                  {test.variants.map((variant, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{variant.name}</span>
                      <span className="text-muted-foreground">
                        {test.traffic_split[Object.keys(test.traffic_split)[index]] || 50}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Results for Completed Tests */}
                {results && (
                  <div className="space-y-3 pt-3 border-t">
                    <p className="text-sm font-medium">Results</p>
                    {results.map((result, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{result.variant}</span>
                          <span className="font-medium">
                            {((result.conversions / result.visitors) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={(result.conversions / result.visitors) * 100} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{result.visitors} visitors</span>
                          <span>{result.confidence.toFixed(0)}% confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3">
                  {test.status === 'draft' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateTestStatus(test.id, 'running')}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {test.status === 'running' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateTestStatus(test.id, 'paused')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateTestStatus(test.id, 'completed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    </>
                  )}
                  {test.status === 'paused' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateTestStatus(test.id, 'running')}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  {test.status === 'completed' && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      View Report
                    </Button>
                  )}
                </div>

                {/* Created Date */}
                <p className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {tests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No A/B Tests Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start testing different video layouts and content to optimize your chatbot performance
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              Create Your First A/B Test
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};