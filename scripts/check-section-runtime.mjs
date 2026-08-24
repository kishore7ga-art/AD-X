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

const FILE = "src/lib/section-runtime.ts";
const MANIFEST = "shared-files.lock.json";

/** Line endings differ between checkouts on Windows; content does not. */
const digest = (path) =>
  createHash("sha256")
    .update(readFileSync(path, "utf8").replace(/\r\n/g, "\n"))
    .digest("hex")
    .slice(0, 16);

if (!existsSync(FILE)) {
  console.error(`[shared] ${FILE} is missing.`);
  process.exit(1);
}

if (!existsSync(MANIFEST)) {
  console.error(
    `[shared] ${MANIFEST} is missing. Copy it from xite-F after running that repo's --update.`,
  );
  process.exit(1);
}

const expected = JSON.parse(readFileSync(MANIFEST, "utf8"))[FILE];
const actual = digest(FILE);

if (expected !== actual) {
  console.error(
    `\n[shared] ${FILE} no longer matches xite-F.\n` +
      `    manifest ${expected ?? "(absent)"} · here ${actual}\n\n` +
      "  Sections will render differently in the Admin preview than they do in\n" +
      "  the editor and on the live site. Copy the change across all three repos,\n" +
      "  run `node scripts/check-shared-files.mjs --update` in xite-F, and copy\n" +
      "  the regenerated manifest here.\n",
  );
  process.exit(1);
}

console.log(`[shared] ${FILE} matches xite-F.`);
