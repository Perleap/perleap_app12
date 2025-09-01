import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

interface SOFTSkillsData {
  dimension: string;
  averageDevStage: number;
  averageMotivation: number;
  averageLeapProb: number;
  studentCount: number;
}

interface SOFTSkillsChartProps {
  data: SOFTSkillsData[];
  title?: string;
}

export const SOFTSkillsChart = ({ data, title = "Average SOFT Skills Analysis" }: SOFTSkillsChartProps) => {
  const formatTooltip = (value: number, name: string) => {
    const labels: { [key: string]: string } = {
      averageDevStage: 'Avg Development Stage',
      averageMotivation: 'Avg Motivation Level',
      averageLeapProb: 'Avg Leap Probability (%)'
    };
    
    return [
      name === 'averageLeapProb' ? `${value.toFixed(1)}%` : value.toFixed(1),
      labels[name] || name
    ];
  };

  return (
    <Card className="bg-gradient-card shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No SOFT skills data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dimension" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              <Bar 
                dataKey="averageDevStage" 
                fill="hsl(var(--primary))" 
                name="Development Stage"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="averageMotivation" 
                fill="hsl(var(--secondary))" 
                name="Motivation Level"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="averageLeapProb" 
                fill="hsl(var(--success))" 
                name="Leap Probability (%)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};