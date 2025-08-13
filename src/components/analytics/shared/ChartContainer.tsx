import { ReactNode, ReactElement } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  title: string;
  description?: string;
  children: ReactElement;
  height?: number;
  actions?: ReactNode;
}

export const ChartContainer = ({ 
  title, 
  description, 
  children, 
  height = 300,
  actions
}: ChartContainerProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};