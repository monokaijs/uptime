import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Service, ServiceStatus } from "@/models/Service";

// GET /api/status/latest - Get latest status for all services
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get all services
    const services = await Service.find({});
    
    // For each service, get the most recent status
    const results = await Promise.all(
      services.map(async (service) => {
        // Get the most recent status record
        const latestStatus = await ServiceStatus.findOne({ 
          serviceId: service._id 
        }).sort({ timestamp: -1 }).limit(1);
        
        return {
          service: {
            id: service._id,
            name: service.name,
            url: service.url,
          },
          status: latestStatus?.status || "unknown",
          responseTime: latestStatus?.responseTime || 0,
          timestamp: latestStatus?.timestamp || null,
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("Error fetching latest status:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest status" },
      { status: 500 }
    );
  }
}
