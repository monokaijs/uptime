import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Service, ServiceStatus } from "@/models/Service";
import axios from "axios";

// This route is designed to be called by a cron job
// It doesn't require authentication since it's meant to be triggered automatically

export async function GET(request: NextRequest) {
  try {
    // Optional API key validation for security
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    
    // If API_KEY is set in env, validate it
    if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
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
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: "Failed to check services" },
      { status: 500 }
    );
  }
}
