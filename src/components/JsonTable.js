import React, { useEffect, useState } from 'react';
import FieldRuleConfig from './FieldRuleConfig';
import { generateTestData, detectFieldType } from '../utils/dataGenerator';

const JsonTable = ({ headers, manualHeaders = [], rows, onCellChange, onDeleteRow, onAutoGenerateCell, requiredFields, onToggleRequiredField, onCopyFromPreviousRow, onAddRows, onRemoveFieldFromRow, onUndoRemoveField }) => {
  const [selectedField, setSelectedField] = useState({ header: null, rowIndex: null });
  const [isRuleConfigOpen, setIsRuleConfigOpen] = useState(false);

  // Determine if there's any data to display based on JSON headers or manual headers
  const hasJsonHeaders = headers && headers.length > 0;
  const hasManualHeaders = manualHeaders && manualHeaders.length > 0;
  const hasAnyData = hasJsonHeaders || hasManualHeaders;

  if (!hasAnyData && (!rows || rows.length === 0)) {
    return <p className="text-gray-500">No data to display. Process JSON or add manual columns.</p>;
  }

  // Construct displayedHeaders in the desired order:
  // 1. Test Case Name (if exists in original headers)
  // 2. Manual Headers
  // 3. Remaining Original Headers
  let displayedHeaders = [];
  const testCaseNameHeader = 'Test Case Name';
  let originalHeaders = headers || []; // Ensure headers is an array even if null/undefined

  if (originalHeaders.includes(testCaseNameHeader)) {
    displayedHeaders.push(testCaseNameHeader);
  }
  displayedHeaders = [...displayedHeaders, ...manualHeaders];
  originalHeaders.forEach(header => {
    if (header !== testCaseNameHeader && !manualHeaders.includes(header)) {
      displayedHeaders.push(header);
    }
  });
  
  // If displayedHeaders is empty (e.g. only manual headers that are empty, and no json headers yet) 
  // but rows might exist (e.g. after clearing JSON but keeping manual structure), we might need a different check or rely on rows also being empty.
  // For now, if displayedHeaders is empty, it implies no columns to show headers for.
  if (displayedHeaders.length === 0 && (!rows || rows.length === 0)) {
     return <p className="text-gray-500">No columns defined. Process JSON or add manual columns.</p>;
  }

  const handleInputChange = (rowIndex, headerKey, event) => {
    if (onCellChange) {
      // When reading from input, if user types "null", we pass "null" string.
      // If they clear it, we pass empty string.
      // The App.js or parser might later decide how to interpret these.
      onCellChange(rowIndex, headerKey, event.target.value);
    }
  };

  const handleConfigureRules = (header, rowIndex = null) => {
    setSelectedField({ header, rowIndex });
    setIsRuleConfigOpen(true);
  };

  const handleSaveRules = (fieldName, rules) => {
    const generatedValues = generateTestData(rules);
    const { header, rowIndex } = selectedField; // Get the selected row index
    
    // Handle field removal first
    if (rules.removeField || rules.removeObject) {
      if (rowIndex !== null && onRemoveFieldFromRow) {
        // Call parent to remove the field from the specific row
        onRemoveFieldFromRow(rowIndex, fieldName);
      }
      
      // If generating new rows after removal, create them without the field
      if (rules.numberOfCases > 0) {
        // Create new rows based on the row AFTER removal
        const baseRow = rowIndex !== null ? { ...rows[rowIndex] } : { ...rows[0] }; // Use the modified row if available, otherwise first row
        delete baseRow[fieldName]; // Ensure the base row for new cases doesn't have the field
        
        const newRows = Array(rules.numberOfCases).fill().map(() => ({ ...baseRow }));

        if (onAddRows) {
          onAddRows(newRows);
        }
      }

    } else { // Handle data generation rules
      if (rules.applyToExisting) {
        // Apply rules to all existing rows (excluding the one being configured if it was specified)
        const updatedRows = rows.map((row, index) => {
          // Only apply to existing rows, skip if configuring a specific row and applyToExisting is false
           if (rowIndex !== null && index !== rowIndex && !rules.applyToExisting) return row;

          const newRow = { ...row };
          newRow[fieldName] = generatedValues[index % generatedValues.length];
          return newRow;
        });
        
        // Update all applicable rows
        if (onCellChange) {
          updatedRows.forEach((row, rIndex) => {
             // Only call onCellChange if the value actually changed or it's the row being configured
             if (rIndex === rowIndex || rows[rIndex][fieldName] !== row[fieldName]){
                onCellChange(rIndex, fieldName, row[fieldName]);
             }
          });
        }
      }
      
      // Generate additional new rows based on the rule
      if (rules.numberOfCases > 0) {
         // If a specific row was configured, base new rows on that row's current state
        const baseRow = rowIndex !== null ? { ...rows[rowIndex] } : { ...rows[0] }; // Use the selected row state or the first row

        const newRows = generatedValues.map(value => {
          const rowToPopulate = { ...baseRow }; 
          rowToPopulate[fieldName] = value;
          return rowToPopulate;
        });

        // Call the parent component's onAddRows function to add the new rows
        if (onAddRows) {
          onAddRows(newRows);
        }
      }
    }
  };

    

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg mt-4">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3 whitespace-nowrap">Actions</th>
            {displayedHeaders.map((header) => {
              const isRequired = requiredFields && requiredFields[header];
              const headerDisplayName = header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <th key={header} scope="col" className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <span>{headerDisplayName}{isRequired ? <span className="text-red-500">*</span> : ''}</span>
                    <div className="ml-2 space-x-1">
                      {header !== "Test Case Name" && onToggleRequiredField && (
                        <button
                          onClick={() => onToggleRequiredField(header)}
                          title={`Toggle ${headerDisplayName} as required`}
                          className={`px-1 py-0.5 text-xs rounded focus:outline-none focus:ring-1 ${
                            isRequired 
                              ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-300" 
                              : "bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-400"
                          }`}
                        >
                          {isRequired ? "Required" : "Mark Req"}
                        </button>
                      )}
                    </div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows && rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 whitespace-nowrap space-x-1">
                  {onDeleteRow && (
                    <button 
                      onClick={() => onDeleteRow(rowIndex)}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                      Delete
                    </button>
                  )}
                  {onCopyFromPreviousRow && rowIndex > 0 && (
                    <button
                      onClick={() => onCopyFromPreviousRow(rowIndex)}
                      title="Copy data from the row above (excluding Test Case Name)"
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      Copy Prev
                    </button>
                  )}
                </td>
                {displayedHeaders.map((header) => {
                  const cellValue = row[header];
                  let displayValue;
                  let cellClasses = "px-6 py-4"; // Default cell classes
                  let content;
                  
                  // Declare these variables before they are potentially used in the JSX
                  const isReadOnly = typeof cellValue === 'object' && cellValue !== null && cellValue !== undefined; // Also check for undefined
                  let inputTitle = isReadOnly && cellValue !== undefined ? 
                    "Direct editing of objects/arrays in cell is not supported." : 
                    String(cellValue);

                  let inputSpecificWidthClass = "w-full";
                  if (header.toLowerCase() === 'id') {
                    inputSpecificWidthClass = "w-48";
                  }

                  const inputContainerClasses = [
                    "flex",
                    "items-center",
                    "relative",
                  ];

                  const inputClasses = [
                    inputSpecificWidthClass,
                    "min-w-20",
                    "px-1",
                    "py-0.5",
                    "border",
                    "border-gray-300",
                    "focus:border-blue-500",
                    "focus:ring-1",
                    "focus:ring-blue-500",
                    "rounded-sm",
                    "bg-transparent",
                    "truncate",
                    "pr-7" // Always add padding for the rules button
                  ];

                  if (cellValue === undefined) {
                    displayValue = '[Removed]';
                    cellClasses += " text-gray-400 italic"; // Add classes for removed state
                    content = (
                      <div className="flex items-center space-x-1">
                        <span>{displayValue}</span>
                        {onUndoRemoveField && (
                           <button
                            onClick={() => onUndoRemoveField(rowIndex, header)}
                            className="px-1 py-0.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded focus:outline-none focus:ring-1 focus:ring-yellow-300"
                            title={`Undo remove ${header}`}
                          >
                            Undo
                          </button>
                        )}
                      </div>
                    );
                  } else if (typeof cellValue === 'boolean') {
                    displayValue = String(cellValue);
                    content = (
                      <div className={inputContainerClasses.join(" ")}>
                        <input 
                          type="text"
                          value={displayValue}
                          onChange={(e) => handleInputChange(rowIndex, header, e)}
                          className={inputClasses.filter(Boolean).join(" ")}
                          readOnly={isReadOnly}
                          title={inputTitle}
                        />
                        <button
                          onClick={() => handleConfigureRules(header, rowIndex)}
                          className="absolute right-0.5 top-1/2 transform -translate-y-1/2 px-1 py-0.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                          title={`Configure rules for ${header}`}
                        >
                          Rules
                        </button>
                      </div>
                    );
                  } else if (cellValue === null) {
                    displayValue = 'null';
                     content = (
                      <div className={inputContainerClasses.join(" ")}>
                        <input 
                          type="text"
                          value={displayValue}
                          onChange={(e) => handleInputChange(rowIndex, header, e)}
                          className={inputClasses.filter(Boolean).join(" ")}
                          readOnly={isReadOnly}
                          title={inputTitle}
                        />
                        <button
                          onClick={() => handleConfigureRules(header, rowIndex)}
                          className="absolute right-0.5 top-1/2 transform -translate-y-1/2 px-1 py-0.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                          title={`Configure rules for ${header}`}
                        >
                          Rules
                        </button>
                      </div>
                    );
                  } else if (typeof cellValue === 'object') {
                    displayValue = JSON.stringify(cellValue);
                     content = (
                      <div className={inputContainerClasses.join(" ")}>
                        <input 
                          type="text"
                          value={displayValue}
                          onChange={(e) => handleInputChange(rowIndex, header, e)}
                          className={inputClasses.filter(Boolean).join(" ")}
                          readOnly={isReadOnly}
                          title={inputTitle}
                        />
                        <button
                          onClick={() => handleConfigureRules(header, rowIndex)}
                          className="absolute right-0.5 top-1/2 transform -translate-y-1/2 px-1 py-0.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                          title={`Configure rules for ${header}`}
                        >
                          Rules
                        </button>
                      </div>
                    );
                  } else {
                    displayValue = String(cellValue);
                     content = (
                      <div className={inputContainerClasses.join(" ")}>
                        <input 
                          type="text"
                          value={displayValue}
                          onChange={(e) => handleInputChange(rowIndex, header, e)}
                          className={inputClasses.filter(Boolean).join(" ")}
                          readOnly={isReadOnly}
                          title={inputTitle}
                        />
                        <button
                          onClick={() => handleConfigureRules(header, rowIndex)}
                          className="absolute right-0.5 top-1/2 transform -translate-y-1/2 px-1 py-0.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                          title={`Configure rules for ${header}`}
                        >
                          Rules
                        </button>
                      </div>
                    );
                  }

                  return (
                    <td key={`${rowIndex}-${header}`} className={cellClasses}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={displayedHeaders.length + 1} className="px-6 py-4 text-center text-gray-500">
                No rows to display. (Input might have been empty or not an object/array of objects).
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <FieldRuleConfig
        isOpen={isRuleConfigOpen}
        onClose={() => setIsRuleConfigOpen(false)}
        fieldName={selectedField.header}
        onSaveRules={handleSaveRules}
      />
    </div>
  );
};

export default JsonTable; 