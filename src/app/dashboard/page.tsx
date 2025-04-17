"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import UptimeHistoryBar from "@/components/UptimeHistoryBar";

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

export default function Dashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceStatuses, setServiceStatuses] = useState<Record<string, ServiceStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newService, setNewService] = useState({ name: "", url: "" });
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(7); // Default to 7 days

  // Fetch services
  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    } finally {
      setIsLoading(false);
    }
  };

  // Check all services
  const checkServices = async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/check", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to check services");

      const results = await response.json();

      // Update service statuses
      const newStatuses: Record<string, ServiceStatus> = {};
      results.forEach((result: any) => {
        newStatuses[result.service.id] = {
          status: result.status,
          responseTime: result.responseTime,
        };
      });

      setServiceStatuses(newStatuses);
      toast.success("Services checked successfully");
    } catch (error) {
      console.error("Error checking services:", error);
      toast.error("Failed to check services");
    } finally {
      setIsChecking(false);
    }
  };

  // Add new service
  const addService = async () => {
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newService),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add service");
      }

      await fetchServices();
      setNewService({ name: "", url: "" });
      setIsAddDialogOpen(false);
      toast.success("Service added successfully");
    } catch (error: any) {
      console.error("Error adding service:", error);
      toast.error(error.message || "Failed to add service");
    }
  };

  // Delete service
  const deleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete service");

      await fetchServices();
      toast.success("Service deleted successfully");
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    }
  };

  // Handle logout
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Monitored Services</h2>
        <div className="space-x-2">
          <Button onClick={checkServices} disabled={isChecking || services.length === 0}>
            {isChecking ? "Checking..." : "Check All Services"}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Service</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name">Service Name</label>
                  <Input
                    id="name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="e.g., Google"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="url">Service URL</label>
                  <Input
                    id="url"
                    value={newService.url}
                    onChange={(e) => setNewService({ ...newService, url: e.target.value })}
                    placeholder="e.g., https://google.com"
                  />
                </div>
                <Button onClick={addService} className="w-full">
                  Add Service
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading services...</p>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-muted-foreground">No services added yet.</p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                Add Your First Service
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Timeframe selector */}
          <div className="flex justify-end space-x-2 mb-4">
            <span className="text-sm self-center">Show history for:</span>
            {[1, 7, 30].map((days) => (
              <Button
                key={days}
                variant={selectedTimeframe === days ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(days)}
              >
                {days} {days === 1 ? 'Day' : 'Days'}
              </Button>
            ))}
          </div>

          {/* Uptime history bars */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            {services.map((service) => (
              <UptimeHistoryBar
                key={service._id}
                serviceId={service._id}
                serviceName={service.name}
                days={selectedTimeframe}
              />
            ))}
          </div>

          {/* Services table */}
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service._id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <a href={service.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {service.url}
                        </a>
                      </TableCell>
                      <TableCell>
                        {serviceStatuses[service._id] ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            serviceStatuses[service._id].status === "up"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {serviceStatuses[service._id].status.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not checked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {serviceStatuses[service._id]
                          ? `${serviceStatuses[service._id].responseTime}ms`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteService(service._id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
