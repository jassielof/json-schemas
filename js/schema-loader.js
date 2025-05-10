document.addEventListener('DOMContentLoaded', function() {
    const schemasContainer = document.getElementById('schemas-container');
    const schemaDetail = document.getElementById('schema-detail');
    const schemasList = document.getElementById('schemas-list');
    const loader = document.getElementById('loader');
    const backButton = document.getElementById('back-button');

    // Schema file patterns mapping (will be loaded from localStorage or defaults)
    let schemaFilePatterns = {};

    // Load saved file patterns from localStorage
    try {
        const savedPatterns = localStorage.getItem('schemaFilePatterns');
        if (savedPatterns) {
            schemaFilePatterns = JSON.parse(savedPatterns);
        }
    } catch (e) {
        console.error('Error loading saved patterns:', e);
    }

    // Default file patterns for common schemas
    const defaultPatterns = {
        'hayagriva.schema.json': ['*.bib.yaml', 'references.yaml']
        // Add more defaults as needed
    };

    // Function to get schema file patterns
    function getFilePatterns(schemaName) {
        return schemaFilePatterns[schemaName] || defaultPatterns[schemaName] || [];
    }

    // Function to save schema file patterns
    function saveFilePatterns(schemaName, patterns) {
        schemaFilePatterns[schemaName] = patterns;
        localStorage.setItem('schemaFilePatterns', JSON.stringify(schemaFilePatterns));
    }

    // Fetch list of schema files
    async function loadSchemas() {
        try {
            // Since GitHub Pages doesn't support directory listing, we'll simulate it
            // by fetching the repository contents from the GitHub API
            const repoOwner = 'jassielof';
            const repoName = 'json-schemas';
            const path = 'docs';

            const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`);
            const data = await response.json();

            if (Array.isArray(data)) {
                const schemaFiles = data.filter(file => file.name.endsWith('.schema.json'));

                if (schemaFiles.length === 0) {
                    schemasContainer.innerHTML = '<p>No schema files found. Add JSON schemas to the docs/ directory with .schema.json extension.</p>';
                } else {
                    await displaySchemasList(schemaFiles);
                }
            }
        } catch (error) {
            console.error('Error fetching schemas:', error);
            schemasContainer.innerHTML = `<p>Error loading schemas: ${error.message}. Make sure the repository is public and contains schema files.</p>`;
        } finally {
            loader.classList.add('hidden');
        }
    }

    // Display list of schemas
    async function displaySchemasList(schemaFiles) {
        schemasContainer.innerHTML = '';

        for (const file of schemaFiles) {
            try {
                // Fetch and parse each schema file
                const response = await fetch(file.download_url);
                const schemaData = await response.json();

                // Extract metadata
                const title = schemaData.title || file.name.replace('.schema.json', '');
                const description = schemaData.description || 'No description provided';
                const schemaVersion = schemaData.$schema || 'Unknown schema version';

                // Create schema card
                const card = document.createElement('div');
                card.className = 'schema-card';
                card.dataset.schemaName = file.name;
                card.dataset.schemaUrl = file.download_url;

                card.innerHTML = `
                    <h3>${title}</h3>
                    <p>${description}</p>
                    <div class="schema-meta">
                        <div>File: ${file.name}</div>
                        <div>Version: ${extractSchemaVersion(schemaVersion)}</div>
                    </div>
                `;

                // Add click event to show schema details
                card.addEventListener('click', () => {
                    showSchemaDetails(file.name, file.download_url, schemaData);
                });

                schemasContainer.appendChild(card);
            } catch (error) {
                console.error(`Error processing schema ${file.name}:`, error);
                const errorCard = document.createElement('div');
                errorCard.className = 'schema-card error';
                errorCard.innerHTML = `
                    <h3>${file.name}</h3>
                    <p>Error loading this schema: ${error.message}</p>
                `;
                schemasContainer.appendChild(errorCard);
            }
        }
    }

    // Extract schema version from $schema URL
    function extractSchemaVersion(schemaUrl) {
        if (!schemaUrl) return 'Unknown';

        if (schemaUrl.includes('draft-07')) return 'Draft 07';
        if (schemaUrl.includes('draft-06')) return 'Draft 06';
        if (schemaUrl.includes('draft-04')) return 'Draft 04';
        if (schemaUrl.includes('2019-09')) return 'Draft 2019-09';
        if (schemaUrl.includes('2020-12')) return 'Draft 2020-12';

        return schemaUrl;
    }

    // Show schema details
    function showSchemaDetails(schemaName, schemaUrl, schemaData) {
        // Hide schemas list and show details
        schemasList.classList.add('hidden');
        schemaDetail.classList.remove('hidden');

        // Update schema title and info
        document.getElementById('schema-title').textContent = schemaData.title || schemaName;
        document.getElementById('schema-info').innerHTML = `
            <p>${schemaData.description || 'No description provided'}</p>
            <div class="schema-meta">
                <div>File: ${schemaName}</div>
                <div>Version: ${extractSchemaVersion(schemaData.$schema)}</div>
            </div>
        `;

        // Display file patterns
        const filePatterns = getFilePatterns(schemaName);
        const filePatternsContainer = document.getElementById('file-patterns');
        filePatternsContainer.innerHTML = '';

        if (filePatterns.length > 0) {
            filePatterns.forEach(pattern => {
                const patternEl = document.createElement('span');
                patternEl.className = 'file-pattern';
                patternEl.textContent = pattern;
                filePatternsContainer.appendChild(patternEl);
            });
        } else {
            filePatternsContainer.innerHTML = `
                <p>No file patterns configured yet. Default recommendations:</p>
                <span class="file-pattern">${schemaName.replace('.schema.json', '.*')}</span>
            `;
        }

        // Edit patterns button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-small';
        editBtn.textContent = 'Edit Patterns';
        editBtn.addEventListener('click', () => {
            const patternsStr = prompt('Enter file patterns (comma-separated):', filePatterns.join(', '));
            if (patternsStr !== null) {
                const newPatterns = patternsStr.split(',').map(p => p.trim()).filter(p => p);
                saveFilePatterns(schemaName, newPatterns);
                showSchemaDetails(schemaName, schemaUrl, schemaData); // Refresh view
            }
        });
        filePatternsContainer.appendChild(document.createElement('br'));
        filePatternsContainer.appendChild(editBtn);

        // Usage examples
        const baseUrl = window.location.href.replace('index.html', '');
        const schemaPath = `docs/${schemaName}`;
        const fullSchemaUrl = `${baseUrl}${schemaPath}`;

        document.getElementById('vscode-usage').textContent = JSON.stringify({
            "yaml.schemas": {
                [fullSchemaUrl]: filePatterns.length > 0 ? filePatterns : [`*${schemaName.replace('.schema.json', '')}`]
            }
        }, null, 2);

        document.getElementById('direct-usage').textContent = `# yaml-language-server: $schema=${fullSchemaUrl}`;

        // Schema content
        document.getElementById('schema-content').textContent = JSON.stringify(schemaData, null, 2);
    }

    // Back button handler
    backButton.addEventListener('click', () => {
        schemaDetail.classList.add('hidden');
        schemasList.classList.remove('hidden');
    });

    // Initial load
    loadSchemas();
});