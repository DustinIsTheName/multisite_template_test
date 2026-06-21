import fs from 'fs-extra';
import path from 'path';
import { log, error, warn, success, aside } from './utils.js';
import { themeMap, deployMap } from './utils.js';
import postcss from 'postcss';
import postcssMinify from '@csstools/postcss-minify'

/*
    * This script copies the entire theme from the deploy directory to the local theme directory.
*/

// Get environment parameter from command line
const direction = process.argv[2] || 'pull';
const site = process.argv[3];
const json = process.argv[4] || false;

// Define the directories
const deployDir = deployMap[site];
const siteThemeDir = themeMap[site];

const mainThemeDir = 'sites/_shared';
const sourceDir = direction === 'push' ? siteThemeDir : deployDir ;
const targetDir = direction === 'push' ? deployDir : siteThemeDir ;

const ignoredFiles = new Set([
  '.DS_Store',
  'Thumbs.db'
]);

// Function to ensure directory exists
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        success(`Created directory: ${dirPath}`);
    }
}

// Function to copy files and directories recursively
function copyDirectory(source, destination) {
    log(`Copying from ${source} to ${destination}...`);
    try {
        // Ensure destination directory exists
        ensureDirectoryExists(destination);

        // Read all items in source directory
        const items = fs.readdirSync(source);

        for (const item of items) {
            if (ignoredFiles.has(item)) continue;
            const sourcePath = path.join(source, item);
            // Get item stats
            const stats = fs.statSync(sourcePath);
            let destPath = path.join(destination, item);

            if (direction === 'pull') {
                // Use main dir if file isn't in site dir, expect for .json files
                if (!fs.existsSync(destPath) && item.indexOf('.json') === -1 && !stats.isDirectory()) {
                    destPath = path.join(destination.replace(siteThemeDir, mainThemeDir), item);
                }
            }

            if (stats.isDirectory()) {
                // Recursively copy directory
                copyDirectory(sourcePath, destPath);
            } else {
                // skip non-json if running the json command
                if (json === 'json' && item.indexOf('.json') === -1) continue;
                // Copy file and overwrite if exists
                // critical css re-written to snippets, and rendered inline in theme.liquid for performance
                if (sourcePath.includes('critical-css')) {
                    const content = fs.readFileSync(sourcePath).toString();
                    if (content) {
                        const minified = postcss([postcssMinify()]).process(content);
                        const overridePath = destPath.replace('/assets/', '/snippets/').replace('.css', '.liquid');
        
                        const dir = path.dirname(overridePath);
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
        
                        // if (source != mainThemeDir) log(`Copied: ${sourcePath} -> ${destPath}`);
                        fs.writeFileSync(overridePath, `<style data-shopify>${minified}</style>`);
                    }
                } else {
                    // if (source != mainThemeDir) log(`Copied: ${sourcePath} -> ${destPath}`);
                    fs.copyFileSync(sourcePath, destPath);
                }
            }
        }
    } catch (err) {
        error(`Error copying ${source} to ${destination}: ${err.message}`);
        error(err.stack);
    }
}

// Main function to execute the copy operation
function main() {
    try {
        // Verify Source directory exists
        if (!fs.existsSync(sourceDir)) {
            error(`Source directory does not exist: ${sourceDir}`);
            return;
        }

        if (direction === 'push') {
            fs.removeSync(targetDir);
            fs.ensureDirSync(targetDir);
            aside(`Copying base files from ${mainThemeDir} to ${targetDir}...`);
            copyDirectory(mainThemeDir, targetDir);
        }
        // Start copying
        aside(`Copying site-specific files ${sourceDir} to ${targetDir}...`);
        copyDirectory(sourceDir, targetDir);
        success('Copy operation completed successfully');
    } catch (err) {
        error(`Fatal error: ${err.message}`);
    }
}

// Execute main function
main();