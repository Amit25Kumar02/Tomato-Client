// /app/api/users/route.ts
import { NextResponse } from "next/server";
import connectToDB from "@/app/lib/mongodb";
import User from "@/app/models/users";

export async function GET() {
  await connectToDB();
  try {
    const users = await User.find({}).lean(); 
   return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
