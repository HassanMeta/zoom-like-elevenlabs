"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

export async function processDocumentsWithGemini(jobDescFile: File, resumeFile: File) {
  console.log("🔄 [Gemini] Starting document processing...")
  console.log(`📄 [Gemini] Job description file size: ${(jobDescFile.size / 1024).toFixed(2)} KB`)
  console.log(`📄 [Gemini] Resume file size: ${(resumeFile.size / 1024).toFixed(2)} KB`)

  const startTime = Date.now()

  try {
    // Initialize Gemini API with your API key
    console.log("🔑 [Gemini] Initializing Gemini API...")
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

    // Convert files to appropriate format
    console.log("🔄 [Gemini] Converting files to base64...")
    const jobDescArrayBuffer = await jobDescFile.arrayBuffer()
    const resumeArrayBuffer = await resumeFile.arrayBuffer()

    const jobDescBuffer = Buffer.from(jobDescArrayBuffer)
    const resumeBuffer = Buffer.from(resumeArrayBuffer)

    console.log("📝 [Gemini] Preparing request payload...")
    // Replace the contents array creation with the correct format for Gemini API
    const contents = {
      contents: [
        {
          parts: [
            {
              text: `As an AI language model integrated into an assistant API, help generate prompt for realtime api to conduct comprehensive interview based on the provided Job Description and Candidate Resume. These would be provided as PDF attachments.

For each skill identified as required in the Job Description, carefully evaluate the candidate's resume for matching experience and skills.  Assign an expertise level (on a scale of 0-5, where 5 is expert) required for each skill based on the Job Description and also estimate the candidate's expertise level based on their resume. Score the match of each skill.

Generate the following interview questions, ensuring they are tailored to the expertise level implied by the Job Description and effectively evaluate the candidate's suitability for the role. Specifically, questions should probe into potential skill gaps identified in the resume compared to the Job Description:

Technical Question (5 - Skill testing Focus):

Create five questions the validate the skills mentioned by the candidate in his/her resume . These questions should go beyond basic recall and assess conceptual understanding, application, and analytical skills. For roles requiring expert-level knowledge (determine this from Job Description), frame scenario-based or multi-step problems requiring in-depth reasoning relevant to the job domain. Do not ask questions which merely confirm information already present in the resume. Ensure well-crafted multiple-choice distractors to effectively evaluate depth of understanding. Your question shall not provide obvious hints for candidate to provide answers.

Open-Ended Questions (5 - Experience & Gap Focused):

Formulate five open-ended questions designed for the candidate to elaborate on their experiences and skills, particularly to assess areas where the resume might show a gap compared to job description requirements (e.g., e-commerce experience if the resume is from a different industry, specific software expertise). Based on job description and candidates past experience create experience-based questions. Include hypothetical scenario-based questions directly relevant to the role's challenges and responsibilities to assess problem-solving and practical application skills in role-relevant situations.

Behavioral Questions (2 - Trait-Specific):

Generate two to three behavioral questions targeting specific behavioral traits essential for the role as inferred from the Job Description (e.g., teamwork, leadership, adaptability, communication, problem-solving).

Output Format
You are required to design a system prompt for the realtime api to conduct the candidate's interview and it should include the following details. The output should be in markdown format and should contain only the output not extra prefixes or field names, etc. Only clean output-

Interview Instructions: This should cover intstruction for the structure or flow of the conversation. It should be as follows - 

Interview Structure:
   - **Introduction:** 
       • Welcome the candidate and ask for a brief self-introduction.
       • Request an overview of their career background and key achievements. **Ask follow-up questions if any of the points mentioned by the candidate seem relevant and important**.
      There is no need to explain the interview format for the duration of the call unless the candidates ask for the same.
   - **Technical/Experience-Based Evaluation (Ask any 5 to 6 questions from the question provided) :**
       • Ask interview questions based on the questions identified 
       • Include guidance for adaptive follow-up questions if initial responses are brief, such as:
           - "What were the key challenges you encountered in that project, and how did you overcome them?"
           - "Can you provide more detail on the improvements you implemented?
   - **Motivation and Cultural Fit:**
        - Ask behavioral questions based on the questions identifed (ask any two questions).
       • Ask why the candidate is interested in the role at the company?.
       • Explore how they see their past experiences and skills contributing to the company's growth.
       • For experienced candidates (non-freshers), include additional questions:
           - "Could you explain your reasons for leaving your previous role?"
           - "What is your notice period and how soon can you join if selected?"
       • For fresher candidates, focus on their potential, eagerness to learn, and adaptability.
In case the candidate wants to understand anything about the hiring compay - their policies, culture, timings, office rules, etc, pls politely tell them that this is not part of today's conversation, after you clear this round the HR of the hiring company shall provide the necessary details and information.
Job Description Summary: A summary of resume useful as context for the interview AI bot

Resume analysis: Provided a resume analysis with appropriate details such that Interview AI bot has all the relevant experience, educational and skill related information for conducting the interview, so that it can have personalised conversation with the candidate

Overall Resume Evaluation: Fit for the job description with rationale, 

Technical (skill-focused) Questions: [List of 5 questions with answer key, rationale, and clearly stated expertise level for answering the question.]

Open-Ended Questions: [List of 5 open-ended questions with rationale for the question, and clearly indicate which skill gap or specific experience area the question aims to probe.]

Behavioral Questions: [List of 2-3 behavioral questions with clearly stated traits to be tested from each question]

Notes
Ensure questions are directly relevant to the identified skills and responsibilities outlined in the Job Description.

Avoid redundancy across question types. Each question type should serve a distinct purpose in evaluation.

Frame questions in the context of the specific industry or domain of the Job Description.
Be very aggressive if the candidate is not answering or trying to act smart.

Explicitly address and evaluate skill/experience gaps in open-ended and potentially closed-ended questions.

Ensure the expertise level of closed-ended questions is appropriately challenging based on the job seniority and requirements.`,
            },
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

    console.log("🚀 [Gemini] Sending request to Gemini API...")
    console.log(`⏱️ [Gemini] Time elapsed before API call: ${(Date.now() - startTime) / 1000} seconds`)

    // Call Gemini API with a longer timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

    try {
      // Call Gemini API
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro-exp-03-25",
        generationConfig: {
          temperature: 2,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 65536,
          responseMimeType: "text/plain",
        },
      })

      console.log("⏳ [Gemini] Waiting for Gemini API response...")
      const apiCallStartTime = Date.now()
      const response = await model.generateContent(contents)
      const apiCallDuration = Date.now() - apiCallStartTime
      console.log(`✅ [Gemini] Response received in ${apiCallDuration / 1000} seconds`)

      clearTimeout(timeoutId)

      const result = response.response.text()

      // Log the size of the response
      const responseSize = new TextEncoder().encode(result).length
      console.log(`📊 [Gemini] Response size: ${(responseSize / 1024).toFixed(2)} KB`)
      console.log(`📊 [Gemini] Response size: ${(responseSize / (1024 * 1024)).toFixed(4)} MB`)

      if (responseSize > 1024 * 1024) {
        console.warn("⚠️ [Gemini] Response size exceeds Firebase 1MB document limit!")
      }

      // Log a sample of the response (first 500 chars)
      console.log(`📝 [Gemini] Response sample: ${result.substring(0, 500)}...`)

      console.log(`⏱️ [Gemini] Total processing time: ${(Date.now() - startTime) / 1000} seconds`)
      console.log("✅ [Gemini] Analysis completed successfully")

      return result
    } catch (error) {
      clearTimeout(timeoutId)
      console.error("❌ [Gemini] API call failed:", error)
      throw error
    }
  } catch (error) {
    console.error("❌ [Gemini] Error processing documents:", error)
    throw new Error("Failed to process documents. Please try again later.")
  }
}

