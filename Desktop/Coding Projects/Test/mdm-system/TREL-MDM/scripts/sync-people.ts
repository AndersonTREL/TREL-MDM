import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import axios from 'axios';
import FormData from 'form-data';

// --- Configuration ---
const API_URL = 'http://localhost:3000/api/people';
const OUTPUT_FILE = path.join(__dirname, 'people_export.xlsx');

// --- Mock Source Data ---
// In a real scenario, this would connect to an HR DB or external API.
async function fetchUserData() {
    console.log('Fetching user data from connected source...');
    // Simulating data retrieval
    return [
        { firstName: 'Alice', lastName: 'Johnson', station: 'Station A' },
        { firstName: 'Bob', lastName: 'Smith', station: 'Station B' },
        { firstName: 'Charlie', lastName: 'Brown', station: 'Station A' },
        { firstName: 'Diana', lastName: 'Prince', station: 'Station C' },
        { firstName: 'Evan', lastName: 'Wright', station: 'Station B' },
        // Invalid entry for validation test
        { firstName: 'Frank', lastName: '', station: 'Station A' },
    ];
}

// --- Workflow Steps ---

async function generateExcel(data: any[]) {
    console.log('Generating Excel file...');

    // Prepare data for Excel (mapping to template columns)
    const rows = data.map(user => ({
        'First Name': user.firstName,
        'Last Name': user.lastName,
        'Station': user.station
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'People');

    XLSX.writeFile(workbook, OUTPUT_FILE);
    console.log(`Excel file saved to ${OUTPUT_FILE}`);
    return rows;
}

function validateData(rows: any[]) {
    console.log('Validating data...');
    const validRows = [];
    const errors = [];

    for (const row of rows) {
        if (!row['First Name'] || !row['Last Name'] || !row['Station']) {
            errors.push(`Missing fields for entry: ${JSON.stringify(row)}`);
        } else {
            // Check for potential duplicates (simple check)
            // In a real app, might check against DB or more complex logic
            validRows.push(row);
        }
    }

    if (errors.length > 0) {
        console.warn('Validation Errors found:', errors.length);
        errors.forEach(e => console.warn(' - ' + e));
        // We could choose to abort, or proceed with valid rows.
        // For this workflow, let's notify but proceed with valid ones.
        // But since we already wrote the Excel with ALL rows, strictly we might want to rewrite it?
        // Let's assume the upload endpoint handles validation too (it does), 
        // but the requirement says "Validate that no required fields are empty".
        // So we should probably Filter before generating Excel? 
        // Let's refine the flow: Fetch -> Validate -> Generate Excel -> Upload.
    }

    return validRows;
}

async function uploadToDashboard() {
    console.log('Uploading to dashboard...');

    if (!fs.existsSync(OUTPUT_FILE)) {
        console.error('File not found!');
        return;
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(OUTPUT_FILE));

    try {
        const response = await axios.post(API_URL, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        console.log('Upload Success:', response.data);
    } catch (error: any) {
        console.error('Upload Failed:', error.response?.data || error.message);
    }
}

// --- Main Execution ---

async function runWorkflow() {
    try {
        // 1. Retrieve
        const rawData = await fetchUserData();

        // 2. Validate
        // We validate BEFORE generating the final Excel to ensure the file uploaded is clean?
        // Or we generate a "Raw" Excel and let the dashboard validate? 
        // The prompt says: "Automatically fill the Excel file... Validate... Upload"
        // It implies filling first. 
        // But logic suggests we only want valid data in the Excel we send.

        const validRows = [];
        for (const user of rawData) {
            if (user.firstName && user.lastName && user.station) {
                validRows.push(user);
            } else {
                console.warn('Skipping invalid user record:', user);
                // "Log errors and notify administrator"
                console.error(`[ALERT] Invalid data encountered for: ${JSON.stringify(user)}`);
            }
        }

        // 3. Fill Excel
        // Re-map to template structure
        await generateExcel(validRows);

        // 4. Upload
        await uploadToDashboard();

        console.log('Workflow completed successfully.');

    } catch (error) {
        console.error('Workflow Error:', error);
    }
}

// Execute
runWorkflow();
