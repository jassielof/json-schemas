const schemaBasePath = "docs/";

const schemas = [
  {
    name: "Hayagriva Bibliography Management",
    file: "hayagriva.schema.json",
    description: "For validating Hayagriva YAML bibliography files.",
    fileMatch: ["*.bib.yaml", "references.yaml", "*hayagriva.yaml"],
    version: "1.0.0",
  },
  {
    name: "Typst Manifesto",
    file: "typst-manifesto.schema.json",
    description: "For validating Typst manifesto files.",
    fileMatch: ["typst.toml"],
    version: "0.1.0",
  },
];

function getSchemaPath(schema) {
  return schemaBasePath + schema;
}
