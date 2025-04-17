import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Service, ServiceStatus } from "@/models/Service";
import axios from "axios";
import { getServerSession } from "next-auth";

// POST /api/check - Check all services and update their status
export async function POST(request: NextRequest) {
  try {
    // Check authentication for manual checks
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const services = await Service.find({});
    
    const results = await Promise.all(
      services.map(async (service) => {
        const startTime = Date.now();
        let status = "down";
        let responseTime = 0;
        
        try {
          const response = await axios.get(service.url, {
            timeout: 10000, // 10 seconds timeout
          });
          
          responseTime = Date.now() - startTime;
          
          if (response.status >= 200 && response.status < 300) {
            status = "up";
          }
        } catch (error) {
          responseTime = Date.now() - startTime;
          status = "down";
        }
        
        // Save status to database
        const serviceStatus = new ServiceStatus({
          serviceId: service._id,
          status,
          responseTime,
          timestamp: new Date(),
        });
        
        await serviceStatus.save();
        
        return {
          service: {
            id: service._id,
            name: service.name,
            url: service.url,
          },
          status,
          responseTime,
        };
      })
    );
    
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error checking services:", error);
    return NextResponse.json(
      { error: "Failed to check services" },
      { status: 500 }
    );
  }
}
