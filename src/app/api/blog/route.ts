import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

interface BlogPost {
  title: string;
  date: string;
  url: string;
  image: string;
  timestamp: number;
}

function extractBlogPosts(dir: string, posts: BlogPost[] = []): BlogPost[] {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Check if this directory has an index.html (it's a blog post)
      const indexPath = join(fullPath, "index.html");
      try {
        const indexStat = statSync(indexPath);
        if (indexStat.isFile()) {
          // Check if it's an actual blog post (has year/month/slug structure)
          const relativePath = fullPath.replace(/.*\/blog\//, "/blog/");
          const parts = relativePath.split("/").filter(Boolean);

          // Blog posts have structure: /blog/YEAR/MONTH/SLUG/
          if (parts.length >= 4 && /^\d{4}$/.test(parts[1])) {
            const html = readFileSync(indexPath, "utf-8");

            // Extract title
            const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
            const title = titleMatch
              ? titleMatch[1].replace(" | BNC Builders Inc.", "").trim()
              : item;

            // Extract date from path or content
            const year = parts[1];
            const month = parts[2];
            const monthNames: Record<string, string> = {
              january: "Jan",
              february: "Feb",
              march: "Mar",
              april: "Apr",
              may: "May",
              june: "Jun",
              july: "Jul",
              august: "Aug",
              september: "Sep",
              october: "Oct",
              november: "Nov",
              december: "Dec",
            };
            const monthAbbr = monthNames[month.toLowerCase()] || month;
            const date = `${monthAbbr} 2025`.includes(year)
              ? `${monthAbbr} 1, ${year}`
              : `${monthAbbr} 1, ${year}`;

            // Extract image
            const imgMatch = html.match(
              /data-src="([^"]*\/images\/blog\/[^"]*)"/i
            );
            const image = imgMatch
              ? imgMatch[1]
              : "https://www.bncbuildersinc.com/images/blog/default.jpg";

            // Create timestamp for sorting
            const monthNum =
              Object.keys(monthNames).indexOf(month.toLowerCase()) + 1;
            const timestamp = new Date(
              parseInt(year),
              monthNum - 1,
              1
            ).getTime();

            posts.push({
              title,
              date: `${monthAbbr} ${year}`,
              url: relativePath + "/",
              image,
              timestamp,
            });
          }
        }
      } catch {
        // Not a blog post directory, continue recursing
      }

      // Continue searching in subdirectories
      extractBlogPosts(fullPath, posts);
    }
  }

  return posts;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "9");

  const blogDir = join(process.cwd(), "public", "blog");
  const allPosts = extractBlogPosts(blogDir);

  // Sort by timestamp descending (newest first)
  allPosts.sort((a, b) => b.timestamp - a.timestamp);

  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const posts = allPosts.slice(start, end);

  return NextResponse.json({
    posts,
    page,
    perPage,
    totalPosts,
    totalPages,
  });
}
