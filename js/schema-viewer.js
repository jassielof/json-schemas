document.addEventListener("DOMContentLoaded", function () {
  const schemasContainer = document.getElementById("schemas-container");
  const loadingElement = document.getElementById("loading");
  const baseUrl = window.location.href.replace(/\/index\.html$/, "");

  // File pattern storage in localStorage
  const storageKey = "schema-file-patterns";
  let filePatterns = JSON.parse(localStorage.getItem(storageKey) || "{}");

  // Fetch the list of schema files
  async function fetchSchemaList() {
    try {
      // Use GitHub API to get files list (requires CORS proxy in production)
      // For GitHub Pages, we need to list files differently

      // NOTE: In a real implementation, you'd need to either:
      // 1. Use GitHub API with authentication
      // 2. Generate a file list during build time
      // 3. Use a serverless function

      // For now, let's simulate finding files with .schema.json extension
      // In production, replace this with a proper file listing method
      const response = await fetch(
        `https://api.github.com/repos/jassielof/json-schemas/contents/docs`
      );
      const files = await response.json();

      return files
        .filter((file) => file.name.endsWith(".schema.json"))
        .map((file) => file.name);
    } catch (error) {
      console.error("Error fetching schema list:", error);
      return [];
    }
  }

  // Fetch and parse an individual schema
  async function fetchSchema(filename) {
    try {
      const response = await fetch(`docs/${filename}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching schema ${filename}:`, error);
      return null;
    }
  }

  // Render a schema card
  function renderSchemaCard(filename, schema) {
    if (!schema) return "";

    const schemaId = filename.replace(".schema.json", "");
    const schemaUrl = `${baseUrl}/docs/${filename}`;

    // Get saved file patterns or initialize empty array
    if (!filePatterns[schemaId]) {
      filePatterns[schemaId] = [];
    }

    const card = document.createElement("section");
    card.className = "schema-card";

    // Extract schema version from $schema property
    const schemaVersion = (schema.$schema || "").replace(
      "http://json-schema.org/",
      ""
    );

    card.innerHTML = `
      <h2>${schema.title || filename}</h2>
      <p>${schema.description || "No description available."}</p>
      <p><strong>Schema Version:</strong> ${schemaVersion || "Unknown"}</p>

      <div>
        <h3>File Patterns:</h3>
        <div id="patterns-${schemaId}" class="patterns-container">
          ${renderFilePatterns(schemaId)}
        </div>
        <div class="pattern-input" style="margin-top: 1rem;">
          <input type="text" id="new-pattern-${schemaId}" placeholder="Add file pattern (e.g. *.yaml)">
          <button onclick="addFilePattern('${schemaId}')">Add</button>
        </div>
      </div>

      <h3>Schema URL:</h3>
      <div class="schema-url">
        ${schemaUrl}
      </div>

      <h3>VS Code Configuration:</h3>
      <pre><code>{
  "yaml.schemas": {
    "${schemaUrl}": [
      ${filePatterns[schemaId]
        .map((pattern) => `"${pattern}"`)
        .join(",\n      ")}
    ]
  }
}</code>
<button class="copy-button" onclick="copyToClipboard('${schemaId}-vscode')">Copy</button>
</pre>
    `;

    return card;
  }

  // Render file patterns for a schema
  function renderFilePatterns(schemaId) {
    if (!filePatterns[schemaId] || filePatterns[schemaId].length === 0) {
      return "<em>No file patterns specified yet</em>";
    }

    return filePatterns[schemaId]
      .map(
        (pattern) =>
          `<span class="file-pattern">${pattern} <button onclick="removeFilePattern('${schemaId}', '${pattern}')">×</button></span>`
      )
      .join("");
  }

  // Initialize
  async function init() {
    try {
      const schemaFiles = await fetchSchemaList();

      if (schemaFiles.length === 0) {
        loadingElement.textContent =
          "No schema files found in the /docs directory.";
        return;
      }

      loadingElement.style.display = "none";

      for (const filename of schemaFiles) {
        const schema = await fetchSchema(filename);
        if (schema) {
          const card = renderSchemaCard(filename, schema);
          schemasContainer.appendChild(card);
        }
      }

      // Add global functions for the buttons
      window.addFilePattern = function (schemaId) {
        const input = document.getElementById(`new-pattern-${schemaId}`);
        const pattern = input.value.trim();

        if (pattern && !filePatterns[schemaId].includes(pattern)) {
          filePatterns[schemaId].push(pattern);
          localStorage.setItem(storageKey, JSON.stringify(filePatterns));

          const patternsContainer = document.getElementById(
            `patterns-${schemaId}`
          );
          patternsContainer.innerHTML = renderFilePatterns(schemaId);
          input.value = "";
        }
      };

      window.removeFilePattern = function (schemaId, pattern) {
        filePatterns[schemaId] = filePatterns[schemaId].filter(
          (p) => p !== pattern
        );
        localStorage.setItem(storageKey, JSON.stringify(filePatterns));

        const patternsContainer = document.getElementById(
          `patterns-${schemaId}`
        );
        patternsContainer.innerHTML = renderFilePatterns(schemaId);
      };

      window.copyToClipboard = function (elementId) {
        const text = document.querySelector(`#${elementId}`).textContent;
        navigator.clipboard.writeText(text).then(() => {
          alert("Copied to clipboard!");
        });
      };
    } catch (error) {
      console.error("Error initializing schema viewer:", error);
      loadingElement.textContent =
        "Error loading schemas. See console for details.";
    }
  }

  init();
});
