import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  dropoff?: number;
}

interface ConversionFunnelProps {
  data: FunnelStage[];
}

const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel Analysis</CardTitle>
        <CardDescription>Track user journey from initial contact to conversion</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => {
            const isFirst = index === 0;
            const isLast = index === data.length - 1;
            
            return (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="font-medium">{stage.stage}</span>
                    </div>
                    <Badge variant="secondary">{stage.count} users</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">{stage.percentage.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">of total</p>
                    </div>
                    
                    {!isLast && stage.dropoff && (
                      <div className="flex items-center space-x-1 text-destructive">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-sm font-medium">{stage.dropoff.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Funnel visualization bar */}
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${stage.percentage}%` }}
                  ></div>
                </div>
                
                {/* Connection line to next stage */}
                {!isLast && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 mt-2">
                    <div className="w-0.5 h-6 bg-border"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnel;