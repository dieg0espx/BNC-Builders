import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail, ContactFormData } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { firstName, lastName, phone, email, address, city, state, zipCode, leadType, message } = data;

    // Validate required fields
    if (!firstName || !lastName || !phone || !email || !message) {
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

    const contactData: ContactFormData = {
      firstName,
      lastName,
      phone,
      email,
      address: address || "",
      city: city || "",
      state: state || "",
      zipCode: zipCode || "",
      leadType: leadType || "",
      message,
    };

    await sendContactEmail(contactData);

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
