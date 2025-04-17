import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Service, ServiceStatus } from "@/models/Service";
import mongoose from "mongoose";

// GET /api/services/[id]/status - Get status history for a service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '500'); // Increased default limit for better history display
    const days = parseInt(searchParams.get('days') || '30'); // Default to 30 days of history

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid service ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if service exists
    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Calculate the date for filtering (e.g., last 30 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get status history
    const statusHistory = await ServiceStatus.find({
      serviceId: id,
      timestamp: { $gte: startDate }
    })
      .sort({ timestamp: -1 })
      .limit(limit);

    return NextResponse.json(statusHistory);
  } catch (error) {
    console.error("Error fetching status history:", error);
    return NextResponse.json(
      { error: "Failed to fetch status history" },
      { status: 500 }
    );
  }
}
