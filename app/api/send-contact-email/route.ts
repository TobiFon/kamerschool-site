// src/app/api/send-contact-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

// Initialize Resend with your API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Define a schema for validating the request body
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validation = contactFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validation.data;

    // --- IMPORTANT ---
    // You MUST have a verified domain in Resend.
    // The `from` email address MUST be on that verified domain.
    // Example: if your verified domain is `yourcompany.com`,
    // you can use `from: 'Contact Form <noreply@yourcompany.com>'`
    // or `from: 'KamerSchools Contact <contact@kamerschools.example.cm>'`
    // (assuming `kamerschools.example.cm` is YOUR verified domain)

    // The `to` address is where you want to receive the contact form submissions.
    const toEmail =
      process.env.DEMO_REQUEST_RECEIVE_EMAIL ||
      process.env.CONTACT_FORM_RECEIVE_EMAIL;
    if (!toEmail) {
      console.error(
        "CONTACT_FORM_RECEIVE_EMAIL environment variable is not set."
      );
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const emailData = await resend.emails.send({
      from: "onboarding@resend.dev", // Use Resend's shared domain for local development
      to: [toEmail],
      reply_to: email,
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h1>New Contact Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    if (emailData.error) {
      console.error("Resend API Error:", emailData.error);
      return NextResponse.json(
        { error: "Failed to send email.", details: emailData.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Email sent successfully!", data: emailData.data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
