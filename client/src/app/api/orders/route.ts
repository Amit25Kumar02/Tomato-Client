/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Order from "@/app/models/order";
import Restaurant from "@/app/models/Restaurant";
import { verifyToken } from "@/app/lib/authMiddleware";
 

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    //  Get userId from token
    const authHeader = req.headers.get("authorization");
    const userId = verifyToken(authHeader ?? undefined);
    // console.log("Authenticated userId:", userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing or invalid token" },
        { status: 401 }
      );
    }

    //  Find the restaurant owned by this user
    const restaurant = await Restaurant.findOne({ userId });
    // console.log("Authenticated restaurant:", restaurant);

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found for this user" },
        { status: 404 }
      );
    }

    //  Fetch all orders linked to that restaurantId
    const orders = await Order.find({ restaurantId: restaurant._id.toString() }).sort({ date: -1 });
    // console.log(`Fetched ${orders.length} orders for restaurantId:`, restaurant._id);

    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching orders:", err);
    return NextResponse.json(
      { success: false, error: err.message, errorType: err.name },
      { status: 500 }
    );
  }
}




