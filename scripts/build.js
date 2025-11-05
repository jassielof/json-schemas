import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const schemas = ["hayagriva", "typst"];
const docsDir = path.join(__dirname, "..", "docs");

schemas.forEach((schema) => {
  const yamlPath = path.join(docsDir, `${schema}.yaml`);
  const jsonPath = path.join(docsDir, `${schema}.schema.json`);

  try {
    const yamlContent = fs.readFileSync(yamlPath, "utf-8");
    const jsonContent = yaml.load(yamlContent);

    fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2) + "\n");
    console.log("Converted", yamlPath, "to", jsonPath);
  } catch (err) {
    console.error("Error processing", schema, ":", err);
    process.exit(1);
  }
});
