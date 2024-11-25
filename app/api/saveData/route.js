import fs from "fs";
import path from "path";

// Utility to get the file path
const getFilePath = () => path.join(process.cwd(), "public", "app.json");

export async function GET() {
  try {
    const filePath = getFilePath();
    const data = fs.readFileSync(filePath, "utf-8");
    return new Response(data, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to read data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request) {
  try {
    const updatedData = await request.json();
    const filePath = getFilePath();

    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), "utf-8");

    return new Response(
      JSON.stringify({ message: "Data successfully saved!" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to save data", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
