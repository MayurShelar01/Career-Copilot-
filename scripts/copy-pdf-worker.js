// Copies the pdfjs-dist worker to /public so Next.js serves it as a static asset.
// Required because pdfjs-dist v5 doesn't reliably ship workers via CDN.
const fs = require("fs");
const path = require("path");

const sourceFile = path.join(
  __dirname,
  "..",
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.mjs"
);

const destDir = path.join(__dirname, "..", "public");
const destFile = path.join(destDir, "pdf.worker.min.mjs");

try {
  if (!fs.existsSync(sourceFile)) {
    console.warn(
      "[copy-pdf-worker] Source worker not found at:",
      sourceFile,
      "— skipping copy."
    );
    process.exit(0);
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(sourceFile, destFile);
  console.log("[copy-pdf-worker] Copied PDF worker to /public/pdf.worker.min.mjs");
} catch (error) {
  console.error("[copy-pdf-worker] Failed to copy PDF worker:", error);
  process.exit(0); // don't fail install
}
