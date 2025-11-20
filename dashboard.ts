import { serveDir } from "jsr:@std/http/file-server";

const PORT = 8000;

// Create mapping between models and their project folders
const projectMapping: Record<string, string[]> = {};
let mappingInitialized = false;

async function initializeMapping() {
  if (mappingInitialized) return;
  
  const allProjects: string[] = [];
  for await (const entry of Deno.readDir(".")) {
    if (entry.isDirectory) {
      allProjects.push(entry.name);
    }
  }

  function extractModel(folderName: string): string | null {
    if (folderName.includes("gemini3pro")) return "gemini3pro";
    if (folderName.includes("claude4.5thinking")) return "claude4.5thinking";
    if (folderName.includes("glm4.6")) return "glm4.6";
    if (folderName.includes("gptoss120B")) return "gptoss120B";
    if (folderName.includes("gpt5.1medium")) return "gpt5.1medium";
    return null;
  }

  function formatModelName(model: string): string {
    if (model === "gemini3pro") return "Gemini3pro";
    if (model === "claude4.5thinking") return "Claude4.5thinking";
    if (model === "glm4.6") return "GLM4.6";
    if (model === "gptoss120B") return "GPTOSS120B";
    if (model === "gpt5.1medium") return "GPT5.1medium";
    return model;
  }

  for (const project of allProjects) {
    const model = extractModel(project);
    if (model) {
      if (!projectMapping[model]) {
        projectMapping[model] = [];
      }
      projectMapping[model].push(project);
    }
  }
  
  mappingInitialized = true;
}

async function handler(req: Request): Promise<Response> {
  await initializeMapping();
  const url = new URL(req.url);
  
  if (url.pathname === "/") {
    const sortedModels = Object.keys(projectMapping).sort();

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
      transition: background-color 0.2s;
    }
    .project-link:hover {
      background-color: #0051a2;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Global Sales Project Dashboard</h1>
    ${sortedModels.map((model, modelIdx) => `
      <div class="category">
        <h2 class="category-title">${formatModelName(model)}</h2>
        <div class="grid">
          ${projectMapping[model].map((project, projIdx) => `
            <div class="card">
              <a href="/${formatModelName(model)}/" class="project-link">Open</a>
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

  // Handle project routes with model names
  function formatModelName(model: string): string {
    if (model === "gemini3pro") return "Gemini3pro";
    if (model === "claude4.5thinking") return "Claude4.5thinking";
    if (model === "glm4.6") return "GLM4.6";
    if (model === "gptoss120B") return "GPTOSS120B";
    if (model === "gpt5.1medium") return "GPT5.1medium";
    return model;
  }

  // Match formatted model names in URL
  const pathParts = url.pathname.split('/').filter(p => p);
  if (pathParts.length > 0) {
    const urlModel = pathParts[0];
    const subPath = '/' + pathParts.slice(1).join('/');
    
    // Find matching model
    for (const [model, projects] of Object.entries(projectMapping)) {
      if (formatModelName(model) === urlModel && projects.length > 0) {
        const actualProject = projects[0]; // Use first project of this model
        const newUrl = new URL(req.url);
        newUrl.pathname = `/${actualProject}${subPath || '/'}`;
        
        return serveDir(new Request(newUrl, req), {
          fsRoot: ".",
          showDirListing: false,
        });
      }
    }
  }

  // Serve static files for any other path
  return serveDir(req, {
    fsRoot: ".",
    showDirListing: false,
  });
}

console.log(`Dashboard running on http://localhost:${PORT}`);
Deno.serve({ port: PORT }, handler);
