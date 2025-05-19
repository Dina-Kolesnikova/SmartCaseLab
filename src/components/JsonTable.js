import React, { useState } from 'react';
import FieldRuleConfig from './FieldRuleConfig';
import { generateTestData } from '../utils/dataGenerator';

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

  const handleSaveRules = (rules) => {
    const generatedValues = generateTestData(rules);
    const { header: fieldToConfigure, rowIndex } = selectedField;

    if (!fieldToConfigure) {
      console.error("No field selected to configure rules for.");
      return;
    }
    
    // Handle field removal first
    if (rules.removeField || rules.removeObject) {
      if (rowIndex !== null && onRemoveFieldFromRow) {
        onRemoveFieldFromRow(rowIndex, fieldToConfigure);
      }
      
      if (rules.numberOfCases > 0) {
        const baseRow = rowIndex !== null ? { ...rows[rowIndex] } : (rows.length > 0 ? { ...rows[0] } : {});
        delete baseRow[fieldToConfigure];
        
        const newRowsToAdd = Array(rules.numberOfCases).fill().map(() => ({ ...baseRow }));

        if (onAddRows) {
          onAddRows(newRowsToAdd);
        }
      }

    } else { // Handle data generation rules
      if (rules.applyToExisting) {
        const updatedRowsData = rows.map((row, index) => {
           if (rowIndex !== null && index === rowIndex && !rules.applyToExisting) return row; // if configuring specific row, don't apply to itself unless applyToExisting is true
           if (rowIndex !== null && index !== rowIndex && !rules.applyToExisting && selectedField.rowIndex === index ) return row; // Skip the currently configured row if not applying to all

          const newRow = { ...row };
          newRow[fieldToConfigure] = generatedValues[index % generatedValues.length]; // Use generatedValues from selected rules
          return newRow;
        });
        
        if (onCellChange) {
          updatedRowsData.forEach((row, rIndex) => {
             if (rIndex === rowIndex || rows[rIndex][fieldToConfigure] !== row[fieldToConfigure]){
                onCellChange(rIndex, fieldToConfigure, row[fieldToConfigure]);
             }
          });
        }
      }
      
      if (rules.numberOfCases > 0) {
        const baseRow = rowIndex !== null ? { ...rows[rowIndex] } : (rows.length > 0 ? { ...rows[0] } : {});
        // Apply the rule to the base row before generating new ones, if it's the configured row and not applying to existing only
        if (rowIndex !== null && !rules.applyToExisting) { 
            baseRow[fieldToConfigure] = generateTestData(rules)[0]; // Assuming generateTestData returns an array
        } else if (rowIndex === null && !rules.applyToExisting && rows.length > 0) {
             // if no specific row, but generating for a column (e.g. header button in future)
             // and applyToExisting is false, we'd still want the new rows to have the generated value
            baseRow[fieldToConfigure] = generateTestData(rules)[0];
        } else if (rules.applyToExisting && rowIndex !== null) {
            // If applyToExisting is true, the baseRow should already have the updated value from above loop
            // No specific action needed here for baseRow[fieldToConfigure] as it's covered if rowIndex is part of rows updated
        }


        const newRowsToAdd = Array(rules.numberOfCases).fill(null).map((_, i) => {
          const rowToPopulate = { ...baseRow }; 
          // Use values from the generated set, cycling through them
          rowToPopulate[fieldToConfigure] = generatedValues[i % generatedValues.length];
          return rowToPopulate;
        });

        if (onAddRows) {
          onAddRows(newRowsToAdd);
        }
      } else if (rowIndex !== null && !rules.applyToExisting) {
        // Single application to the current cell if not generating multiple cases and not applying to all existing
        if (onCellChange) {
          onCellChange(rowIndex, fieldToConfigure, generateTestData(rules)[0]);
        }
      }
    }
    setIsRuleConfigOpen(false); // Close modal after saving
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

      {isRuleConfigOpen && selectedField.header && (
        <FieldRuleConfig 
          field={selectedField.header} 
          // rules={{}} /* Consider passing existing rules for editing in the future */ 
          onSaveRules={handleSaveRules}
          onClose={() => setIsRuleConfigOpen(false)} 
          // fieldType prop removed here
          isObjectContext={typeof (rows.length > 0 && rows[selectedField.rowIndex] ? rows[selectedField.rowIndex][selectedField.header] : undefined) === 'object'}
          initialRowIndex={selectedField.rowIndex}
        />
      )}
    </div>
  );
};

export default JsonTable; 