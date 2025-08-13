import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  trend?: {
    value: string;
    isPositive: boolean;
    icon?: ReactNode;
  };
  className?: string;
}

export const AnalyticsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  badge, 
  trend, 
  className = "" 
}: AnalyticsCardProps) => {
  return (
    <Card className={`card-hover ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-8 w-8 text-primary" />
        </div>
        {(badge || trend) && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            {badge && (
              <Badge variant={badge.variant || "secondary"} className="text-xs">
                {badge.text}
              </Badge>
            )}
            {trend && (
              <div className={`flex items-center ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.icon}
                <span className="font-medium ml-1">{trend.value}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};