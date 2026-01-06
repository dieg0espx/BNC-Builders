import { NextRequest, NextResponse } from "next/server";
import { sendCareerEmail, CareerFormData } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { firstName, lastName, phone, email, position, message } = data;

    // Validate required fields
    if (!firstName || !lastName || !phone || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const careerData: CareerFormData = {
      firstName,
      lastName,
      phone,
      email,
      position: position || "",
      message: message || `Position applied for: ${position}`,
    };

    await sendCareerEmail(careerData);

    return NextResponse.json({ success: true, message: "Application submitted successfully" });
  } catch (error) {
    console.error("Career form error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
