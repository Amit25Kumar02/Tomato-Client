import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Client from '@/app/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const { name, email, phone, password } = await req.json();

    // Validate if all fields are present
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const existingUserByEmail = await Client.findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json({ message: 'A user with this email already exists' }, { status: 400 });
    }

    const existingUserByPhone = await Client.findOne({ phone });
    if (existingUserByPhone) {
      return NextResponse.json({ message: 'A user with this phone number already exists' }, { status: 400 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user in the database
    const newUser = new Client({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    await newUser.save();

    // Return a success response
    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
  await connectDB();

  try {

    const user = await Client.findOne().select("name email phone -_id");
    console.log("Fetch user:", user);
    if (!user) {
      return NextResponse.json({ message: "No user found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Fetch user error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}