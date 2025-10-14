import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Restaurant from "@/app/models/Restaurant";
import { verifyToken } from "@/app/lib/authMiddleware";

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Await the params promise
    const { id: restaurantId } = await params;

    // Verify JWT token
    const authHeader = req.headers.get("authorization");
    const userId = verifyToken(authHeader ?? undefined);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing or invalid token" },
        { status: 401 }
      );
    }

    // Find restaurant owned by this user
    const restaurant = await Restaurant.findOne({ _id: restaurantId, userId });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found or not owned by user" },
        { status: 404 }
      );
    }

    // Read request body once
    const body = await req.json();
    const { name, cuisine, rating, priceRange, address, imageUrl, menu } = body;

    // Update only provided fields
    if (name) restaurant.name = name;
    if (cuisine) restaurant.cuisine = cuisine;
    if (rating) restaurant.rating = rating;
    if (priceRange) restaurant.priceRange = priceRange;
    if (address) restaurant.address = address;
    if (imageUrl) restaurant.imageUrl = imageUrl;
    if (menu && Array.isArray(menu)) restaurant.menu = menu;

    const updatedRestaurant = await restaurant.save();

    return NextResponse.json(
      { success: true, restaurant: updatedRestaurant, message: "Restaurant updated successfully" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error updating restaurant:", err);
    return NextResponse.json(
      { success: false, error: err.message, errorType: err.name },
      { status: 500 }
    );
  }
}