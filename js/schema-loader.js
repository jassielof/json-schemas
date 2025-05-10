document.addEventListener("DOMContentLoaded", function () {
  const schemasContainer = document.getElementById("schemas-container");
  const loader = document.getElementById("loader");

  // Extract schema version from $schema URL
  function extractSchemaVersion(schemaUrl) {
    if (!schemaUrl) return "Unknown";

    if (schemaUrl.includes("draft-07")) return "Draft 07";
    if (schemaUrl.includes("draft-06")) return "Draft 06";
    if (schemaUrl.includes("draft-04")) return "Draft 04";
    if (schemaUrl.includes("2019-09")) return "Draft 2019-09";
    if (schemaUrl.includes("2020-12")) return "Draft 2020-12";

    return "Custom";
  }

  // Fetch list of schema files
  async function loadSchemas() {
    try {
      const repoOwner = "jassielof";
      const repoName = "json-schemas";
      const path = "docs";

      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        const schemaFiles = data.filter((file) =>
          file.name.endsWith(".schema.json")
        );

        if (schemaFiles.length === 0) {
          schemasContainer.innerHTML =
            '<tr><td colspan="4">No schema files found. Add JSON schemas to the docs/ directory with .schema.json extension.</td></tr>';
        } else {
          await displaySchemasList(schemaFiles);
        }
      }
    } catch (error) {
      console.error("Error fetching schemas:", error);
      schemasContainer.innerHTML = `<tr><td colspan="4">Error loading schemas: ${error.message}. Make sure the repository is public and contains schema files.</td></tr>`;
    } finally {
      loader.style.display = "none";
    }
  }

  // Display list of schemas
  async function displaySchemasList(schemaFiles) {
    for (const file of schemaFiles) {
      try {
        // Fetch and parse each schema file
        const response = await fetch(file.download_url);
        const schemaData = await response.json();

        // Extract metadata
        const title = schemaData.title || file.name.replace(".schema.json", "");
        const description = schemaData.description || "No description provided";
        const schemaVersion = extractSchemaVersion(schemaData.$schema);

        // Create table row
        const row = document.createElement("tr");

        row.innerHTML = `
                    <td><strong>${title}</strong><br><small>${file.name}</small></td>
                    <td>${description}</td>
                    <td>${schemaVersion}</td>
                    <td>
                        <a href="${file.download_url}" target="_blank">Download</a>
                        <br>
                        <small>Add to your file:<br># $schema: ${file.download_url}</small>
                    </td>
                `;

        schemasContainer.appendChild(row);
      } catch (error) {
        console.error(`Error processing schema ${file.name}:`, error);
        const errorRow = document.createElement("tr");
        errorRow.innerHTML = `
                    <td>${file.name}</td>
                    <td colspan="3">Error loading schema: ${error.message}</td>
                `;
        schemasContainer.appendChild(errorRow);
      }
    }
  }

  // Load schemas when page loads
  loadSchemas();
});
