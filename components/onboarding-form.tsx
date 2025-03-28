"use client"

import type React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, Upload, FileText, X } from "lucide-react"
import { Label } from "@/components/ui/label"
// Import the blob storage action at the top of the file
import { processDocumentsWithGemini } from "@/app/actions/process-documents"
import { uploadToBlob } from "@/app/actions/blob-storage"
import { Progress } from "@/components/ui/progress"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  jobDescriptionFile: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, `File size should be less than 5MB.`)
    .refine((file) => file.type === "application/pdf", "Only PDF files are accepted."),
  resumeFile: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, `File size should be less than 5MB.`)
    .refine((file) => file.type === "application/pdf", "Only PDF files are accepted."),
})

export function OnboardingForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobDescriptionFileName, setJobDescriptionFileName] = useState<string | null>(null)
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")
  const [geminiResponse, setGeminiResponse] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
    },
  })

  // Update the onSubmit function to use Vercel Blob
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("🔄 [Form] Starting form submission process...")
    setIsSubmitting(true)
    setProcessingStatus("Uploading documents...")
    setProcessingProgress(10)

    // Simulate progress updates during the long-running operation
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev < 90) {
          // Update status message based on progress
          if (prev === 10) {
            console.log("🔄 [Form] Processing job description...")
            setProcessingStatus("Processing job description...")
          }
          if (prev === 30) {
            console.log("🔄 [Form] Analyzing resume...")
            setProcessingStatus("Analyzing resume...")
          }
          if (prev === 50) {
            console.log("🔄 [Form] Generating interview questions...")
            setProcessingStatus("Generating interview questions...")
          }
          if (prev === 70) {
            console.log("🔄 [Form] Preparing AI interviewer...")
            setProcessingStatus("Preparing AI interviewer...")
          }

          return prev + 5
        }
        return prev
      })
    }, 3000) // Update every 3 seconds

    console.log("🚀 [Form] Calling processDocumentsWithGemini...")
    const processStartTime = Date.now()

    // Process the documents with Gemini
    processDocumentsWithGemini(values.jobDescriptionFile, values.resumeFile)
      .then(async (geminiResponseData) => {
        const processDuration = Date.now() - processStartTime
        console.log(`✅ [Form] Gemini processing completed in ${processDuration / 1000} seconds`)

        setProcessingStatus("Storing interview data...")
        setGeminiResponse(geminiResponseData)

        // Upload the Gemini response to Vercel Blob
        console.log("🔄 [Form] Uploading Gemini response to Vercel Blob...")
        const blobResult = await uploadToBlob(geminiResponseData, "gemini-response")

        if (!blobResult.success) {
          // Check if it's an authentication error
          if (blobResult.error && blobResult.error.includes("BLOB_READ_WRITE_TOKEN")) {
            console.error("❌ [Form] Vercel Blob authentication error:", blobResult.error)
            throw new Error("Vercel Blob is not properly configured. Please check your environment variables.")
          } else {
            throw new Error("Failed to upload to Vercel Blob: " + blobResult.error)
          }
        }

        clearInterval(progressInterval)
        setProcessingProgress(100)
        setProcessingStatus("Interview ready!")

        // Safely store data in localStorage (only in browser)
        if (typeof window !== "undefined") {
          console.log("💾 [Form] Storing data in localStorage...")

          // Store the Blob URL instead of the full response
          localStorage.setItem("geminiResponseUrl", blobResult.url)

          // Store context data
          const contextData = {
            name: `${values.firstName} ${values.lastName}`,
            firstName: values.firstName,
            companyName: values.companyName,
          }

          localStorage.setItem("chatContext", JSON.stringify(contextData))
          console.log("✅ [Form] Data stored in localStorage")
        }

        // Short delay to show the "Interview ready!" message
        console.log("⏳ [Form] Waiting before navigation...")
        setTimeout(() => {
          // Navigate to call page
          console.log("🚀 [Form] Navigating to call page...")
          router.push("/call")
        }, 1000)
      })
      // Update the catch block to handle Blob errors with a fallback to localStorage
      .catch((error) => {
        console.error("❌ [Form] Error processing documents:", error)
        clearInterval(progressInterval)

        // If it's a Blob authentication error, try to use localStorage as fallback
        if (error.message && error.message.includes("Vercel Blob")) {
          console.warn("⚠️ [Form] Falling back to localStorage for storing Gemini response")

          try {
            // Check if the response is too large for localStorage
            if (!geminiResponse) {
              throw new Error("Gemini response is null or undefined.")
            }
            const responseSize = new TextEncoder().encode(geminiResponse).length
            console.log(`📊 [Form] Response size: ${(responseSize / 1024).toFixed(2)} KB`)

            if (responseSize > 5 * 1024 * 1024) {
              // 5MB limit
              throw new Error("Response too large for localStorage")
            }

            // Store in localStorage
            localStorage.setItem("geminiResponse", geminiResponse)
            localStorage.setItem("usingBlobStorage", "false")

            // Store context data
            const contextData = {
              name: `${values.firstName} ${values.lastName}`,
              firstName: values.firstName,
              companyName: values.companyName,
            }

            localStorage.setItem("chatContext", JSON.stringify(contextData))
            console.log("✅ [Form] Data stored in localStorage (fallback)")

            // Navigate to call page
            router.push("/call")
            return
          } catch (localStorageError) {
            console.error("❌ [Form] Fallback to localStorage failed:", localStorageError)
          }
        }

        setIsSubmitting(false)
        setProcessingProgress(0)
        // Show error message to user
        alert("We're experiencing higher than normal server load. Please try again in a few minutes.")
      })
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: any,
    setFileName: (name: string | null) => void,
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      field.onChange(file)
    }
  }

  const clearFile = (field: any, setFileName: (name: string | null) => void, inputId: string) => {
    field.onChange(null)
    setFileName(null)
    // Reset the file input
    const fileInput = document.getElementById(inputId) as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const FileUploadComponent = ({
    id,
    field,
    fileName,
    setFileName,
  }: {
    id: string
    field: any
    fileName: string | null
    setFileName: (name: string | null) => void
  }) => {
    return (
      <div className="flex items-center justify-center w-full">
        {!fileName ? (
          <Label
            htmlFor={id}
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/30 hover:bg-secondary/50"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PDF (MAX. 5MB)</p>
            </div>
            <Input
              id={id}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFileChange(e, field, setFileName)}
            />
          </Label>
        ) : (
          <div className="flex flex-col w-full h-auto border-2 rounded-lg bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between p-3 border-b border-primary/10">
              <div className="flex items-center max-w-[80%]">
                <FileText className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
                <span className="font-medium text-sm text-primary truncate">{fileName}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
                onClick={() => clearFile(field, setFileName, id)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hiring Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corporation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobDescriptionFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description PDF</FormLabel>
              <FormControl>
                <FileUploadComponent
                  id="job-description-file"
                  field={field}
                  fileName={jobDescriptionFileName}
                  setFileName={setJobDescriptionFileName}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resumeFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Candidate Resume PDF</FormLabel>
              <FormControl>
                <FileUploadComponent
                  id="resume-file"
                  field={field}
                  fileName={resumeFileName}
                  setFileName={setResumeFileName}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isSubmitting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{processingStatus}</span>
              <span>{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing interview...
            </>
          ) : (
            "Start Interview"
          )}
        </Button>
      </form>
    </Form>
  )
}

