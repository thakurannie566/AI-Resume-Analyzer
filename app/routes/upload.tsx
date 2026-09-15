import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { convertPdfToImage, extractPdfText } from "~/lib/pdf2image";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";
import { AIResponseFormat, prepareInstructions } from "../../constants";

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUploaderKey, setFileUploaderKey] = useState(0);
  const handleFileSelect = (file: File | null) => {
    setFile(file);
    if (!file) setFileUploaderKey((key) => key + 1);
  };

  const handleAnalyze: any = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);
    setStatusText("Uploading the file...");
    const uploadedFile: any = await fs.upload([file]);

    if (!uploadedFile) return setStatusText("Error: Failed to upload file");

    setStatusText("Converting to image....");
    const imageFile: any = await convertPdfToImage(file);
    if (!imageFile.file)
      return setStatusText(
        imageFile.error || "Error: Failed to convert PDF to image",
      );

    setStatusText("Extracting resume text ...");
    let resumeText = "";
    try {
      resumeText = await extractPdfText(file);
    } catch {
      return setStatusText("Error: Failed to extract resume text");
    }
    if (!resumeText)
      return setStatusText("Error: No readable text found in the resume");

    setStatusText("Uploading the image ...");
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) return setStatusText("Error: Failed to upload Image");

    setStatusText("Preparing data ...");
    const uuid = generateUUID();
    const data = {
      id: uuid,
      resumePath: uploadedFile.path,
      imagePath: uploadedImage.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback: "",
    };

    await kv.set(`resume:${uuid}`, JSON.stringify(data));

    setStatusText("Analyzing....");

    const feedback = await ai.feedback(
      `${prepareInstructions({ jobTitle, jobDescription, AIResponseFormat })}

RESUME CONTENT:
${resumeText}`,
    );
    if (!feedback) return setStatusText("Error: Failed to analyze resume");

    const feedbackText =
      typeof feedback.message.content === "string"
        ? feedback.message.content
        : feedback.message.content[0].text;

    data.feedback = JSON.parse(feedbackText);
    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText("Analysis complete, redirecting....");
    console.log(data);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form: HTMLFormElement | null = event.currentTarget.closest("form");
    if (!form) return;
    const formData = new FormData(form);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!file) return;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-80 h-80" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips </h2>
          )}
          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader
                  key={fileUploaderKey}
                  onFileSelect={handleFileSelect}
                />
                <button className="primary-button" type="submit">
                  Analyze Resume
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
