import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="shadow-md hover:shadow-xl transition-shadow border-0 rounded-xl overflow-hidden">
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary-light mb-4">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-medium mb-2">{title}</h3>
        <p className="text-secondary">{description}</p>
      </CardContent>
    </Card>
  );
}
