"use client";

import * as pdfjsLib from "pdfjs-dist";

// Use locally hosted worker from /public (copied via postinstall script)
// This is more reliable than CDN URLs which break with pdfjs-dist v5+
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export interface PDFExtractResult {
  text: string;
  pageCount: number;
  warnings: string[];
}

export async function extractTextFromPDF(file: File): Promise<PDFExtractResult> {
  const warnings: string[] = [];

  // Validate file type
  if (file.type !== "application/pdf") {
    throw new Error("File must be a PDF");
  }

  // Validate file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("PDF must be under 5MB");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Build text with line breaks preserved
      const pageText = textContent.items
        .map((item: unknown) => (item && typeof item === "object" && "str" in item ? (item as { str: string }).str : ""))
        .join(" ");

      fullText += pageText + "\n\n";
    }

    const cleaned = cleanExtractedText(fullText);

    if (cleaned.length < 100) {
      warnings.push(
        "Extracted text is very short. This may be an image-based PDF (no text layer). Please paste your resume manually."
      );
    }

    return { text: cleaned, pageCount, warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse PDF";
    throw new Error(`PDF parsing failed: ${message}`);
  }
}

function cleanExtractedText(text: string): string {
  return text
    // Collapse multiple spaces
    .replace(/[ \t]+/g, " ")
    // Collapse 3+ newlines to 2
    .replace(/\n{3,}/g, "\n\n")
    // Trim each line
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    // Remove leading/trailing whitespace
    .trim();
}
