// Sample database for demo purposes (normally this would come from your server/database)
let warehouseDatabase = {};

// Theme management
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Load database from localStorage
function loadDatabase() {
    const savedDB = localStorage.getItem('warehouseDatabase');
    if (savedDB) {
        warehouseDatabase = JSON.parse(savedDB);
        updateDbCount();
    } else {
        // Load default database from CSV
        loadDefaultDatabase();
    }
}

// Load default database from CSV file
function loadDefaultDatabase() {
    console.log("Loading default database from CSV...");
    
    // Try to fetch the database.csv file from the same directory
    fetch('database.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Database file not found. Using demo data instead.');
            }
            return response.text();
        })
        .then(csvData => {
            // Parse CSV using PapaParse
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    let importCount = 0;
                    
                    results.data.forEach(row => {
                        // Handle both "SKU" and "sku" column names
                        const sku = row.SKU || row.sku;
                        // Handle both "Location" and "location" column names
                        const location = row.Location || row.location;
                        
                        if (sku && location) {
                            warehouseDatabase[sku] = location;
                            importCount++;
                        }
                    });
                    
                    if (importCount > 0) {
                        saveDatabase();
                        console.log(`Successfully loaded ${importCount} SKU-Location pairs from default database.`);
                    } else {
                        // If CSV was empty or had no valid data, load demo data
                        loadDemoData();
                    }
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    loadDemoData();
                }
            });
        })
        .catch(error => {
            console.error(error);
            loadDemoData();
        });
}

// Load demo data as fallback
function loadDemoData() {
    console.log("Loading demo data...");
    warehouseDatabase = {
        "SKU12345 100": "A01",
        "SKU23456 200": "A12",
        "SKU34567 300": "B22",
        "SKU45678 400": "C30",
        "SKU56789 500": "B05",
        "SKU67890 600": "A39",
        "SKU78901 700": "C15",
        "ITEM1001 101": "A02",
        "ITEM1002 102": "B45",
        "ITEM1003 103": "C25",
        "DD1391 100": "B12",
        "DQ9131 700": "B43",
        "HP7580 100": "A11",
        "GY9265 100": "C15",
        "BY9262 100": "A04",
        "GZ3495 100": "B43"
    };
    saveDatabase();
}

function saveDatabase() {
    localStorage.setItem('warehouseDatabase', JSON.stringify(warehouseDatabase));
    updateDbCount();
}

function updateDbCount() {
    const dbCountElement = document.getElementById('dbCount');
    if (dbCountElement) {
        dbCountElement.textContent = Object.keys(warehouseDatabase).length;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    loadThemePreference();
    loadDatabase();
    
    // Get DOM elements
    const uploadArea = document.getElementById('uploadArea');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const scanButton = document.getElementById('scanButton');
    const processingDiv = document.getElementById('processing');
    const resultsDiv = document.getElementById('results');
    const resultsBody = document.getElementById('resultsBody');
    const notFoundList = document.getElementById('notFoundList');
    const sortBy = document.getElementById('sortBy');
    const manualEntryBtn = document.getElementById('manualEntryBtn');
    const manualEntryModal = document.getElementById('manualEntryModal');
    const configBtn = document.getElementById('configBtn');
    const configModal = document.getElementById('configModal');
    const notFoundDiv = document.getElementById('notFound');
    const themeToggle = document.getElementById('themeToggle');
    
    console.log("Elements initialized:", {
        uploadArea: !!uploadArea,
        imageUpload: !!imageUpload,
        scanButton: !!scanButton,
        manualEntryBtn: !!manualEntryBtn,
        configBtn: !!configBtn,
        themeToggle: !!themeToggle
    });
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            toggleTheme();
        });
    }
    
    // Set up tab functionality
    const tabHeaders = document.querySelectorAll('.tab-header');
    tabHeaders.forEach(header => {
        header.addEventListener('click', function() {
            // Remove active class from all headers and contents
            document.querySelectorAll('.tab-header').forEach(h => h.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked header and corresponding content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Set up drag and drop for image upload
    if (uploadArea) {
        uploadArea.addEventListener('click', function() {
            imageUpload.click();
        });
        
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--primary-color)';
            this.style.backgroundColor = 'rgba(109, 93, 252, 0.05)';
        });
        
        uploadArea.addEventListener('dragleave', function() {
            this.style.borderColor = 'var(--border-color)';
            this.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
            this.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            
            if (e.dataTransfer.files.length) {
                handleImageUpload(e.dataTransfer.files[0]);
            }
        });
    }
    
    if (imageUpload) {
        imageUpload.addEventListener('change', function() {
            if (this.files.length) {
                handleImageUpload(this.files[0]);
            }
        });
    }
    
    // Function to handle image upload
    function handleImageUpload(file) {
        if (!file.type.match('image.*')) {
            alert('Please upload an image file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            scanButton.disabled = false;
        };
        reader.readAsDataURL(file);
    }
    
    // Scan button click handler
    if (scanButton) {
        scanButton.addEventListener('click', function() {
            console.log("Scan button clicked");
            scanImage();
        });
    }
    
    // Function to scan image using Tesseract.js
    function scanImage() {
        processingDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
        
        Tesseract.recognize(
            imagePreview.src,
            'eng',
            { logger: m => console.log(m) }
        ).then(({ data: { text } }) => {
            console.log("Extracted text:", text);
            
            // Extract potential SKUs from the text
            // This regex handles formats like "DD1391-100-11" and extracts base SKU + style/color
            const fullSkuRegex = /\b([A-Z]{2,}\d+)-([A-Z0-9]+)-[A-Z0-9.]+\b/g;
            const skuMatches = Array.from(text.matchAll(fullSkuRegex));
            let skus = [];
            
            for (const match of skuMatches) {
                if (match[1] && match[2]) {
                    // Format as "DD1391 100" (base + style with space)
                    skus.push(`${match[1]} ${match[2]}`);
                }
            }
            
            // Fallback to standard SKU pattern if no matches found
            if (skus.length === 0) {
                // Try to match simpler format (might be in database already)
                const fallbackRegex = /\b([A-Z]{2,}\d+)(?:\s+)(\d{3})\b/g;
                const fallbackMatches = Array.from(text.matchAll(fallbackRegex));
                
                for (const match of fallbackMatches) {
                    if (match[1] && match[2]) {
                        skus.push(`${match[1]} ${match[2]}`);
                    }
                }
                
                // If still no matches, try just base SKUs
                if (skus.length === 0) {
                    const baseSkuRegex = /\b[A-Z]{2,}\d+\b/g;
                    const baseSkus = text.match(baseSkuRegex) || [];
                    skus = skus.concat(baseSkus);
                }
            }
            
            // Fix commonly misread characters
            skus = skus.map(sku => {
                // Replace "1" with "I" at the beginning of SKUs that should start with "I"
                if (sku.startsWith('1G')) {
                    return 'IG' + sku.substring(2);
                }
                return sku;
            });
            
            // Remove duplicates
            skus = [...new Set(skus)];
            
            processSKUs(skus);
        }).catch(err => {
            console.error("Tesseract error:", err);
            alert("Error processing image: " + err.message);
        }).finally(() => {
            processingDiv.style.display = 'none';
        });
    }
    
    // Function to process list of SKUs and find their locations
    function processSKUs(skus) {
        console.log("Processing SKUs:", skus);
        resultsBody.innerHTML = '';
        notFoundList.innerHTML = '';
        
        const results = [];
        const notFound = [];
        
        skus.forEach(sku => {
            // Try to find the SKU as-is first
            let location = warehouseDatabase[sku];
            let exactMatch = true;
            let foundSku = sku;
            
            // If not found, try normalizing by replacing all hyphens with spaces
            if (!location) {
                const normalizedSku = sku.replace(/-/g, ' ');
                location = warehouseDatabase[normalizedSku];
                if (location) {
                    exactMatch = false;
                    foundSku = normalizedSku;
                }
            }
            
            // If still not found, try normalizing by replacing all spaces with hyphens
            if (!location) {
                const hyphenatedSku = sku.replace(/\s+/g, '-');
                location = warehouseDatabase[hyphenatedSku];
                if (location) {
                    exactMatch = false;
                    foundSku = hyphenatedSku;
                }
            }
            
            // If still not found and contains dash, try extracting parts
            if (!location && sku.includes('-')) {
                // Try different parts of the SKU by splitting on dash
                const parts = sku.split('-');
                // Try the first part (base)
                if (parts.length > 0) {
                    location = warehouseDatabase[parts[0]];
                    if (location) {
                        exactMatch = false;
                        foundSku = parts[0];
                    }
                }
                
                // Try base + first style part (if available)
                if (!location && parts.length > 1) {
                    const baseAndStyle = parts[0] + ' ' + parts[1];
                    location = warehouseDatabase[baseAndStyle];
                    if (location) {
                        exactMatch = false;
                        foundSku = baseAndStyle;
                    }
                }
            }
            
            // Same logic for space-separated SKUs
            if (!location && sku.includes(' ')) {
                // Try different parts of the SKU by splitting on space
                const parts = sku.split(' ');
                // Try the first part (base)
                if (parts.length > 0) {
                    location = warehouseDatabase[parts[0]];
                    if (location) {
                        exactMatch = false;
                        foundSku = parts[0];
                    }
                }
                
                // Try base + first style part (if available)
                if (!location && parts.length > 1) {
                    const baseAndStyle = parts[0] + '-' + parts[1];
                    location = warehouseDatabase[baseAndStyle];
                    if (location) {
                        exactMatch = false;
                        foundSku = baseAndStyle;
                    }
                }
            }
            
            if (location) {
                results.push({ 
                    originalSku: sku,
                    sku: foundSku, 
                    location, 
                    exactMatch
                });
            } else {
                notFound.push(sku);
            }
        });
        
        // Sort results based on selected option
        sortResults(results);
        
        // Display results
        results.forEach(item => {
            const row = document.createElement('tr');
            
            // Define cell content based on match type
            let skuDisplay = item.sku;
            if (!item.exactMatch) {
                skuDisplay = `${item.originalSku} <span style="color: var(--primary-color); font-style: italic;">(Matched as: ${item.sku})</span>`;
            }
            
            row.innerHTML = `
                <td>${skuDisplay}</td>
                <td><span class="location">${item.location}</span></td>
            `;
            resultsBody.appendChild(row);
        });
        
        // Display not found SKUs
        notFound.forEach(sku => {
            const li = document.createElement('li');
            li.textContent = sku;
            notFoundList.appendChild(li);
        });
        
        resultsDiv.style.display = results.length > 0 ? 'block' : 'none';
        
        // Show "Not Found" section only if there are items not found
        notFoundDiv.style.display = notFound.length > 0 ? 'block' : 'none';
    }
    
    // Sort results based on selected criteria
    function sortResults(results) {
        const sortOption = sortBy ? sortBy.value : 'location';
        
        if (sortOption === 'location') {
            // Sort by location
            results.sort((a, b) => {
                return a.location.localeCompare(b.location);
            });
        } else if (sortOption === 'sku') {
            // Sort by SKU
            results.sort((a, b) => {
                return a.sku.localeCompare(b.sku);
            });
        }
    }
    
    // Update results when sort option changes
    if (sortBy) {
        sortBy.addEventListener('change', function() {
            const rows = Array.from(resultsBody.querySelectorAll('tr'));
            const results = rows.map(row => {
                const cells = row.querySelectorAll('td');
                return {
                    sku: cells[0].textContent,
                    location: cells[1].querySelector('.location').textContent
                };
            });
            
            sortResults(results);
            
            // Clear and repopulate table
            resultsBody.innerHTML = '';
            results.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.sku}</td>
                    <td><span class="location">${item.location}</span></td>
                `;
                resultsBody.appendChild(row);
            });
        });
    }
    
    // Optimize route button
    const optimizeRouteBtn = document.getElementById('optimizeRouteBtn');
    if (optimizeRouteBtn) {
        optimizeRouteBtn.addEventListener('click', function() {
            console.log("Optimize route clicked");
            const rows = Array.from(resultsBody.querySelectorAll('tr'));
            const items = rows.map(row => {
                const cells = row.querySelectorAll('td');
                return {
                    sku: cells[0].textContent,
                    location: cells[1].querySelector('.location').textContent
                };
            });
            
            // Simple optimization: sort by zone then by location number
            items.sort((a, b) => {
                const zoneA = a.location.charAt(0);
                const zoneB = b.location.charAt(0);
                
                if (zoneA !== zoneB) {
                    return zoneA.localeCompare(zoneB);
                }
                
                const numA = parseInt(a.location.substring(1));
                const numB = parseInt(b.location.substring(1));
                return numA - numB;
            });
            
            // Clear and repopulate table
            resultsBody.innerHTML = '';
            items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.sku}</td>
                    <td><span class="location">${item.location}</span></td>
                `;
                resultsBody.appendChild(row);
            });
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            console.log("Export button clicked");
            const rows = Array.from(resultsBody.querySelectorAll('tr'));
            const csvContent = [
                ['SKU', 'Location'],
                ...rows.map(row => {
                    const cells = row.querySelectorAll('td');
                    const location = cells[1].querySelector('.location').textContent;
                    return [cells[0].textContent.split('(')[0].trim(), location];
                })
            ].map(e => e.join(',')).join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'warehouse_picks.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
    
    // Print button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            console.log("Print button clicked");
            window.print();
        });
    }
    
    // Manual entry
    if (manualEntryBtn) {
        manualEntryBtn.addEventListener('click', function() {
            console.log("Manual entry button clicked");
            manualEntryModal.style.display = 'block';
        });
    }
    
    const submitManualSKUs = document.getElementById('submitManualSKUs');
    if (submitManualSKUs) {
        submitManualSKUs.addEventListener('click', function() {
            console.log("Submit manual SKUs clicked");
            const manualSKUsTextarea = document.getElementById('manualSKUs');
            if (manualSKUsTextarea) {
                const text = manualSKUsTextarea.value;
                const skus = text.split('\n')
                    .filter(sku => sku.trim() !== '')
                    .map(sku => sku.trim());
                processSKUs(skus);
                manualEntryModal.style.display = 'none';
            }
        });
    }
    
    // Database config
    if (configBtn) {
        configBtn.addEventListener('click', function() {
            console.log("Config button clicked");
            configModal.style.display = 'block';
        });
    }
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close');
    if (closeButtons.length) {
        closeButtons.forEach(function(closeBtn) {
            closeBtn.addEventListener('click', function() {
                console.log("Close button clicked");
                manualEntryModal.style.display = 'none';
                configModal.style.display = 'none';
            });
        });
    }
    
    // When user clicks outside of the modals
    window.addEventListener('click', function(event) {
        if (event.target === manualEntryModal) {
            manualEntryModal.style.display = 'none';
        }
        if (event.target === configModal) {
            configModal.style.display = 'none';
        }
    });
    
    // Add/Update SKU-Location pair
    const addSkuButton = document.getElementById('addSkuButton');
    if (addSkuButton) {
        addSkuButton.addEventListener('click', function() {
            console.log("Add SKU button clicked");
            const skuInput = document.getElementById('skuInput');
            const locationInput = document.getElementById('locationInput');
            
            if (skuInput && locationInput) {
                const sku = skuInput.value.trim();
                const location = locationInput.value.trim();
                
                if (sku && location) {
                    warehouseDatabase[sku] = location;
                    saveDatabase();
                    alert(`SKU "${sku}" saved with location "${location}"`);
                    skuInput.value = '';
                    locationInput.value = '';
                } else {
                    alert('Please enter both SKU and Location');
                }
            }
        });
    }
    
    // Bulk import
    const bulkImportButton = document.getElementById('bulkImportButton');
    if (bulkImportButton) {
        bulkImportButton.addEventListener('click', function() {
            console.log("Bulk import button clicked");
            const bulkImport = document.getElementById('bulkImport');
            
            if (bulkImport) {
                const text = bulkImport.value;
                const lines = text.split('\n').filter(line => line.trim() !== '');
                let count = 0;
                
                lines.forEach(line => {
                    const [sku, location] = line.split(',').map(part => part.trim());
                    if (sku && location) {
                        warehouseDatabase[sku] = location;
                        count++;
                    }
                });
                
                saveDatabase();
                alert(`Successfully imported ${count} SKU-Location pairs.`);
                bulkImport.value = '';
            }
        });
    }
    
    // Export DB
    const exportDbButton = document.getElementById('exportDbButton');
    if (exportDbButton) {
        exportDbButton.addEventListener('click', function() {
            console.log("Export DB button clicked");
            const entries = Object.entries(warehouseDatabase);
            const csvContent = [
                ['SKU', 'Location'],
                ...entries.map(([sku, location]) => [sku, location])
            ].map(e => e.join(',')).join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'database.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
    
    // Clear DB
    const clearDbButton = document.getElementById('clearDbButton');
    if (clearDbButton) {
        clearDbButton.addEventListener('click', function() {
            console.log("Clear DB button clicked");
            if (confirm('Are you sure you want to clear the entire database? This cannot be undone.')) {
                warehouseDatabase = {};
                saveDatabase();
                alert('Database cleared successfully');
            }
        });
    }
    
    // Import CSV button
    const importCsvButton = document.getElementById('importCsvButton');
    if (importCsvButton) {
        importCsvButton.addEventListener('click', function() {
            console.log("Import CSV button clicked");
            const csvFileInput = document.getElementById('csvFileInput');
            if (csvFileInput) {
                csvFileInput.click();
            }
        });
    }
    
    // CSV File input change handler
    const csvFileInput = document.getElementById('csvFileInput');
    if (csvFileInput) {
        csvFileInput.addEventListener('change', function(e) {
            console.log("CSV file input changed");
            const file = e.target.files[0];
            if (!file) {
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const csvData = e.target.result;
                
                Papa.parse(csvData, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        let importCount = 0;
                        
                        results.data.forEach(row => {
                            // Handle both "SKU" and "sku" column names
                            const sku = row.SKU || row.sku;
                            // Handle both "Location" and "location" column names
                            const location = row.Location || row.location;
                            
                            if (sku && location) {
                                warehouseDatabase[sku] = location;
                                importCount++;
                            }
                        });
                        
                        saveDatabase();
                        alert(`Successfully imported ${importCount} SKU-Location pairs from CSV.`);
                    },
                    error: function(error) {
                        console.error('Error parsing CSV:', error);
                        alert('Error parsing CSV file. Please check the format.');
                    }
                });
            };
            reader.readAsText(file);
            
            // Reset the file input so the same file can be selected again
            this.value = '';
        });
    }
    
    console.log("All event listeners set up successfully");
});
