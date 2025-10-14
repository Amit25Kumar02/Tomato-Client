/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Order from "@/app/models/order";
import Restaurant from "@/app/models/Restaurant";
import { verifyToken } from "@/app/lib/authMiddleware";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    const userId = verifyToken(authHeader ?? undefined);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing or invalid token" },
        { status: 401 }
      );
    }

    const restaurants = await Restaurant.find({ userId });

    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json(
        { success: false, error: "No restaurants found for this user" },
        { status: 404 }
      );
    }

    const restaurantIds = restaurants.map((r) => r._id.toString());

    const orders = await Order.find({
      restaurantId: { $in: restaurantIds },
    }).sort({ date: -1 });

    const restaurantCoords = restaurants.map((r) => ({
      restaurantId: r._id.toString(),
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
    }));

    return NextResponse.json(
      {
        success: true,
        restaurantCoords,
        orders,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching orders:", err);
    return NextResponse.json(
      { success: false, error: err.message, errorType: err.name },
      { status: 500 }
    );
  }
}
