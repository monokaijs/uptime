"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Chart } from "@/components/ui/chart";

interface StatusRecord {
  _id: string;
  serviceId: string;
  status: "up" | "down";
  responseTime: number;
  timestamp: string;
}

interface UptimeHistoryBarProps {
  serviceId: string;
  serviceName: string;
  days?: number;
}

export default function UptimeHistoryBar({ serviceId, serviceName, days = 7 }: UptimeHistoryBarProps) {
  const [statusHistory, setStatusHistory] = useState<StatusRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [barCount, setBarCount] = useState(140); // Default bar count
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch status history data
  useEffect(() => {
    const fetchStatusHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/services/${serviceId}/status?limit=500&days=${days}`);
        if (!response.ok) {
          throw new Error("Failed to fetch status history");
        }
        const data = await response.json();
        setStatusHistory(data);
      } catch (err) {
        console.error("Error fetching status history:", err);
        setError("Failed to load uptime history");
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceId) {
      fetchStatusHistory();
    }
  }, [serviceId, days]);

  // Calculate number of bars based on container width using the formula: ~~((width - 100) / 140)
  useEffect(() => {
    if (!containerRef.current) return;
    const calculateBarCount = () => {
      const containerWidth = containerRef.current!.clientWidth;
      const calculatedBarCount = ~~(containerWidth / 10);
      setBarCount(calculatedBarCount);
    };

    // Calculate initially
    calculateBarCount();

    // Recalculate on window resize
    const handleResize = () => {
      calculateBarCount();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerRef.current]);

  // Process the status history into time blocks
  const processStatusHistory = () => {
    // Calculate the interval size based on the selected timeframe
    const intervalMinutes = (days * 24 * 60) / barCount;

    // Create an array of time blocks with a 10-minute offset from current time
    // This offset helps ensure the most recent bar shows actual data instead of being gray
    const now = new Date();
    now.setMinutes(now.getMinutes() - 10); // 10-minute offset from current time

    const timeBlocks = Array.from({ length: barCount }, (_, i) => {
      const date = new Date(now);
      // Calculate minutes to subtract for this block
      const minutesToSubtract = intervalMinutes * (barCount - i - 1);
      date.setMinutes(date.getMinutes() - minutesToSubtract);
      return {
        startTime: date,
        endTime: new Date(new Date(date).setMinutes(date.getMinutes() + intervalMinutes)),
        status: "unknown" as "up" | "down" | "unknown",
        responseTime: 0,
        count: 0,
      };
    });

    // Map status records to time blocks
    statusHistory.forEach((record) => {
      const recordDate = new Date(record.timestamp);
      const blockIndex = timeBlocks.findIndex((block) => {
        return recordDate >= block.startTime && recordDate < block.endTime;
      });

      if (blockIndex !== -1) {
        const block = timeBlocks[blockIndex];
        // If we already have an "up" status and the new record is "down", mark as "down"
        // This prioritizes downtime in a given block
        if (block.status === "unknown" || (block.status === "up" && record.status === "down")) {
          block.status = record.status;
        }
        block.responseTime += record.responseTime;
        block.count += 1;
      }
    });

    return timeBlocks;
  };

  const timeBlocks = processStatusHistory();

  // Format the time based on the selected timeframe
  const formatBlockTime = (date: Date) => {
    if (days <= 1) {
      return format(date, "h:mm a"); // For 1 day, show hour and minute
    } else if (days <= 7) {
      return format(date, "EEE h a"); // For 7 days, show day of week and hour
    } else {
      return format(date, "MMM d"); // For 30 days, show month and day
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{serviceName} - Uptime History (Last {days} Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 animate-pulse bg-gray-200 rounded"></div>
            <div className="h-24 animate-pulse bg-gray-200 rounded"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : (
          <div className="space-y-4">
            {/* Uptime status bars */}
            <div ref={containerRef} className="flex space-x-0.5">
              {timeBlocks.map((block, index) => {
                let bgColor = "bg-gray-200"; // unknown
                let tooltipText = "No data";

                if (block.status === "up") {
                  bgColor = "bg-green-500";
                  tooltipText = "Up";
                } else if (block.status === "down") {
                  bgColor = "bg-red-500";
                  tooltipText = "Down";
                }

                const avgResponseTime = block.count > 0 ? Math.round(block.responseTime / block.count) : 0;
                const formattedStartTime = formatBlockTime(block.startTime);

                return (
                  <div key={index} className="group relative flex-1">
                    <div
                      className={`h-8 rounded-lg ${bgColor} hover:opacity-80 cursor-pointer`}
                      title={`${formattedStartTime}: ${tooltipText}${avgResponseTime ? ` (${avgResponseTime}ms)` : ''}`}
                    ></div>
                  </div>
                );
              })}
            </div>

            {/* Latency history chart */}
            <div className="mt-6 mb-1 text-sm font-medium">Response Time History</div>
            <Chart
              data={timeBlocks.map(block => ({
                timestamp: block.startTime,
                value: block.count > 0 ? Math.round(block.responseTime / block.count) : 0,
                status: block.status,
                endTime: block.endTime // Add end time for tooltip
              }))}
              height={150}
              yAxisLabel="Response Time"
              tooltipLabel="Response Time"
              valueFormatter={(value) => value > 0 ? `${value}ms` : "No data"}
              dateFormatter={(date) => formatBlockTime(date)}
            />
          </div>
        )}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{days} days ago</span>
          <span>10 min ago</span>
        </div>
      </CardContent>
    </Card>
  );
}
