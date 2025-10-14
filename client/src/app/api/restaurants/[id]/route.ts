import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Restaurant from "@/app/models/Restaurant";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Await the params promise
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Restaurant ID is required" },
        { status: 400 }
      );
    }
    const deleted = await Restaurant.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, message: "Restaurant deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete restaurant", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Await the params promise
    const { id } = await params;
    const body = await req.json();
    const { menu } = body;
    
    if (!menu || !Array.isArray(menu)) {
      return NextResponse.json({ success: false, message: "Invalid menu data" }, { status: 400 });
    }
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { menu },
      { new: true }
    );
    
    if (!restaurant) {
      return NextResponse.json({ success: false, message: "Restaurant not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, restaurant });
  } catch (error) {
    console.error("Error updating menu:", error);
    return NextResponse.json({ success: false, message: "Error updating menu" }, { status: 500 });
  }
}

// FIXED: Changed from userId to id to match the route parameter
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Await the params promise - now expecting id, not userId
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Restaurant ID is required" },
        { status: 400 }
      );
    }
    
    // Get a single restaurant by ID, not multiple by userId
    const restaurant = await Restaurant.findById(id).lean();
    
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        restaurant, // Return single restaurant object
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching restaurant:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch restaurant data.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}