import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface RadarMetricsProps {
  data: {
    leisure: number;
    business: number;
    romance: number;
  };
}

const RadarMetrics = ({ data }: RadarMetricsProps) => {
  const chartData = [
    { subject: "Leisure", value: data.leisure },
    { subject: "Business", value: data.business },
    { subject: "Romance", value: data.romance },
  ];

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#ffffff20" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#ffffff60", fontSize: 12 }} />
          <Radar
            name="City"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarMetrics;