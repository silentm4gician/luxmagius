// app/api/drive/files/route.ts
import { NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_FOLDER_ID = process.env.GOOGLE_FOLDER_ID;

export async function GET() {
  if (!GOOGLE_API_KEY || !GOOGLE_FOLDER_ID) {
    return NextResponse.json({ error: "Missing config" }, { status: 500 });
  }

  const q = encodeURIComponent(
    `'${GOOGLE_FOLDER_ID}' in parents and trashed = false`
  );
  const fields = encodeURIComponent(
    "files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink)"
  );

  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&key=${GOOGLE_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.files) {
      return NextResponse.json({ error: "No files found" }, { status: 404 });
    }

    return NextResponse.json(data.files);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch Google Drive files" },
      { status: 500 }
    );
  }
}
