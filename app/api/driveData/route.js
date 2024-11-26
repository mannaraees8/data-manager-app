import { google } from "googleapis";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import path from "path";

// Load API credentials from environment variables
const CREDENTIALS = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

const SCOPES = ["https://www.googleapis.com/auth/drive"];

// Path to the cache file
const CACHE_FILE_PATH = path.resolve("./cache.json");

// Initialize Google JWT client
const jwtClient = new google.auth.JWT(
  CREDENTIALS.client_email,
  null,
  CREDENTIALS.private_key,
  SCOPES
);

// Initialize Google Drive API
const drive = google.drive({ version: "v3", auth: jwtClient });

// Helper function to read the cache file
async function readCache() {
  try {
    const data = await fs.readFile(CACHE_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading cache file:", error);
    return {};
  }
}

// Helper function to write to the cache file
async function writeCache(cache) {
  try {
    await fs.writeFile(
      CACHE_FILE_PATH,
      JSON.stringify(cache, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Error writing to cache file:", error);
  }
}

// Authenticate with Google API and update the token in the cache
async function authenticateWithGoogle() {
  const cache = await readCache();

  if (cache.token && cache.token.expiry_date > Date.now()) {
    console.log("Using cached token.");
    jwtClient.setCredentials(cache.token); // Set cached token
    return;
  }

  try {
    await jwtClient.authorize();
    const token = jwtClient.credentials;
    console.log("Google Drive API authenticated successfully. Caching token.");
    await writeCache({ ...cache, token });
  } catch (error) {
    console.error("Error authenticating with Google API:", error);
    throw error;
  }
}

// Fetch or create `app.json` file and cache its ID
async function getFileId() {
  const cache = await readCache();

  if (cache.fileId) {
    console.log("Using cached file ID.");
    return cache.fileId;
  }

  try {
    const res = await drive.files.list({
      q: "name = 'app.json'",
      fields: "files(id, name)",
    });

    const files = res.data.files;
    if (files.length === 0) {
      console.log("No app.json file found. Creating one...");
      const fileMetadata = {
        name: "app.json",
        mimeType: "application/json",
        parents: ["1T1Bp2Db9jiVmj19ngOfIWrm-DnuUxWyB"], // Replace with actual folder ID
      };

      const media = {
        mimeType: "application/json",
        body: JSON.stringify({}), // Create an empty file
      };

      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id, parents",
      });
      console.log("File Created:", file.data);
      cache.fileId = file.data.id; // Cache the file ID
      await writeCache(cache);
      return file.data.id;
    }

    console.log("File Found:", files[0]);
    cache.fileId = files[0].id; // Cache the file ID
    await writeCache(cache);
    return files[0].id;
  } catch (error) {
    console.error("Error fetching or creating file:", error);
    throw error;
  }
}

// GET handler
export async function GET(request) {
  try {
    console.log("GET Request Received");
    await authenticateWithGoogle();

    const fileId = await getFileId();
    const res = await drive.files.get({
      fileId,
      alt: "media",
    });
    let data;
    try {
      data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    } catch (error) {
      console.error("Error parsing data:", error);
      data = {};
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching data from Google Drive:", error);
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}

// POST handler
export async function POST(request) {
  try {
    console.log("POST Request Received");
    const updatedData = await request.json();

    await authenticateWithGoogle();
    const fileId = await getFileId();

    const fileMetadata = {
      name: "app.json",
      mimeType: "application/json",
    };

    const media = {
      mimeType: "application/json",
      body: JSON.stringify(updatedData, null, 2),
    };

    await drive.files.update({
      fileId,
      resource: fileMetadata,
      media: media,
    });

    console.log("Data Saved:", updatedData);
    return NextResponse.json({
      message: "Data successfully saved to Google Drive",
    });
  } catch (error) {
    console.error("Error saving data to Google Drive:", error);
    return NextResponse.json(
      { error: "Failed to save data", details: error.message },
      { status: 500 }
    );
  }
}
