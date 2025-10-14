import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Order from "@/app/models/order";

interface Context {
  params: Promise<{
    orderId: string;
  }>;
}

export async function PATCH(req: NextRequest, context: Context) {
  try {
    await dbConnect();

    //  Await params first
    const { orderId } = await context.params;

    // Get the new status from the request body
    const body = await req.json();
    const { orderStatus } = body;

    if (!orderStatus) {
      return NextResponse.json(
        { success: false, error: "orderStatus is required" },
        { status: 400 }
      );
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: updatedOrder,
        message: "Order status updated successfully",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, errorType: err.name },
      { status: 500 }
    );
  }
}
