import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { GlobeIcon, CheckCircle2 } from 'lucide-react';
import { comingSoon } from '@/lib/utils';

// Demo data for validators
const regions = [
  { id: 'na', name: 'North America', count: 32, selected: true },
  { id: 'eu', name: 'Europe', count: 28, selected: true },
  { id: 'ap', name: 'Asia Pacific', count: 24, selected: true },
  { id: 'sa', name: 'South America', count: 18, selected: true },
  { id: 'af', name: 'Africa', count: 12, selected: true },
];

const validators = [
  { id: 1, name: 'Validator Node 01', region: 'North America', score: 98, ping: 5, selected: true },
  { id: 2, name: 'Validator Node 02', region: 'North America', score: 96, ping: 8, selected: true },
  { id: 3, name: 'Validator Node 03', region: 'Europe', score: 99, ping: 12, selected: true },
  { id: 4, name: 'Validator Node 04', region: 'Europe', score: 97, ping: 15, selected: true },
  { id: 5, name: 'Validator Node 05', region: 'Asia Pacific', score: 98, ping: 22, selected: true },
  { id: 6, name: 'Validator Node 06', region: 'Asia Pacific', score: 94, ping: 25, selected: false },
  { id: 7, name: 'Validator Node 07', region: 'South America', score: 96, ping: 18, selected: true },
  { id: 8, name: 'Validator Node 08', region: 'Africa', score: 95, ping: 21, selected: true },
];

const ValidatorSelection = () => {
  const [selectedRegions, setSelectedRegions] = useState(regions);
  const [selectedValidators, setSelectedValidators] = useState(validators);
  const { toast } = useToast();

  const handleRegionSelect = (regionId: string, checked: boolean) => {
    // Update regions
    setSelectedRegions(
      selectedRegions.map((region) =>
        region.id === regionId ? { ...region, selected: checked } : region
      )
    );
    
    // Update validators
    const regionName = regions.find(r => r.id === regionId)?.name;
    setSelectedValidators(
      selectedValidators.map((validator) =>
        validator.region === regionName ? { ...validator, selected: checked } : validator
      )
    );
  };

  const handleValidatorSelect = (validatorId: number, checked: boolean) => {
    setSelectedValidators(
      selectedValidators.map((validator) =>
        validator.id === validatorId ? { ...validator, selected: checked } : validator
      )
    );
  };

  const handleSave = () => {
    toast({
      title: 'Coming Soon',
      description: 'Validator selection will be available in the next update.',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <GlobeIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Select regions and validators to monitor your websites
          </span>
        </div>
        <Button onClick={comingSoon} className="opacity-60">
          Save Selection
        </Button>
      </div>

      <Tabs defaultValue="regions">
        <TabsList className="mb-4">
          <TabsTrigger value="regions">Regions</TabsTrigger>
          <TabsTrigger value="validators">Individual Validators</TabsTrigger>
        </TabsList>
        
        <TabsContent value="regions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedRegions.map((region) => (
              <Card key={region.id} className="p-4 flex items-center space-x-4">
                <Checkbox 
                  id={`region-${region.id}`} 
                  checked={region.selected}
                  onCheckedChange={(checked) => handleRegionSelect(region.id, checked as boolean)}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={`region-${region.id}`}
                    className="font-medium cursor-pointer"
                  >
                    {region.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {region.count} validators
                  </p>
                </div>
                {region.selected && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="validators">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedValidators.map((validator) => (
              <Card key={validator.id} className="p-4 flex items-center space-x-4">
                <Checkbox 
                  id={`validator-${validator.id}`} 
                  checked={validator.selected}
                  onCheckedChange={(checked) => handleValidatorSelect(validator.id, checked as boolean)}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={`validator-${validator.id}`}
                    className="font-medium cursor-pointer"
                  >
                    {validator.name}
                  </Label>
                  <div className="flex flex-col text-sm">
                    <span className="text-muted-foreground">{validator.region}</span>
                    <span className="text-muted-foreground">Score: {validator.score}%, Ping: {validator.ping}ms</span>
                  </div>
                </div>
                {validator.selected && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ValidatorSelection;