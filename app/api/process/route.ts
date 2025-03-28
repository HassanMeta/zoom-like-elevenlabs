import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { put } from "@vercel/blob"

export const runtime = "edge" // Use Edge runtime for longer execution

export async function POST(request: NextRequest) {
  try {
    const { jobDescUrl, resumeUrl, firstName, lastName, companyName } = await request.json()

    // Fetch the documents from Blob
    const [jobDescResponse, resumeResponse] = await Promise.all([fetch(jobDescUrl), fetch(resumeUrl)])

    if (!jobDescResponse.ok || !resumeResponse.ok) {
      throw new Error("Failed to fetch documents")
    }

    const jobDescBuffer = Buffer.from(await jobDescResponse.arrayBuffer())
    const resumeBuffer = Buffer.from(await resumeResponse.arrayBuffer())

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

    // Process with Gemini (your existing code)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 2,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 65536,
        responseMimeType: "text/plain",
      },
    })

    // Create contents object (your existing code)
    const contents = {
      contents: [
        {
          parts: [
            { text: "Your existing prompt..." },
            {
              inline_data: {
                mime_type: "application/pdf",
                data: jobDescBuffer.toString("base64"),
              },
            },
            {
              inline_data: {
                mime_type: "application/pdf",
                data: resumeBuffer.toString("base64"),
              },
            },
          ],
        },
      ],
    }

    // Generate content
    const response = await model.generateContent(contents)
    const result = response.response.text()

    // Upload result to Blob
    const blob = await put(`gemini-response-${Date.now()}.txt`, result, {
      access: "public",
    })

    // Return success with the URL
    return NextResponse.json({
      success: true,
      url: blob.url,
      contextData: {
        name: `${firstName} ${lastName}`,
        firstName,
        companyName,
      },
    })
  } catch (error) {
    console.error("Error processing documents:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

