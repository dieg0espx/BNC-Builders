import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const html = readFileSync(
    join(process.cwd(), "public", "blog", "index.html"),
    "utf-8"
  );

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}

export async function POST(request: Request) {
  // Proxy pagination requests to the original server
  const formData = await request.formData();
  const isAjax = request.headers.get("X-Requested-With") === "XMLHttpRequest";

  // Build headers to forward
  const headers: HeadersInit = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  if (isAjax) {
    headers["X-Requested-With"] = "XMLHttpRequest";
  }

  // Forward the request to the original server
  const response = await fetch("https://www.bncbuildersinc.com/blog/", {
    method: "POST",
    body: formData,
    headers,
  });

  let html = await response.text();

  // Fix resource paths in the response
  html = html.replace(/href="\/cms\//g, 'href="https://www.bncbuildersinc.com/cms/');
  html = html.replace(/src="\/cms\//g, 'src="https://www.bncbuildersinc.com/cms/');
  html = html.replace(/href="\/common\//g, 'href="https://www.bncbuildersinc.com/common/');
  html = html.replace(/src="\/common\//g, 'src="https://www.bncbuildersinc.com/common/');
  html = html.replace(/href="\/assets\//g, 'href="https://www.bncbuildersinc.com/assets/');
  html = html.replace(/src="\/assets\//g, 'src="https://www.bncbuildersinc.com/assets/');
  html = html.replace(/href="\/images\//g, 'href="https://www.bncbuildersinc.com/images/');
  html = html.replace(/src="\/images\//g, 'src="https://www.bncbuildersinc.com/images/');
  html = html.replace(/data-href="/g, 'href="');

  // Remove ScorpionFooterS3 section
  html = html.replace(/<section class="scp-ftr[^"]*" id="ScorpionFooterS3"[^>]*>[\s\S]*?<\/section>(<\/footer>)/g, '$1');

  return new NextResponse(html, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "text/html",
    },
  });
}
