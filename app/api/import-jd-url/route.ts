import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export interface ImportJDResponse {
  success: boolean;
  data?: {
    text: string;
    source: "greenhouse" | "lever" | "workday";
    sourceUrl: string;
  };
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Determine source board from hostname
    const hostname = parsedUrl.hostname.toLowerCase();
    let source: "greenhouse" | "lever" | "workday" | null = null;

    if (
      hostname === "boards.greenhouse.io" ||
      hostname === "job-boards.greenhouse.io"
    ) {
      source = "greenhouse";
    } else if (hostname === "jobs.lever.co") {
      source = "lever";
    } else if (hostname.endsWith(".myworkdayjobs.com")) {
      source = "workday";
    }

    if (!source) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported job board. Currently supported: Greenhouse, Lever, Workday. For LinkedIn or other boards, please copy the JD text manually.",
        },
        { status: 400 }
      );
    }

    // Fetch the HTML server-side (bypasses CORS)
    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; PMCareerCopilot/1.0; +https://pmcareercopilot.app)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(10000), // 10-second timeout
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to fetch URL (status ${response.status}). The job posting may be expired or private.`,
          },
          { status: 502 }
        );
      }

      html = await response.text();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown fetch error";
      return NextResponse.json(
        {
          success: false,
          error: `Could not fetch URL: ${message}. Please paste the JD manually.`,
        },
        { status: 502 }
      );
    }

    // Parse HTML with Cheerio
    const text = extractJDText(html, source);

    if (!text || text.length < 200) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not extract enough content from this URL. The page structure may have changed. Please paste the JD manually.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        text,
        source,
        sourceUrl: url,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      { success: false, error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}

function extractJDText(html: string, source: string): string {
  const $ = cheerio.load(html);

  // Universal noise removal
  $("script, style, nav, header, footer, noscript, svg, iframe").remove();

  let raw = "";

  if (source === "greenhouse") {
    // Greenhouse: content typically in #content, .content, or <article>
    raw =
      $("#content").text() ||
      $(".content").text() ||
      $("article").text() ||
      $("main").text() ||
      $("body").text();
  } else if (source === "lever") {
    // Lever: content in .posting-page or .section-wrapper
    raw =
      $(".posting-page").text() ||
      $(".section-wrapper").text() ||
      $("main").text() ||
      $("body").text();
  } else if (source === "workday") {
    // Workday: try data-automation-id selectors first (server-rendered for SEO)
    raw =
      $('[data-automation-id="jobPostingDescription"]').text() ||
      $('[data-automation-id="job-posting-details"]').text() ||
      $("main").text() ||
      $("body").text();
  }

  return cleanText(raw);
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ") // collapse all whitespace
    .replace(/\n{3,}/g, "\n\n") // limit consecutive blank lines
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();
}
