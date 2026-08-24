/**
 * Fails the build when `src/lib/section-runtime.ts` has drifted from xite-F's.
 *
 * This file is the environment every section is authored against. The Admin
 * previews a section in an iframe built from it; the editor canvas and the
 * published site build their surfaces from it. All three "agree by
 * construction" only for as long as the file is genuinely identical, and until
 * now nothing checked — it was a manual copy in three places, which is the one
 * shape of drift that stays invisible until a section renders one way in the
 * studio and another way live.
 *
 * The hash lives in `shared-files.lock.json`, the same manifest xite-F and
 * xite-B use, so a legitimate change is: edit it in all three, run
 *   node scripts/check-shared-files.mjs --update
 * in xite-F, and copy the regenerated manifest to the others.
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

const FILES = [
  // The environment every section is authored against and rendered into.
  "src/lib/section-runtime.ts",
  // What category a section is. A fourth, divergent copy of this list is what
  // made every CTA template invisible in the editor and unswappable.
  "src/lib/sections/categories.ts",
];
const MANIFEST = "shared-files.lock.json";

/** Line endings differ between checkouts on Windows; content does not. */
const digest = (path) =>
  createHash("sha256")
    .update(readFileSync(path, "utf8").replace(/\r\n/g, "\n"))
    .digest("hex")
    .slice(0, 16);

for (const file of FILES) {
  if (!existsSync(file)) {
    console.error(`[shared] ${file} is missing.`);
    process.exit(1);
  }
}

if (!existsSync(MANIFEST)) {
  console.error(
    `[shared] ${MANIFEST} is missing. Copy it from xite-F after running that repo's --update.`,
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const drifted = FILES.filter((file) => manifest[file] !== digest(file));

if (drifted.length > 0) {
  console.error("\n[shared] These no longer match xite-F:\n");
  for (const file of drifted) {
    console.error(
      `  ${file}\n    manifest ${manifest[file] ?? "(absent)"} · here ${digest(file)}`,
    );
  }
  console.error(
    "\n  Sections will render, or be categorised, differently here than in the\n" +
      "  editor and on the live site. Copy the change across all three repos, run\n" +
      "  `node scripts/check-shared-files.mjs --update` in xite-F, and copy the\n" +
      "  regenerated manifest here.\n",
  );
  process.exit(1);
}

console.log(`[shared] ${FILES.length} shared files match xite-F.`);
