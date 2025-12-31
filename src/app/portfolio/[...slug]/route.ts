import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const filePath = join(process.cwd(), "public", "portfolio", slugPath, "index.html");

  if (!existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const html = readFileSync(filePath, "utf-8");

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
