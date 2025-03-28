"use server"

import { put } from "@vercel/blob"

// Upload text content to Vercel Blob
export async function uploadToBlob(content: string, fileName: string) {
  console.log(`🔄 [Blob] Uploading content to Vercel Blob (${(content.length / 1024).toFixed(2)} KB)...`)

  try {
    // Check if the BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not set")
    }

    // Create a unique filename with timestamp
    const uniqueFileName = `${fileName}-${Date.now()}.txt`

    // Upload to Vercel Blob with public access
    const blob = await put(uniqueFileName, content, {
      access: "public",
    })

    console.log(`✅ [Blob] Content uploaded successfully to ${blob.url}`)
    return { success: true, url: blob.url }
  } catch (error) {
    console.error("❌ [Blob] Error uploading to Vercel Blob:", error)
    return { success: false, error: String(error) }
  }
}

// Fetch content from a Blob URL
export async function fetchFromBlob(url: string) {
  console.log(`🔄 [Blob] Fetching content from ${url}...`)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }

    const content = await response.text()
    console.log(`✅ [Blob] Content fetched successfully (${(content.length / 1024).toFixed(2)} KB)`)

    return { success: true, content }
  } catch (error) {
    console.error("❌ [Blob] Error fetching from Vercel Blob:", error)
    return { success: false, error: String(error) }
  }
}

