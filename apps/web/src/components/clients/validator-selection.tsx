import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, GlobeIcon, Zap } from 'lucide-react';

const ValidatorSelection = () => {
  return (
    <Card className="border-dashed border-2 border-muted-foreground">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GlobeIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Validator Selection</CardTitle>
        </div>
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      </CardHeader>
      <CardContent className="text-center py-6">
        <Zap className="h-8 w-8 mx-auto text-primary mb-2" />
        <p className="text-sm font-medium text-muted-foreground">
          Custom validator and region selection will be available soon.
        </p>
      </CardContent>
      <CardDescription className="text-center pb-4">
        Stay tuned for upcoming updates that allow full control over validator assignments.
      </CardDescription>
    </Card>
  );
};

export default ValidatorSelection;
