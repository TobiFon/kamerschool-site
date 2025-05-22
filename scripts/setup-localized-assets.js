// scripts/setup-localized-assets.js
const fs = require("fs");
const path = require("path");

const LOCALES = ["en", "fr"];
const DEFAULT_LOCALE = "en";
const PUBLIC_DIR = path.join(process.cwd(), "public");

// Asset directories to localize
const ASSET_DIRS = [
  "mockups",
  "images",
  // Add more asset directories here
];

/**
 * Sets up the folder structure for localized assets
 */
function setupFolderStructure() {
  console.log("Setting up localized asset folders...");

  // Create locale directories if they don't exist
  LOCALES.forEach((locale) => {
    const localeDir = path.join(PUBLIC_DIR, locale);
    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
      console.log(`Created directory: ${localeDir}`);
    }

    // Create asset directories within each locale
    ASSET_DIRS.forEach((assetDir) => {
      const localizedAssetDir = path.join(localeDir, assetDir);
      if (!fs.existsSync(localizedAssetDir)) {
        fs.mkdirSync(localizedAssetDir, { recursive: true });
        console.log(`Created directory: ${localizedAssetDir}`);
      }
    });
  });
}

/**
 * Copies assets from the root public directory to localized folders
 */
function copyAssetsToLocaleFolders() {
  console.log("Copying assets to localized folders...");

  ASSET_DIRS.forEach((assetDir) => {
    const sourceDir = path.join(PUBLIC_DIR, assetDir);

    // Skip if source directory doesn't exist
    if (!fs.existsSync(sourceDir)) {
      console.log(`Source directory does not exist: ${sourceDir}`);
      return;
    }

    // Get all files from the source directory
    const files = fs.readdirSync(sourceDir);

    // Copy each file to each locale folder
    files.forEach((file) => {
      const sourceFile = path.join(sourceDir, file);

      // Skip if it's a directory
      if (fs.statSync(sourceFile).isDirectory()) {
        return;
      }

      LOCALES.forEach((locale) => {
        const targetDir = path.join(PUBLIC_DIR, locale, assetDir);
        const targetFile = path.join(targetDir, file);

        // Create the target directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Copy the file
        fs.copyFileSync(sourceFile, targetFile);
        console.log(`Copied ${sourceFile} to ${targetFile}`);
      });
    });
  });
}

/**
 * Run the setup process
 */
function main() {
  setupFolderStructure();
  copyAssetsToLocaleFolders();
  console.log("Localized asset setup complete!");
}

main();
