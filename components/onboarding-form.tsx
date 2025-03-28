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

  // Update your onSubmit function to use the two-step approach
  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("🔄 [Form] Starting form submission process...")
    setIsSubmitting(true)
    setProcessingStatus("Uploading documents...")
    setProcessingProgress(10)

    try {
      // Step 1: Upload documents to Blob
      const uploadResult = await uploadDocuments(values.jobDescriptionFile, values.resumeFile)

      if (!uploadResult.success) {
        throw new Error("Failed to upload documents: " + uploadResult.error)
      }

      setProcessingStatus("Processing documents...")
      setProcessingProgress(30)

      // Step 2: Process documents in the background
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescUrl: uploadResult.jobDescUrl,
          resumeUrl: uploadResult.resumeUrl,
          firstName: values.firstName,
          lastName: values.lastName,
          companyName: values.companyName,
        }),
      })

      if (!response.ok) {
        throw new Error("Processing failed with status: " + response.status)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error("Processing failed: " + result.error)
      }

      // Store results in localStorage
      localStorage.setItem("geminiResponseUrl", result.url)
      localStorage.setItem("chatContext", JSON.stringify(result.contextData))

      setProcessingProgress(100)
      setProcessingStatus("Interview ready!")

      // Navigate to call page
      setTimeout(() => router.push("/call"), 1000)
    } catch (error) {
      console.error("Error:", error)
      setIsSubmitting(false)

      // Handle specific errors
      if (String(error).includes("timeout") || String(error).includes("504")) {
        alert("The document processing is taking longer than expected. Please try with smaller documents.")
      } else {
        alert("An error occurred. Please try again later.")
      }
    }
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

async function uploadDocuments(
  jobDescriptionFile: File,
  resumeFile: File,
): Promise<{ success: boolean; jobDescUrl?: string; resumeUrl?: string; error?: string }> {
  try {
    // Upload job description
    const jobDescResult = await uploadToBlob(jobDescriptionFile, "job-descriptions")
    if (!jobDescResult.success) {
      return { success: false, error: "Failed to upload job description: " + jobDescResult.error }
    }

    // Upload resume
    const resumeResult = await uploadToBlob(resumeFile, "resumes")
    if (!resumeResult.success) {
      return { success: false, error: "Failed to upload resume: " + resumeResult.error }
    }

    return {
      success: true,
      jobDescUrl: jobDescResult.url,
      resumeUrl: resumeResult.url,
    }
  } catch (error: any) {
    console.error("Upload error:", error)
    return { success: false, error: "Upload failed: " + error.message }
  }
}

