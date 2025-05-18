import React from 'react';

const JsonTable = ({ headers, rows, onCellChange, onDeleteRow, onAutoGenerateCell, requiredFields, onToggleRequiredField }) => {
  if (!headers || headers.length === 0) {
    return <p className="text-gray-500">No data to display or JSON is empty.</p>;
  }

  const handleInputChange = (rowIndex, headerKey, event) => {
    if (onCellChange) {
      // When reading from input, if user types "null", we pass "null" string.
      // If they clear it, we pass empty string.
      // The App.js or parser might later decide how to interpret these.
      onCellChange(rowIndex, headerKey, event.target.value);
    }
  };

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg mt-4">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            {headers.map((header) => {
              const isRequired = requiredFields && requiredFields[header]; // Correctly check for property
              const headerDisplayName = header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <th key={header} scope="col" className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <span>{headerDisplayName}{isRequired ? <span className="text-red-500">*</span> : ''}</span>
                    {header !== "Test Case Name" && onToggleRequiredField && (
                      <button
                        onClick={() => onToggleRequiredField(header)}
                        title={`Toggle ${headerDisplayName} as required`}
                        className={`ml-2 px-1 py-0.5 text-xs rounded focus:outline-none focus:ring-1 ${
                          isRequired 
                            ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-300" 
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-400"
                        }`}
                      >
                        {isRequired ? "Required" : "Mark Req"}
                      </button>
                    )}
                  </div>
                </th>
              );
            })}
            <th scope="col" className="px-6 py-3 whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows && rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                {headers.map((header) => {
                  const cellValue = row[header];
                  let displayValue;
                  
                  if (typeof cellValue === 'boolean') {
                    displayValue = String(cellValue); // "true" or "false"
                  } else if (cellValue === null) {
                    displayValue = 'null'; // Explicitly show "null"
                  } else if (cellValue === undefined) {
                    displayValue = ''; // Undefined becomes empty string
                  } else if (typeof cellValue === 'object') {
                    displayValue = JSON.stringify(cellValue); // Objects/arrays as JSON string
                  } else {
                    displayValue = String(cellValue); // Numbers, strings, etc.
                  }

                  const isReadOnly = typeof cellValue === 'object' && cellValue !== null;
                  let inputTitle;
                  
                  if (isReadOnly) {
                    inputTitle = "Direct editing of objects/arrays in cell is not supported.";
                  } else {
                    inputTitle = String(displayValue); 
                  }

                  let inputSpecificWidthClass = "w-full"; // Default to full width

                  if (header.toLowerCase() === 'id') { // Check for 'id' case-insensitively
                    inputSpecificWidthClass = "w-48"; 
                  }

                  const inputContainerClasses = [
                    "flex",
                    "items-center",
                    "relative", // For positioning the button if needed
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
                    !isReadOnly && onAutoGenerateCell ? "pr-7" : "" // Add padding to the right if button is present
                  ];

                  return (
                    <td key={`${rowIndex}-${header}`} className="px-6 py-4">
                      <div className={inputContainerClasses.join(" ")}>
                        <input 
                          type="text"
                          value={displayValue}
                          onChange={(e) => handleInputChange(rowIndex, header, e)}
                          className={inputClasses.filter(Boolean).join(" ")}
                          readOnly={isReadOnly}
                          title={inputTitle}
                        />
                        {!isReadOnly && onAutoGenerateCell && (
                          <button
                            onClick={() => onAutoGenerateCell(rowIndex, header)}
                            className="absolute right-0.5 top-1/2 transform -translate-y-1/2 px-1 py-0.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                            title={`Auto-generate for this cell`}
                          >
                            🪄
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="px-6 py-4 whitespace-nowrap">
                  {onDeleteRow && (
                    <button 
                      onClick={() => onDeleteRow(rowIndex)}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length + 1} className="px-6 py-4 text-center text-gray-500">
                No rows to display. (Input might have been empty or not an object/array of objects).
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default JsonTable; 