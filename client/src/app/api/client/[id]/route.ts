import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/app/lib/mongodb";
import Client from "@/app/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectToDB();

  try {
    // Await the params promise
    const { id } = await params;
    const user = await Client.findById(id).lean();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// --- UPDATE user by ID ---
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectToDB();

  try {
    // Await both params and request body
    const { id } = await params;
    const body = await req.json();
    
    console.log("Update Request Body:", body);

    // Convert DOB string to Date
    if (body.dob) {
      body.dob = new Date(body.dob);
    }

    const updatedUser = await Client.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Updated User:", updatedUser);
    
    return NextResponse.json(
      {
        status: 200,
        message: "User updated successfully",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH /api/users/[id] error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}