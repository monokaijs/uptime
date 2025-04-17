"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from "recharts"
import { format } from "date-fns"

interface ChartProps {
  data: Array<{
    timestamp: Date;
    value: number;
    status?: "up" | "down" | "unknown";
    endTime?: Date; // Optional end time for time range display
  }>;
  height?: number;
  yAxisLabel?: string;
  tooltipLabel?: string;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: Date) => string;
}

export function Chart({
                        data,
                        height = 200,
                        yAxisLabel = "Value",
                        tooltipLabel = "Value",
                        valueFormatter = (value: number) => `${value}`,
                        dateFormatter = (date: Date) => format(date, "MMM d, h:mm a"),
                      }: ChartProps) {
  // Format data for recharts
  const chartData = data.map((item) => ({
    timestamp: item.timestamp,
    // Convert 0 values (no data) to null so the line chart shows gaps
    value: item.value === 0 ? null : item.value,
    status: item.status,
    formattedDate: dateFormatter(item.timestamp),
    // Format end time if available
    endTimeFormatted: item.endTime ? dateFormatter(item.endTime) : undefined,
    // Keep the original value for tooltip display
    originalValue: item.value
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-xs">
          <p className="font-medium">
            {data.formattedDate}
            {data.endTimeFormatted && data.formattedDate !== data.endTimeFormatted && (
              <> - {data.endTimeFormatted}</>
            )}
          </p>
          <p className="text-muted-foreground">
            {tooltipLabel}: {valueFormatter(data.originalValue)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Determine dot colors based on status or value
  const getDotFill = (entry: any) => {
    // No data case
    if (entry.value === 0) return "#d1d5db"; // Gray for no data

    if (entry.status === "down") return "#ef4444"; // Red for down

    // Otherwise color based on value (for response time)
    if (entry.value > 1000) return "#ef4444"; // Red for slow (>1000ms)
    if (entry.value > 300) return "#eab308"; // Yellow for medium (300-1000ms)
    return "#22c55e"; // Green for fast (<300ms)
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <XAxis
            dataKey="formattedDate"
            tick={false} // Hide x-axis ticks for cleaner look
            axisLine={{ opacity: 0.2 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            connectNulls={false}
            activeDot={{ r: 5, fill: "#3b82f6" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
