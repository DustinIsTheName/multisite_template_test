import fs from 'fs-extra';
import path from 'path';
import { log, error, warn, success, final } from './utils.js';
import { sites, groups, themeMap } from './utils.js';
import { validateSite, prompt } from './utils.js';

const [sourceSite, targetSite] = process.argv.slice(2);
const overwrite = process.argv.includes("--ovr");
const allowNonJson = process.argv.includes("--include-all");

// catch missing parameters
if (!sourceSite || !targetSite) {
  error(`Missing required arguments:${sourceSite || '\nsource site'}${targetSite || '\ntarget site'}`);
  process.exit(1);
}

if (sourceSite === targetSite) {
  error(`Cannot propagate "${sourceSite}" to itself!`);
  process.exit(1);
}

// validate the sites are established
if (!validateSite(sourceSite, { groupAllowed: false }) || !validateSite(targetSite)) {
  process.exit(1);
}

// Warn when using potentially destructive flags
if (overwrite || allowNonJson) {
  const answer = await prompt(`CAUTION! propagate from "${sourceSite}" to "${targetSite}" with flags:${overwrite ? ' --ovr (overwrite)':''}${allowNonJson ? ' --include-all':''}. Continue? (y/n): `);

  if (answer !== "y") {
    process.exit(0);
  }
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    success(`Created directory: ${dirPath}`);
  }
}

// simplifed version of copyDirectory from scripts/copy-entire-theme.js
function propJSON(source, destination) {
  log(`Copying from ${source} to ${destination}...`);
  try {
    // Ensure destination directory exists
    ensureDirectoryExists(destination);

    // Read all items in source directory
    const items = fs.readdirSync(source);

    for (const item of items) {
      const sourcePath = path.join(source, item);
      // Get item stats
      const stats = fs.statSync(sourcePath);
      let destPath = path.join(destination, item);

      if (stats.isDirectory()) {
        // Recursively copy directory
        propJSON(sourcePath, destPath);
      } else {
        // skip ALL non-json, unless --include-all flag is presant
        if (item.indexOf('.json') === -1 && !allowNonJson) continue;
        // Copy file; overwrite ONLY if --ovr flag is presant
        // if (source != mainThemeDir) log(`Copied: ${sourcePath} -> ${destPath}`);
        if (!fs.existsSync(destPath) || overwrite) {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
    }
  } catch (err) {
      error(`Error copying ${source} to ${destination}: ${err.message}`);
      error(err.stack);
  }
}

// Define the source directory
const sourceDir = themeMap[sourceSite];

// propagate from source to entire group if group was passed
if (groups[targetSite]) {
  groups[targetSite].forEach((site) => {
    const targetDir = themeMap[site];
    propJSON(sourceDir, targetDir);
  });
// propagate from source to single site otherwise
} else {
  const targetDir = themeMap[targetSite];
  propJSON(sourceDir, targetDir);
}