import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb"; 
import Restaurant from "@/app/models/Restaurant"; 
import { IMenuItem } from "@/app/models/Restaurant"; 


interface RequestBody {
    name: string;
    cuisine: string;
    rating: string;
    priceRange: string;
    address: string;
    // imageUrl: string;
    // img: string;
    latitude: string;
    longitude: string;
    menu: IMenuItem[];
    userId: string; 
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body: RequestBody = await req.json();

        // Basic required field validation
        if (!body.name || !body.address || !body.userId) {
            return NextResponse.json(
                { message: "Missing required fields (name, address, userId) or invalid format." },
                { status: 400 }
            );
        }

        const numericData = {
            ...body,
            rating: Number(body.rating),
            latitude: Number(body.latitude),
            longitude: Number(body.longitude),
            userId: body.userId, 
        };

        if (isNaN(numericData.rating) || isNaN(numericData.latitude) || isNaN(numericData.longitude)) {
            return NextResponse.json(
                { message: "Rating, latitude, or longitude must be valid numbers." },
                { status: 400 }
            );
        }

        const newRestaurant = await Restaurant.create(numericData);

        // Success Response
        return NextResponse.json(
            {
                message: "Restaurant added successfully!",
                restaurant: newRestaurant.toObject()
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("Error adding restaurant:", error);
        // 5. Error Response
        return NextResponse.json(
            {
                message: "Failed to add restaurant. Server or database error.",
                error: error.message
            },
            { status: 500 }
        );
    }
}

// export async function GET(req: NextRequest) {
//     try {
//         await dbConnect();
//         // 2. Fetch all restaurants
//         const restaurants = await Restaurant.find({}).lean();

//         // 3. Success Response
//         return NextResponse.json(
//             {
//                 success: true,
//                 count: restaurants.length,
//                 restaurants: restaurants
//             },
//             { status: 200 }
//         );

//     } catch (error: any) {
//         console.error("Error fetching restaurants:", error);

//         // 4. Error Response
//         return NextResponse.json(
//             {
//                 success: false,
//                 message: "Failed to fetch restaurant data.",
//                 error: error.message
//             },
//             { status: 500 }
//         );
//     }
// }
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const restaurants = await Restaurant.find({ userId }).lean();

    return NextResponse.json(
      {
        success: true,
        count: restaurants.length,
        restaurants,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching restaurants:", error);
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
