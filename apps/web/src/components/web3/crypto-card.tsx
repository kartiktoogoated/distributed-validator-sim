import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CryptoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  backContent: string;
  className?: string;
}

const CryptoCard = ({ title, description, icon, backContent, className }: CryptoCardProps) => {
  return (
    <div className={cn("relative h-[300px] crypto-card", className)}>
      <Card className="crypto-card-front h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            {icon}
          </div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
      
      <Card className="crypto-card-back h-full">
        <CardContent className="flex items-center justify-center h-full p-6 text-center">
          <p className="text-lg">{backContent}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoCard;