import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import { log, error, warn } from './utils.js';
import { themeMap, deployMap } from './utils.js';

/*
    This copies all files from specified sites/* directories. The shared theme and/or a site theme.
    
    It also watch for changes in the directories and copies the changes into the deploy directory.
    
    If a file exists in the Site theme and Shared Theme, the Shared theme file will be ignorned
    when running the stg-theme:watch command.
*/

// Get environment parameter from command line
const site = process.argv[2];

// Configuration with absolute paths relative to project root (parent of scripts)
const projectRoot = '.';
const mainThemeDir = path.resolve(projectRoot, 'sites/_shared');
const siteThemeDir = themeMap[site];
const deployDir = deployMap[site];

// Verify directories exist
if (siteThemeDir) {
    log(`siteThemeDir exists: `, fs.existsSync(siteThemeDir));
    log(`siteThemeDir Environment: `, site);
}

// Ensure deploy directory exists
if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
    log(`Created deploy directory: `, deployDir);
}

// Function to copy file to deploy directory
function copyToDeploy(filePath, sourceDir) {
    const relativePath = path.relative(sourceDir, filePath);
    const destPath = path.join(deployDir, relativePath);
    
    // Check if the file exists in siteThemeDir when updating from mainThemeDir
    if (sourceDir === mainThemeDir && siteThemeDir) {
        const siteThemeDirEquivalent = path.join(siteThemeDir, relativePath);
        if (fs.existsSync(siteThemeDirEquivalent)) {
            warn(`Warning: Skipping update of ${relativePath} because it exists in siteThemeDir: ${siteThemeDirEquivalent}`);
            return;
        }
    }
    
    if (!destPath.startsWith(deployDir)) {
        const correctedDestPath = path.join(deployDir, relativePath);
        const destDir = path.dirname(correctedDestPath);

        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        fs.copyFileSync(filePath, correctedDestPath);

        return;
    }
    
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(filePath, destPath);
}

// Function to remove file from deploy directory
function removeFromDeploy(filePath, sourceDir) {
    const relativePath = path.relative(sourceDir, filePath);
    const destPath = path.join(deployDir, relativePath);
    
    if (!destPath.startsWith(deployDir)) {
        error(`Error: destPath`, `${destPath} does not start with deployDir ${deployDir}`);
        return;
    }
    
    if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
        log(`Removed: `, `${destPath}`);
    }
}

// Initialize watcher for mainThemeDir
const watcher1 = chokidar.watch(mainThemeDir, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
    }
});

// Track if initial scan is complete
let mainThemeDirInitialScanComplete = false;

// Handle mainThemeDir events
watcher1
    .on('ready', () => {
        log(`Watcher ready for ${mainThemeDir}`);
        mainThemeDirInitialScanComplete = true;
    })
    .on('add', (filePath) => {
        if (!siteThemeDir) {
            copyToDeploy(filePath, mainThemeDir);
        } else if (mainThemeDirInitialScanComplete) {
            copyToDeploy(filePath, mainThemeDir); // Will check siteThemeDir priority
        } else {
            const siteThemeDirEquivalent = path.join(siteThemeDir, path.relative(mainThemeDir, filePath));
            if (!fs.existsSync(siteThemeDirEquivalent)) {
                copyToDeploy(filePath, mainThemeDir);
            } else {
                const relativePath = path.relative(mainThemeDir, filePath);
                warn(`Skipped initial ${relativePath} - exists in siteThemeDir: ${siteThemeDirEquivalent}`);
            }
        }
    })
    .on('change', (filePath) => {
        log(`Change event detected in mainThemeDir: `, `${filePath}`);
        copyToDeploy(filePath, mainThemeDir); // Will check siteThemeDir priority
    })
    .on('unlink', (filePath) => {
        if (!siteThemeDir) {
            removeFromDeploy(filePath, mainThemeDir);
        } else {
            const siteThemeDirEquivalent = path.join(siteThemeDir, path.relative(mainThemeDir, filePath));
            if (!fs.existsSync(siteThemeDirEquivalent)) {
                removeFromDeploy(filePath, mainThemeDir);
            }
        }
    })
    .on('error', (error) => error(`Watcher1 error: ${error}`));

// Initialize and handle siteThemeDir events only if siteThemeDir is specified
let watcher2;
if (siteThemeDir) {
    log(`Initializing watcher for siteThemeDir: ${siteThemeDir}`);
    watcher2 = chokidar.watch(siteThemeDir, {
        persistent: true,
        ignoreInitial: false,
        awaitWriteFinish: {
            stabilityThreshold: 200,
            pollInterval: 100
        }
    });

    let siteThemeDirInitialScanComplete = false;

    watcher2
        .on('ready', () => {
            siteThemeDirInitialScanComplete = true;
        })
        .on('add', (filePath) => {
            copyToDeploy(filePath, siteThemeDir);
        })
        .on('change', (filePath) => {
            console.log(`Change event detected in siteThemeDir: ${filePath}`);
            copyToDeploy(filePath, siteThemeDir);
        })
        .on('unlink', (filePath) => {
            removeFromDeploy(filePath, siteThemeDir);

            const mainThemeDirEquivalent = path.join(mainThemeDir, path.relative(siteThemeDir, filePath));

            if (fs.existsSync(mainThemeDirEquivalent)) {
                copyToDeploy(mainThemeDirEquivalent, mainThemeDir);
            }
        })
        .on('error', (error) => error(`Watcher2 error: ${error}`));
} else {
    log('Watching local Environment: ', 'Production');
    log('No siteThemeDir specified - only watching mainThemeDir');
}

log(`Watching ${mainThemeDir}${siteThemeDir ? ` and ${siteThemeDir}` : ''} for changes (env: ${site || 'none'})...`);