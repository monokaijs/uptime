"use client";

import {useEffect, useState} from "react";
import {Card, CardContent} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import UptimeHistoryBar from "@/components/UptimeHistoryBar";
import {cn} from "@/lib/utils";
import { format } from "date-fns";

interface Service {
  _id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceStatus {
  status: "up" | "down";
  responseTime: number;
}

interface StatusHistoryItem {
  _id: string;
  serviceId: string;
  status: "up" | "down";
  responseTime: number;
  timestamp: string;
}

export default function PublicStatusPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceStatuses, setServiceStatuses] = useState<Record<string, ServiceStatus>>({});
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(7); // Default to 7 days
  const [lastChecked, setLastChecked] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Fetch services
  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch latest status
  const fetchLatestStatus = async () => {
    try {
      const response = await fetch("/api/status/latest");
      if (!response.ok) throw new Error("Failed to fetch latest status");
      const data = await response.json();

      // Update service statuses
      const newStatuses: Record<string, ServiceStatus> = {};
      data.results.forEach((result: any) => {
        newStatuses[result.service.id] = {
          status: result.status,
          responseTime: result.responseTime,
        };
      });

      setServiceStatuses(newStatuses);
      setLastChecked(data.timestamp);
    } catch (error) {
      console.error("Error fetching latest status:", error);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchLatestStatus();

    // Refresh status every 60 seconds
    const intervalId = setInterval(fetchLatestStatus, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Fetch status history for the selected service
  const fetchStatusHistory = async (serviceId: string) => {
    if (!serviceId) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/services/${serviceId}/status?limit=10`);
      if (!response.ok) throw new Error("Failed to fetch status history");
      const data = await response.json();
      setStatusHistory(data);
    } catch (error) {
      console.error("Error fetching status history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Set the first service as selected when services are loaded
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0]._id);
    }
  }, [services, selectedServiceId]);

  // Fetch status history when selected service changes
  useEffect(() => {
    if (selectedServiceId) {
      fetchStatusHistory(selectedServiceId);
    }
  }, [selectedServiceId]);

  // Calculate overall system status
  const getOverallStatus = () => {
    if (services.length === 0) return "unknown";

    const hasDownService = services.some(service =>
      serviceStatuses[service._id]?.status === "down"
    );

    return hasDownService ? "down" : "up";
  };

  const overallStatus = getOverallStatus();

  // Get the selected service
  const selectedService = services.find(service => service._id === selectedServiceId);

  // Render service status indicator
  const renderStatusIndicator = (serviceId: string, size: "sm" | "md" | "lg" = "sm") => {
    const sizeClasses = {
      sm: "w-2 h-2",
      md: "w-3 h-3",
      lg: "w-4 h-4"
    };

    return (
      <div className={`${sizeClasses[size]} rounded-full ${
        serviceStatuses[serviceId]?.status === "up" ? "bg-green-500" :
          serviceStatuses[serviceId]?.status === "down" ? "bg-red-500" :
            "bg-gray-400"
      }`}></div>
    );
  };

  // Render service status text
  const getStatusText = (serviceId: string) => {
    return serviceStatuses[serviceId]?.status === "up" ? "Operational" :
      serviceStatuses[serviceId]?.status === "down" ? "Disruption" :
        "Unknown";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">System Status</h1>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${
                overallStatus === "up" ? "bg-green-500" :
                  overallStatus === "down" ? "bg-red-500" : "bg-gray-400"
              }`}></div>
              <span className="font-medium">
                {overallStatus === "up" ? "All Systems Operational" :
                  overallStatus === "down" ? "System Disruption Detected" :
                    "Status Unknown"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Last checked timestamp */}
        {lastChecked && (
          <div className="text-right mb-4">
            <p className="text-sm text-gray-500">
              Last checked: {new Date(lastChecked).toLocaleString()}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex gap-6 animate-pulse">
            {/* Sidebar skeleton */}
            <div className="w-64 bg-white rounded-lg shadow p-4">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-gray-200 rounded mb-2"></div>
              ))}
            </div>

            {/* Main content skeleton */}
            <div className="flex-1 bg-white rounded-lg shadow p-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <p className="text-muted-foreground">No services are being monitored.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-6">
            {/* Sidebar with service list */}
            <div className="w-64 bg-white rounded-lg shadow p-4">
              <h2 className="font-medium text-lg mb-4">Services</h2>
              <ul className="space-y-1">
                {services.map((service) => (
                  <li key={service._id}>
                    <button
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md flex items-center justify-between",
                        selectedServiceId === service._id
                          ? "bg-gray-100 font-medium"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => setSelectedServiceId(service._id)}
                    >
                      <span className="truncate">{service.name}</span>
                      <div className="flex items-center gap-1.5">
                        {renderStatusIndicator(service._id)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Main content - Selected service details */}
            {selectedService && (
              <div className="flex-1 bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{selectedService.name}</h2>
                  <div className="flex items-center gap-2">
                    {renderStatusIndicator(selectedService._id, "md")}
                    <span className="font-medium">
                      {getStatusText(selectedService._id)}
                    </span>
                    {serviceStatuses[selectedService._id] && (
                      <span className="text-sm text-gray-500">
                        {serviceStatuses[selectedService._id].responseTime}ms
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <a
                    href={selectedService.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:underline text-sm"
                  >
                    {selectedService.url}
                  </a>
                </div>

                {/* Timeframe selector */}
                <div className="flex justify-end space-x-2 mb-4">
                  <span className="text-sm self-center">Show history for:</span>
                  {[1, 7, 30].map((days) => (
                    <button
                      key={days}
                      className={`px-3 py-1 text-sm rounded ${
                        selectedTimeframe === days
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                      onClick={() => setSelectedTimeframe(days)}
                    >
                      {days} {days === 1 ? 'Day' : 'Days'}
                    </button>
                  ))}
                </div>

                {/* Uptime history */}
                <UptimeHistoryBar
                  serviceId={selectedService._id}
                  serviceName={selectedService.name}
                  days={selectedTimeframe}
                />

                {/* Crawl history */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Recent Status Checks</h3>
                  {isLoadingHistory ? (
                    <div className="h-40 bg-gray-100 animate-pulse rounded"></div>
                  ) : statusHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No recent status checks available
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Response Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statusHistory.map((item) => (
                            <TableRow key={item._id}>
                              <TableCell>
                                {format(new Date(item.timestamp), "MMM d, yyyy HH:mm:ss")}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    item.status === "up" ? "bg-green-500" : "bg-red-500"
                                  }`}></div>
                                  <span>
                                    {item.status === "up" ? "Operational" : "Disruption"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{item.responseTime}ms</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p className="mb-2">© {new Date().getFullYear()} Uptime Tracker</p>
          <div>
            <a href={'https://github.com/monokaijs/uptime'}>Open-source on GitHub</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
