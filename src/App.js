import React, { useState, useEffect, useCallback } from 'react';
import HomePage from './components/HomePage';
import JsonTable from './components/JsonTable';
import { parseJsonData } from './parserModule';
import Papa from 'papaparse'; // Import papaparse
import { unflatten } from 'flat'; // Removed flatten as it's unused here
import './index.css'; // Assuming Tailwind CSS is set up here
import { downloadFile, safeStringify } from './utils'; // Import from utils.js
import { useLocalStorageState } from './hooks/useLocalStorageState'; // Import custom hook
import { generateDataForColumn } from './dataGenerator'; // Import the new data generator function

const DRAFT_STORAGE_KEY = 'smartcaselab_draft_v1';
const REQUIRED_FIELDS_STORAGE_KEY = 'smartcaselab_requiredFields_v1';
const MANUAL_HEADERS_STORAGE_KEY = 'smartcaselab_manualHeaders_v1'; // Key for manual headers
const REMOVED_FIELDS_STORAGE_KEY = 'smartcaselab_removedFields_v1'; // Key for removed fields state

// Helper function to trigger file download
// const downloadFile = (filename, content, mimeType) => { ... }; // REMOVE THIS

// Helper function to safely stringify values for CSV
// const safeStringify = (value) => { ... }; // REMOVE THIS

function App() {
  const [tableData, setTableData] = useState({ headers: [], rows: [] });
  const [currentJson, setCurrentJson] = useState(null);
  const [error, setError] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [newManualColumnName, setNewManualColumnName] = useState(''); // State for the new column name input

  const [requiredFields, setRequiredFields] = useLocalStorageState(REQUIRED_FIELDS_STORAGE_KEY, {});
  const [manualHeaders, setManualHeaders] = useLocalStorageState(MANUAL_HEADERS_STORAGE_KEY, []);
  const [removedFieldsState, setRemovedFieldsState] = useLocalStorageState(REMOVED_FIELDS_STORAGE_KEY, {});

  const handleLoadDraft = useCallback((isAutoLoad = false) => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        if (draftData && draftData.tableData) {
          setTableData(draftData.tableData);
          setCurrentJson(draftData.currentJson || null);
          setManualHeaders(draftData.manualHeaders || []);
          setRequiredFields(draftData.requiredFields || {});
          setRemovedFieldsState(draftData.removedFieldsState || {});
          setError('');
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
    }
    if (!isAutoLoad) {
        setTimeout(() => setDraftMessage(''), 3000);
    }
  }, [setTableData, setCurrentJson, setManualHeaders, setRequiredFields, setRemovedFieldsState, setError, setDraftMessage]);

  // Auto-load draft on initial mount
  useEffect(() => {
    handleLoadDraft(true);
  }, [handleLoadDraft]);

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
          const originalValue = row[columnId];

          // Don't overwrite if the column is Test Case Name 
          // or if original was an object/array (read-only in cell)
          // or if it's a field that has been marked as removed for this row
          const isRemoved = removedFieldsState[`${rowIndex}-${columnId}`] === 'field';

          if (columnId !== 'Test Case Name' && 
              (typeof originalValue !== 'object' || originalValue === null) &&
              !isRemoved) {
            const generatedValue = generateDataForColumn(columnId);
            if (generatedValue !== null) { // generateDataForColumn returns null for 'Test Case Name'
              newRow[columnId] = generatedValue;
            }
          } else if (columnId !== 'Test Case Name' && originalValue === null && !isRemoved) {
            // This condition handles explicitly null original values if not an object and not removed
            const generatedValue = generateDataForColumn(columnId);
            if (generatedValue !== null) {
              newRow[columnId] = generatedValue;
            }
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
        removedFieldsState, // Save removedFieldsState
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
        // Remove any undefined values (removed fields)
        const cleanedRow = Object.fromEntries(
          Object.entries(restOfRow).filter(([_, value]) => value !== undefined)
        );
        return unflatten(cleanedRow);
      });
      
      // If original input was a single object and we only have one row, export a single object.
      // Otherwise, export an array of objects.
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
            
            // Skip if the field was removed (undefined)
            if (flatRowData[topLevelKey] === undefined) {
              continue;
            }
            
            if (typeof originalValue === 'object' && originalValue !== null) {
              // Reconstruct the complex object/array for this topLevelKey from the flatRowData
              let relevantFlatData = {};
              for (const flatKey in flatRowData) {
                if (flatKey === topLevelKey || flatKey.startsWith(topLevelKey + '.')) {
                  // Skip if the field was removed (undefined)
                  if (flatRowData[flatKey] === undefined) {
                    continue;
                  }
                  relevantFlatData[flatKey] = flatRowData[flatKey];
                }
              }
              // Only add the field if there's data to add
              if (Object.keys(relevantFlatData).length > 0) {
                const unflattenedPortion = unflatten(relevantFlatData);
                newCsvRow[topLevelKey] = safeStringify(unflattenedPortion[topLevelKey]);
              }
            } else {
              // For primitives, directly get from flatRowData
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
      console.error('Failed to export CSV:', e);
      setDraftMessage('Error exporting CSV. See console.');
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

  const handleRemoveFieldFromRow = (rowIndex, fieldName) => {
    // 1. Capture the original value from the current tableData state
    let valueToStore = undefined;
    if (tableData.rows[rowIndex]) {
      valueToStore = tableData.rows[rowIndex][fieldName];
    }

    // 2. Update removedFieldsState with the captured original value
    if (valueToStore !== undefined) {
      setRemovedFieldsState(prevRemoved => ({
        ...prevRemoved,
        [rowIndex]: { ...prevRemoved[rowIndex], [fieldName]: valueToStore }
      }));
    }

    // 3. Update tableData to mark the field as removed
    setTableData(prevData => {
      const newRows = prevData.rows.map((row, rIndex) => {
        if (rIndex === rowIndex) {
          const updatedRow = { ...row };
          delete updatedRow[fieldName]; // Mark as removed for UI and export
          return updatedRow;
        }
        return row;
      });

      // Handle manual headers based on the newRows
      let newManualHeaders = Array.isArray(prevData.manualHeaders) ? [...prevData.manualHeaders] : [];
      if (Array.isArray(prevData.manualHeaders) && prevData.manualHeaders.includes(fieldName)) { // Check against prevData.manualHeaders
         const isHeaderStillNeeded = newRows.some(row => row.hasOwnProperty(fieldName) && row[fieldName] !== undefined);
         if (!isHeaderStillNeeded) {
            newManualHeaders = newManualHeaders.filter(header => header !== fieldName);
         }
      }

      return {
        ...prevData,
        rows: newRows,
        manualHeaders: newManualHeaders,
      };
    });
  };

  const handleUndoRemoveField = (rowIndex, fieldName) => {
    console.log(`Attempting undo for row ${rowIndex}, field: ${fieldName}`);
    setRemovedFieldsState(prevRemoved => {
      console.log('Previous removedFieldsState:', prevRemoved);
      const rowRemovedState = prevRemoved[rowIndex];
      const originalValue = rowRemovedState ? rowRemovedState[fieldName] : undefined;
      console.log(`Original value found for ${fieldName} in row ${rowIndex}:`, originalValue);

      if (originalValue !== undefined) {
        console.log('Original value is defined, proceeding with undo...');
        
        // We will always attempt to setTableData if originalValue was found
        setTableData(prevData => {
          console.log('Previous tableData in undo:', prevData);
          const newRows = prevData.rows.map((row, rIdx) => {
            if (rIdx === rowIndex) {
              return { ...row, [fieldName]: originalValue };
            }
            return { ...row }; // Ensure all rows are new objects
          });
          
           let newManualHeaders = Array.isArray(prevData.manualHeaders) ? [...prevData.manualHeaders] : [];
           const isOriginalHeader = prevData.headers.includes(fieldName);
           const isHeaderPresentInAnyRowAfterUndo = newRows.some(row => row.hasOwnProperty(fieldName) && row[fieldName] !== undefined);
           console.log(`Is original header: ${isOriginalHeader}, Present after undo: ${isHeaderPresentInAnyRowAfterUndo}, Current manual headers:`, newManualHeaders);

           if (isHeaderPresentInAnyRowAfterUndo && !isOriginalHeader && !newManualHeaders.includes(fieldName)) {
               newManualHeaders.push(fieldName);
               console.log('Adding field to manualHeaders:', fieldName);
           }

          console.log('New manual headers after undo logic:', newManualHeaders);
          console.log('New rows after undo:', newRows);
          return { headers: [...prevData.headers], rows: newRows, manualHeaders: newManualHeaders };
        });

        // Idempotent cleanup of removedFieldsState:
        // Only create newRemoved if the field actually exists in prevRemoved
        if (prevRemoved[rowIndex] && prevRemoved[rowIndex].hasOwnProperty(fieldName)) {
            const newRemoved = { ...prevRemoved };
            // Deep clone the row entry to modify it
            newRemoved[rowIndex] = { ...newRemoved[rowIndex] }; 
            delete newRemoved[rowIndex][fieldName];
            if (Object.keys(newRemoved[rowIndex]).length === 0) {
              delete newRemoved[rowIndex];
            }
            setDraftMessage(`Undo successful for ${fieldName} in row ${rowIndex + 1}.`);
            setTimeout(() => setDraftMessage(''), 3000);
            console.log('Cleaned up removedFieldsState.', newRemoved);
            return newRemoved;
        }
        // If the field wasn't in prevRemoved (e.g., second StrictMode call), don't change prevRemoved
        console.log('Field was not in removedFieldsState (likely already processed), no change to removedFieldsState.');
        return prevRemoved; 

      }
      console.log('Original value is undefined in removedFieldsState, undo aborted.');
      return prevRemoved;
    });
  };

  const handleAddRows = (newRows) => {
    setTableData(prevData => {
      // Ensure each new row has all required fields
      const completeNewRows = newRows.map(row => {
        const completeRow = { ...row };
        // Add any missing headers with empty values, but exclude fields marked for removal
        [...prevData.headers, ...manualHeaders].forEach(header => {
          if (!(header in completeRow)) {
            if (header === 'Test Case Name') {
              // Generate a new TC number for the Test Case Name
              let maxTcNum = 0;
              prevData.rows.forEach(r => {
                if (r['Test Case Name'] && r['Test Case Name'].startsWith('TC_')) {
                  const num = parseInt(r['Test Case Name'].substring(3), 10);
                  if (!isNaN(num) && num > maxTcNum) {
                    maxTcNum = num;
                  }
                }
              });
              completeRow[header] = `TC_${String(maxTcNum + 1).padStart(2, '0')}`;
            } else {
              completeRow[header] = '';
            }
          }
        });
        return completeRow;
      });

      return {
        ...prevData,
        rows: [...prevData.rows, ...completeNewRows]
      };
    });
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
            onAddRows={handleAddRows}
            onRemoveFieldFromRow={handleRemoveFieldFromRow}
            onUndoRemoveField={handleUndoRemoveField}
            removedFieldsState={removedFieldsState}
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