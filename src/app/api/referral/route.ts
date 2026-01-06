import { NextRequest, NextResponse } from "next/server";
import { sendReferralEmail, ReferralFormData } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { referrerFirstName, referrerLastName, referrerPhone, referrerEmail, referredName, referredPhone, referredEmail, message } = data;

    // Validate required fields
    if (!referrerFirstName || !referrerLastName || !referrerPhone || !referrerEmail || !referredName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(referrerEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const referralData: ReferralFormData = {
      referrerName: `${referrerFirstName} ${referrerLastName}`,
      referrerEmail,
      referrerPhone,
      referredName,
      referredEmail: referredEmail || "",
      referredPhone: referredPhone || "",
      message: message || "",
    };

    await sendReferralEmail(referralData);

    return NextResponse.json({ success: true, message: "Referral submitted successfully" });
  } catch (error) {
    console.error("Referral form error:", error);
    return NextResponse.json(
      { error: "Failed to submit referral" },
      { status: 500 }
    );
  }
}
