import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildSectionPreviewDocument } from "@/lib/section-runtime";

describe("Section Thumbnail Preview & Document Generation", () => {
  test("generates preview document containing section HTML markup and Tailwind CDN", () => {
    const rawHtml = `<section class="bg-blue-600 text-white p-8"><h1>FAQ Section</h1><p>Answers to questions</p></section>`;
    const doc = buildSectionPreviewDocument(rawHtml);

    assert.ok(doc.includes("<!DOCTYPE html>"), "Doc must start with standard DOCTYPE");
    assert.ok(doc.includes("FAQ Section"), "Doc must preserve section text");
    assert.ok(doc.includes("https://cdn.tailwindcss.com"), "Doc must load Tailwind CDN");
  });

  test("handles empty or minimal section code gracefully", () => {
    const doc = buildSectionPreviewDocument("");
    assert.ok(doc.includes("<!DOCTYPE html>"));
  });
});
