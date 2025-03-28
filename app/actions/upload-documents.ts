"use server"

import { put } from "@vercel/blob"

export async function uploadDocuments(jobDescFile: File, resumeFile: File) {
  try {
    // Upload both files to Vercel Blob
    const jobDescBuffer = Buffer.from(await jobDescFile.arrayBuffer())
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer())

    const jobDescBlob = await put(`job-desc-${Date.now()}.pdf`, jobDescBuffer, {
      access: "public",
    })

    const resumeBlob = await put(`resume-${Date.now()}.pdf`, resumeBuffer, {
      access: "public",
    })

    // Return the URLs
    return {
      success: true,
      jobDescUrl: jobDescBlob.url,
      resumeUrl: resumeBlob.url,
    }
  } catch (error) {
    console.error("Error uploading documents:", error)
    return { success: false, error: String(error) }
  }
}

