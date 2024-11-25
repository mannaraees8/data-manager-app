import { google } from "googleapis";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CREDENTIALS = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const jwtClient = new google.auth.JWT(
  CREDENTIALS.client_email,

  null,
  CREDENTIALS.private_key.replace(/\\n/g, "\n"),
  SCOPES
);

const drive = google.drive({ version: "v3", auth: jwtClient });

async function authenticateWithGoogle() {
  await jwtClient.authorize();
  console.log("Google Drive API authenticated successfully");
}

const getFileId = async () => {
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
      return file.data.id;
    }
    console.log("File Found:", files[0]);
    return files[0].id;
  } catch (error) {
    console.error("Error fetching or creating file:", error);
    throw error;
  }
};

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
