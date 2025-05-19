import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import JsonTable from './components/JsonTable';
import { parseJsonData } from './parserModule';
import { faker } from '@faker-js/faker'; // Import faker
import Papa from 'papaparse'; // Import papaparse
import { unflatten } from 'flat'; // Removed flatten as it's unused here
import './index.css'; // Assuming Tailwind CSS is set up here

const DRAFT_STORAGE_KEY = 'smartcaselab_draft_v1';
const REQUIRED_FIELDS_STORAGE_KEY = 'smartcaselab_requiredFields_v1';
const MANUAL_HEADERS_STORAGE_KEY = 'smartcaselab_manualHeaders_v1'; // Key for manual headers

// Helper function to trigger file download
const downloadFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Helper function to safely stringify values for CSV
const safeStringify = (value) => {
  if (value === null || value === undefined) {
    return 'null'; // Represent null/undefined as the string "null"
  }
  if (typeof value === 'object') {
    // For arrays and objects, return their JSON string representation
    return JSON.stringify(value);
  }
  // For primitives (string, number, boolean), return as is.
  // PapaParse will handle quoting for strings if they contain delimiters/newlines.
  return value;
};

function App() {
  const [tableData, setTableData] = useState({ headers: [], rows: [] });
  const [currentJson, setCurrentJson] = useState(null);
  const [error, setError] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [newManualColumnName, setNewManualColumnName] = useState(''); // State for the new column name input

  // State for required fields
  const [requiredFields, setRequiredFields] = useState(() => {
    const savedRequiredFields = localStorage.getItem(REQUIRED_FIELDS_STORAGE_KEY);
    return savedRequiredFields ? JSON.parse(savedRequiredFields) : {};
  });

  const [manualHeaders, setManualHeaders] = useState(() => {
    const savedManualHeaders = localStorage.getItem(MANUAL_HEADERS_STORAGE_KEY);
    return savedManualHeaders ? JSON.parse(savedManualHeaders) : [];
  });

  // Auto-load draft on initial mount
  useEffect(() => {
    handleLoadDraft(true);
  }, []);

  // Effect to save requiredFields to localStorage
  useEffect(() => {
    localStorage.setItem(REQUIRED_FIELDS_STORAGE_KEY, JSON.stringify(requiredFields));
  }, [requiredFields]);

  // Effect to save manualHeaders to localStorage
  useEffect(() => {
    localStorage.setItem(MANUAL_HEADERS_STORAGE_KEY, JSON.stringify(manualHeaders));
  }, [manualHeaders]);

  const handleJsonSuccessfullyParsed = (jsonData) => {
    try {
      console.log('App received JSON:', jsonData);
      setCurrentJson(jsonData);
      const { headers, rows } = parseJsonData(jsonData);
      setTableData({ headers, rows });
      setError('');
      console.log('Data processed by parserModule for table:', { headers, rows });
    } catch (err) {
      console.error("Error processing JSON in App:", err);
      setError(`Failed to process JSON data: ${err.message}. Check console for more details.`);
      setTableData({ headers: [], rows: [] });
      setCurrentJson(null);
    }
    setTimeout(() => setDraftMessage(''), 3000);
  };

  const handleCellChange = (rowIndex, columnId, value) => {
    setTableData(prevData => {
      const newRows = prevData.rows.map((row, rIndex) => {
        if (rIndex === rowIndex) {
          const updatedRow = { ...row, [columnId]: value };
          // Acceptance Criteria: Empty test case name gets a generated default
          if (columnId === 'Test Case Name' && !value.trim()) {
            updatedRow[columnId] = `TC_${String(rowIndex + 1).padStart(2, '0')}`;
          }
          return updatedRow;
        }
        return row;
      });
      return { ...prevData, rows: newRows };
    });
  };

  const handleAddRow = () => {
    setTableData(prevData => {
      if ((!prevData.headers || prevData.headers.length === 0) && manualHeaders.length === 0) {
        // Cannot add a row if there are no headers (neither JSON-derived nor manual)
        setDraftMessage("Cannot add row: No columns defined yet. Please process JSON or add a manual column.");
        setTimeout(() => setDraftMessage(''), 3000);
        return prevData;
      }
      const newRow = {};
      // Initialize manual headers
      manualHeaders.forEach(header => {
        newRow[header] = '';
      });
      // Initialize JSON-derived headers
      prevData.headers.forEach(header => {
        if (header === 'Test Case Name') {
          // Find the highest existing TC number to generate a new unique one
          let maxTcNum = 0;
          prevData.rows.forEach(r => {
            if (r['Test Case Name'] && r['Test Case Name'].startsWith('TC_')) {
              const num = parseInt(r['Test Case Name'].substring(3), 10);
              if (!isNaN(num) && num > maxTcNum) {
                maxTcNum = num;
              }
            }
          });
          newRow[header] = `TC_${String(maxTcNum + 1).padStart(2, '0')}`;
        } else {
          newRow[header] = ''; // Or null, or some other default
        }
      });
      return {
        ...prevData,
        rows: [...prevData.rows, newRow]
      };
    });
  };

  const handleDeleteRow = (rowIndexToDelete) => {
    setTableData(prevData => ({
      ...prevData,
      rows: prevData.rows.filter((_, index) => index !== rowIndexToDelete)
    }));
  };

  const handleAutoGenerateCell = (rowIndex, columnId) => {
    setTableData(prevData => {
      const newRows = prevData.rows.map((row, rIndex) => {
        if (rIndex === rowIndex) {
          const newRow = { ...row };
          let generatedValue;
          const lowerColumnId = columnId.toLowerCase();

          if (lowerColumnId.includes('email')) {
            generatedValue = faker.internet.email();
          } else if (lowerColumnId.includes('name')) {
            generatedValue = faker.person.fullName();
          } else if (lowerColumnId.includes('id') && !lowerColumnId.includes('uuid')) {
            generatedValue = faker.string.alphanumeric({ length: 8, casing: 'upper' });
          } else if (lowerColumnId.includes('uuid') || lowerColumnId.includes('guid')) {
            generatedValue = faker.string.uuid();
          } else if (lowerColumnId.includes('phone') || lowerColumnId.includes('number')) {
            generatedValue = faker.phone.number();
          } else if (lowerColumnId.includes('address')) {
            generatedValue = faker.location.streetAddress();
          } else if (lowerColumnId.includes('city')) {
            generatedValue = faker.location.city();
          } else if (lowerColumnId.includes('zip') || lowerColumnId.includes('postal')) {
            generatedValue = faker.location.zipCode();
          } else if (lowerColumnId.includes('country')) {
            generatedValue = faker.location.country();
          } else if (lowerColumnId.includes('date')) {
            generatedValue = faker.date.past().toLocaleDateString();
          } else if (lowerColumnId.includes('url') || lowerColumnId.includes('website')) {
            generatedValue = faker.internet.url();
          } else if (lowerColumnId.includes('price') || lowerColumnId.includes('amount')) {
            generatedValue = faker.commerce.price();
          } else if (lowerColumnId.includes('description') || lowerColumnId.includes('comment') || lowerColumnId.includes('text')) {
            generatedValue = faker.lorem.sentence();
          } else if (columnId === 'Test Case Name') {
            generatedValue = newRow[columnId]; // Keep existing
          } else {
            generatedValue = faker.lorem.words(3);
          }

          // Don't overwrite if the column is Test Case Name or if original was an object/array (read-only)
          const originalValue = row[columnId];
          if (columnId !== 'Test Case Name' && (typeof originalValue !== 'object' || originalValue === null)) {
            newRow[columnId] = generatedValue;
          } else if (columnId !== 'Test Case Name' && originalValue === null) { 
            newRow[columnId] = generatedValue;
          }
          return newRow;
        }
        return row;
      });
      return { ...prevData, rows: newRows };
    });
  };

  const handleSaveDraft = () => {
    if ((!tableData.headers || tableData.headers.length === 0) && manualHeaders.length === 0) {
      setDraftMessage('No data to save.');
      setTimeout(() => setDraftMessage(''), 3000);
      return;
    }
    try {
      const draftData = {
        tableData,
        currentJson,
        manualHeaders, // Save manualHeaders
        requiredFields, // Also save requiredFields with the draft for consistency
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      setDraftMessage('Draft saved successfully!');
      console.log('Draft saved:', draftData);
    } catch (e) {
      console.error('Failed to save draft:', e);
      setDraftMessage('Error saving draft. See console for details.');
    }
    setTimeout(() => setDraftMessage(''), 3000); // Clear message after 3 seconds
  };

  const handleLoadDraft = (isAutoLoad = false) => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        if (draftData && draftData.tableData) { // currentJson can be null if only manual cols exist
          setTableData(draftData.tableData);
          setCurrentJson(draftData.currentJson || null);
          setManualHeaders(draftData.manualHeaders || []); // Load manualHeaders
          setRequiredFields(draftData.requiredFields || {}); // Load requiredFields
          setError(''); // Clear any previous errors
          if (!isAutoLoad) {
            setDraftMessage(`Draft from ${new Date(draftData.timestamp).toLocaleString()} loaded.`);
          }
          console.log('Draft loaded:', draftData);
        } else {
          if (!isAutoLoad) setDraftMessage('Invalid draft data found.');
          console.warn('Invalid draft data structure:', draftData);
        }
      } else {
        if (!isAutoLoad) setDraftMessage('No draft found.');
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
      if (!isAutoLoad) setDraftMessage('Error loading draft. See console for details.');
      // Optionally clear potentially corrupted draft
      // localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    if (!isAutoLoad) {
        setTimeout(() => setDraftMessage(''), 3000);
    }
  };

  const handleExportJson = () => {
    if (!tableData.rows || tableData.rows.length === 0) {
      setDraftMessage('No data to export.');
      setTimeout(() => setDraftMessage(''), 3000);
      return;
    }
    try {
      const rowsToExport = tableData.rows.map(row => {
        // eslint-disable-next-line no-useless-computed-key
        const { ['Test Case Name']: _, ...restOfRow } = row; // Exclude 'Test Case Name'
        return unflatten(restOfRow);
      });
      
      // If original input was a single object and we only have one row, export a single object.
      // Otherwise, export an array of objects. This handles most use cases.
      const jsonDataToExport = (currentJson && !Array.isArray(currentJson) && rowsToExport.length === 1)
        ? rowsToExport[0]
        : rowsToExport;

      const jsonString = JSON.stringify(jsonDataToExport, null, 2);
      downloadFile('test_cases.json', jsonString, 'application/json');
      setDraftMessage('JSON exported successfully!');
    } catch (e) {
      console.error('Failed to export JSON:', e);
      setDraftMessage('Error exporting JSON. See console.');
    }
    setTimeout(() => setDraftMessage(''), 3000);
  };

  const handleExportCsv = () => {
    if (!tableData.rows || tableData.rows.length === 0) {
      setDraftMessage('No data to export.');
      setTimeout(() => setDraftMessage(''), 3000);
      return;
    }
    if (!currentJson) {
      setDraftMessage('Original JSON structure not available for CSV export in the desired format.');
      setTimeout(() => setDraftMessage(''), 3000);
      return;
    }

    try {
      const schemaReferenceObject = Array.isArray(currentJson) ? (currentJson[0] || {}) : currentJson;
      if (typeof schemaReferenceObject !== 'object' || schemaReferenceObject === null || Object.keys(schemaReferenceObject).length === 0) {
        setDraftMessage('Cannot determine a valid schema from original JSON to build CSV.');
        setTimeout(() => setDraftMessage(''), 3000);
        return;
      }

      const topLevelCsvHeaders = ['Test Case Name', ...Object.keys(schemaReferenceObject)];

      const processedRowsForCsv = tableData.rows.map(flatRowData => {
        const newCsvRow = { 'Test Case Name': flatRowData['Test Case Name'] }; // Start with Test Case Name

        for (const topLevelKey in schemaReferenceObject) {
          if (Object.prototype.hasOwnProperty.call(schemaReferenceObject, topLevelKey)) {
            const originalValue = schemaReferenceObject[topLevelKey];
            
            if (typeof originalValue === 'object' && originalValue !== null) {
              // Reconstruct the complex object/array for this topLevelKey from the flatRowData
              let relevantFlatData = {};
              for (const flatKey in flatRowData) {
                if (flatKey === topLevelKey || flatKey.startsWith(topLevelKey + '.')) {
                  relevantFlatData[flatKey] = flatRowData[flatKey];
                }
              }
              // Unflatten only the portion relevant to this topLevelKey
              // The result of unflatten might be { topLevelKey: { ... actual data ...} }
              // or if topLevelKey itself was a root of a simple value in flatRowData (unlikely for complex)
              // we need to ensure we extract the correct structure that unflatten returns.
              const unflattenedPortion = unflatten(relevantFlatData);
              newCsvRow[topLevelKey] = safeStringify(unflattenedPortion[topLevelKey]);
            } else {
              // For primitives, directly get from flatRowData (which should have this topLevelKey)
              newCsvRow[topLevelKey] = safeStringify(flatRowData[topLevelKey]);
            }
          }
        }
        return newCsvRow;
      });

      const csvString = Papa.unparse({
        fields: topLevelCsvHeaders,
        data: processedRowsForCsv
      });
      downloadFile('test_cases_structured.csv', csvString, 'text/csv;charset=utf-8;');
      setDraftMessage('Structured CSV exported successfully!');
    } catch (e) {
      console.error('Failed to export structured CSV:', e);
      setDraftMessage('Error exporting structured CSV. See console.');
    }
    setTimeout(() => setDraftMessage(''), 3000);
  };

  const handleExportPostmanTemplate = () => {
    if (!currentJson) {
      setDraftMessage('Original JSON structure not available for template generation.');
      setTimeout(() => setDraftMessage(''), 3000);
      return;
    }

    try {
      const schemaReferenceObject = Array.isArray(currentJson) ? (currentJson[0] || {}) : currentJson;
      if (typeof schemaReferenceObject !== 'object' || schemaReferenceObject === null || Object.keys(schemaReferenceObject).length === 0) {
        setDraftMessage('Cannot determine a valid schema from original JSON to build template.');
        setTimeout(() => setDraftMessage(''), 3000);
        return;
      }

      const templateBodyPlaceholders = {};
      const topLevelKeysForDescription = [];

      for (const key in schemaReferenceObject) {
        if (Object.prototype.hasOwnProperty.call(schemaReferenceObject, key)) {
          topLevelKeysForDescription.push(key);
          const originalValue = schemaReferenceObject[key];
          const originalType = typeof originalValue;

          if (originalType === 'string') {
            templateBodyPlaceholders[key] = `{{${key}}}`;
          } else {
            // For numbers, booleans, null, objects, arrays
            templateBodyPlaceholders[key] = `__RAW_PLACEHOLDER_START__${key}__RAW_PLACEHOLDER_END__`;
          }
        }
      }
      
      if (topLevelKeysForDescription.length === 0) {
        setDraftMessage('No top-level keys found in the schema to generate a template.');
        setTimeout(() => setDraftMessage(''), 3000);
        return;
      }

      let rawJsonBody = JSON.stringify(templateBodyPlaceholders, null, 2);
      rawJsonBody = rawJsonBody.replace(/"__RAW_PLACEHOLDER_START__(.*?)__RAW_PLACEHOLDER_END__"/g, '{{$1}}');

      const postmanRequest = {
        info: {
          name: "SmartCaseLab Generated Request",
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
          description: `Generated Postman request template. Top-level variables: ${topLevelKeysForDescription.join(', ')}. Ensure your CSV has corresponding columns with appropriate (stringified if complex) values.`
        },
        item: [{
            name: "Sample Request (Change URL and Method)",
            request: {
                method: "POST", // Default method
                header: [
                    { "key": "Content-Type", "value": "application/json" }
                ],
                body: {
                    mode: "raw",
                    raw: rawJsonBody
                },
                url: {
                    raw: "YOUR_API_ENDPOINT_HERE",
                    host: [ "YOUR_API_ENDPOINT_HERE" ]
                },
                description: "This is a sample request. Please update the URL, method, and other details as needed."
            }
        }]
      };

      const postmanCollectionString = JSON.stringify(postmanRequest, null, 2);
      downloadFile('postman_collection.json', postmanCollectionString, 'application/json');
      setDraftMessage('Postman collection template exported successfully!');

    } catch (e) {
      console.error('Failed to export Postman template:', e);
      setDraftMessage('Error exporting Postman template. See console.');
    }
    setTimeout(() => setDraftMessage(''), 3000);
  };

  const handleCopyFromPreviousRow = (rowIndexToPopulate) => {
    setTableData(prevData => {
      if (rowIndexToPopulate <= 0 || rowIndexToPopulate >= prevData.rows.length) {
        // Cannot copy if it's the first row, or index is out of bounds, or no previous row exists
        console.warn("Cannot copy from previous row: invalid rowIndexToPopulate or no previous row.");
        return prevData;
      }

      const previousRowData = prevData.rows[rowIndexToPopulate - 1];
      const currentRowData = prevData.rows[rowIndexToPopulate]; 
      
      // Create a new object for updatedRow to ensure all keys from previousRowData are copied,
      // including manual header keys that might not be on currentRowData if it was just added.
      const updatedRow = { ...previousRowData };
      
      // Preserve current TC Name if it exists (it should from handleAddRow)
      if (currentRowData['Test Case Name']) {
         updatedRow['Test Case Name'] = currentRowData['Test Case Name'];
      }

      const newRows = [...prevData.rows];
      newRows[rowIndexToPopulate] = updatedRow;

      return { ...prevData, rows: newRows };
    });
  };

  const handleToggleRequiredField = (columnId) => {
    // Don't allow toggling for 'Test Case Name' column
    if (columnId === 'Test Case Name') return;

    setRequiredFields(prev => ({
      ...prev,
      [columnId]: !prev[columnId] // Toggle the boolean value
    }));
  };

  const handleClearAllTestCases = () => {
    if (window.confirm("Are you sure you want to clear all test cases and custom columns? This action cannot be undone.")) {
      setTableData({ headers: [], rows: [] });
      setCurrentJson(null);
      setManualHeaders([]); // Clear manual headers
      setError('');
      setRequiredFields({});
      setTimeout(() => setDraftMessage(''), 3000);
    }
  };

  const handleAddManualColumnInternal = () => {
    const columnName = newManualColumnName.trim();
    if (!columnName) {
      setDraftMessage("Column name cannot be empty.");
      setTimeout(() => setDraftMessage(''), 3000);
      return;
    }
    if (manualHeaders.includes(columnName) || tableData.headers.includes(columnName)) {
      setDraftMessage(`Column "${columnName}" already exists.`);
      setTimeout(() => setDraftMessage(''), 3000);
      return;
    }

    setManualHeaders(prev => [...prev, columnName]);
    setTableData(prevData => ({
      ...prevData,
      rows: prevData.rows.map(row => ({
        ...row,
        [columnName]: '' // Initialize new column with empty string for all existing rows
      }))
    }));
    setNewManualColumnName(''); // Clear input field
    setDraftMessage(`Custom column "${columnName}" added.`);
    setTimeout(() => setDraftMessage(''), 3000);
  };

  return (
    <div className="App">
      <HomePage onJsonParsed={handleJsonSuccessfullyParsed} />
      {error && (
        <div className="container mx-auto p-4 mt-2 text-red-600 bg-red-100 border border-red-400 rounded">
          <p><strong>Processing Error:</strong> {error}</p>
        </div>
      )}
      {draftMessage && (
        <div className={`container mx-auto p-4 mt-2 text-sm rounded ${draftMessage.startsWith('Error') || draftMessage.startsWith('Invalid') || draftMessage.startsWith('No data') || draftMessage.startsWith('No draft') ? 'text-red-700 bg-red-100 border border-red-400' : 'text-green-700 bg-green-100 border border-green-400'}`}>
          {draftMessage}
        </div>
      )}
      {tableData.headers && tableData.headers.length > 0 && (
        <div className="container mx-auto p-4 mt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Generated Test Cases Table</h2>
            <div className="space-x-2">
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleLoadDraft()}
                className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Load Draft
              </button>
              <button
                onClick={handleExportJson}
                className="px-4 py-2 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
              >
                Export JSON
              </button>
              <button
                onClick={handleExportCsv}
                className="px-4 py-2 bg-teal-500 text-white text-sm rounded hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
              >
                Export CSV
              </button>
              <button
                onClick={handleExportPostmanTemplate}
                className="px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
              >
                Export Postman Template
              </button>
              {/* Add Clear All Test Cases button */}
              <button
                onClick={handleClearAllTestCases}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                title="Clear all generated test cases and reset the table."
              >
                Clear All Cases
              </button>
            </div>
          </div>
          <div className="flex items-end mb-4 space-x-2"> {/* Changed items-center to items-end for better alignment with input */}
            <button
              onClick={handleAddRow}
              disabled={(!tableData.headers || tableData.headers.length === 0) && manualHeaders.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-300"
            >
              Add New Row
            </button>
            {/* UI for adding manual column */}
            <div className="flex items-end space-x-2">
              <input 
                type="text"
                value={newManualColumnName}
                onChange={(e) => setNewManualColumnName(e.target.value)}
                placeholder="New Column Name"
                className="px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                onClick={handleAddManualColumnInternal}
                disabled={tableData.rows.length === 0 && (!currentJson && manualHeaders.length === 0)} // Disable if no rows or no table structure at all
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:bg-gray-300"
              >
                Add Custom Column
              </button>
            </div>
          </div>
          <JsonTable 
            headers={tableData.headers} 
            manualHeaders={manualHeaders}
            rows={tableData.rows} 
            onCellChange={handleCellChange}
            onDeleteRow={handleDeleteRow}
            onAutoGenerateCell={handleAutoGenerateCell}
            requiredFields={requiredFields}
            onToggleRequiredField={handleToggleRequiredField}
            onCopyFromPreviousRow={handleCopyFromPreviousRow}
          />
        </div>
      )}
      {currentJson && (
         <div className="container mx-auto p-4 mt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold">Original JSON Input:</h3>
          <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
            {JSON.stringify(currentJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App; 