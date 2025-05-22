// src/app/api/request-demo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

// Initialize Resend with your API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Define a schema for validating the request body (matches your FormData interface)
const demoRequestSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(), // Or add specific validation if needed
  schoolName: z.string().min(1, "School name is required"),
  schoolLocation: z.string().min(1, "School location is required"),
  role: z.string().min(1, "Role is required"),
  studentCount: z.string().min(1, "Student count is required"),
  goals: z.array(z.string()),
  otherGoal: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validation = demoRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      phoneNumber,
      schoolName,
      schoolLocation,
      role,
      studentCount,
      goals,
      otherGoal,
    } = validation.data;

    const toEmail =
      process.env.DEMO_REQUEST_RECEIVE_EMAIL ||
      process.env.CONTACT_FORM_RECEIVE_EMAIL;
    if (!toEmail) {
      console.error(
        "Email for receiving demo requests is not set in environment variables."
      );
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // Construct a readable goals string
    let goalsString =
      goals.length > 0
        ? `<ul>${goals.map((g) => `<li>${g}</li>`).join("")}</ul>`
        : "No specific goals selected.";
    if (otherGoal) {
      goalsString += `<p><strong>Other Goal:</strong> ${otherGoal}</p>`;
    }

    const emailData = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [toEmail],
      reply_to: email,
      subject: `New Demo Request: ${schoolName} - ${fullName}`,
      html: `
        <h1>New Demo Request</h1>
        <h2>Contact Information:</h2>
        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phoneNumber ? `<p><strong>Phone Number:</strong> ${phoneNumber}</p>` : ""}
        
        <h2>School Information:</h2>
        <p><strong>School Name:</strong> ${schoolName}</p>
        <p><strong>School Location:</strong> ${schoolLocation}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Approx. Student Count:</strong> ${studentCount}</p>
        
        <h2>Goals:</h2>
        ${goalsString}
      `,
    });

    if (emailData.error) {
      console.error("Resend API Error (Demo Request):", emailData.error);
      return NextResponse.json(
        {
          error: "Failed to send demo request email.",
          details: emailData.error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Demo request sent successfully!", data: emailData.data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing demo request:", error);
    let errorMessage =
      "An unexpected error occurred processing the demo request.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
