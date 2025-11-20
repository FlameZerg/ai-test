import { serveDir } from "jsr:@std/http/file-server";

const PORT = 8000;

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  if (url.pathname === "/") {
    const allProjects: string[] = [];
    for await (const entry of Deno.readDir(".")) {
      if (entry.isDirectory) {
        allProjects.push(entry.name);
      }
    }

    // Extract model name from folder name
    function extractModel(folderName: string): string | null {
      if (folderName.includes("gemini3pro")) return "gemini3pro";
      if (folderName.includes("claude4.5thinking")) return "claude4.5thinking";
      if (folderName.includes("glm4.6")) return "glm4.6";
      if (folderName.includes("gptoss120B")) return "gptoss120B";
      if (folderName.includes("gpt5.1medium")) return "gpt5.1medium";
      return null;
    }

    // Group projects by model
    const projectsByModel: Record<string, string[]> = {};
    for (const project of allProjects) {
      const model = extractModel(project);
      if (model) {
        if (!projectsByModel[model]) {
          projectsByModel[model] = [];
        }
        projectsByModel[model].push(project);
      }
    }

    // Sort models
    const sortedModels = Object.keys(projectsByModel).sort();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Global Sales Project Dashboard</title>
  <style>
    :root {
      --bg-color: #f0f2f5;
      --card-bg: #ffffff;
      --text-color: #1a1a1a;
      --accent-color: #0070f3;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      margin-bottom: 40px;
      font-weight: 800;
      color: #333;
    }
    .category {
      margin-bottom: 50px;
    }
    .category-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      color: #333;
      border-bottom: 2px solid var(--accent-color);
      padding-bottom: 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .card {
      background: var(--card-bg);
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      padding: 20px;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80px;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px rgba(0,0,0,0.1);
    }
    .project-name {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 10px;
      word-break: break-word;
      color: #555;
    }
    .project-link {
      display: block;
      text-decoration: none;
      color: white;
      background-color: var(--accent-color);
      padding: 12px 24px;
      border-radius: 6px;
      text-align: center;
      font-weight: 500;
      font-size: 1rem;
      width: 100%;
    }
    .project-link:hover {
      background-color: #0051a2;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Global Sales Project Dashboard</h1>
    ${sortedModels.map(model => `
      <div class="category">
        <h2 class="category-title">${model}</h2>
        <div class="grid">
          ${projectsByModel[model].map(project => `
            <div class="card">
              <a href="/${project}/" class="project-link">Open</a>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("")}
  </div>
</body>
</html>
    `;
    
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // Serve static files for any other path
  return serveDir(req, {
    fsRoot: ".",
    showDirListing: true,
  });
}

console.log(`Dashboard running on http://localhost:${PORT}`);
Deno.serve({ port: PORT }, handler);
