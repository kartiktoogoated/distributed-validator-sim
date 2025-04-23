import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { BadgePlus, BadgeMinus, ActivitySquare } from 'lucide-react';

interface ValidatorStatsProps {
  score: number;
}

const ValidatorStats = ({ score }: ValidatorStatsProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Performance Score</span>
          <span className="text-2xl font-bold">{score}</span>
        </div>
        <Progress value={score} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium mb-1">Strengths</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-green-500">
                    <BadgePlus className="h-4 w-4" />
                    <span className="text-foreground">Consistent uptime</span>
                  </li>
                  <li className="flex items-center gap-2 text-green-500">
                    <BadgePlus className="h-4 w-4" />
                    <span className="text-foreground">Fast response time</span>
                  </li>
                  <li className="flex items-center gap-2 text-green-500">
                    <BadgePlus className="h-4 w-4" />
                    <span className="text-foreground">Reliable connectivity</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium mb-1">Areas to Improve</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-red-500">
                    <BadgeMinus className="h-4 w-4" />
                    <span className="text-foreground">Network latency spikes</span>
                  </li>
                  <li className="flex items-center gap-2 text-amber-500">
                    <ActivitySquare className="h-4 w-4" />
                    <span className="text-foreground">Memory usage optimization</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ValidatorStats;