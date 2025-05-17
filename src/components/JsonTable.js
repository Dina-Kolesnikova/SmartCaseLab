import React from 'react';

const JsonTable = ({ headers, rows, onCellChange }) => {
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
            {headers.map((header) => (
              <th key={header} scope="col" className="px-6 py-3 whitespace-nowrap">
                {header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </th>
            ))}
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
                    inputSpecificWidthClass = "w-48"; // Apply a fixed width for ID column, increased from w-40
                  }

                  const inputClasses = [
                    inputSpecificWidthClass, // Use the determined width class
                    "px-1", 
                    "py-0.5", 
                    "border", 
                    "border-transparent", 
                    "hover:border-gray-300", 
                    "focus:border-blue-500", 
                    "focus:ring-1", 
                    "focus:ring-blue-500", 
                    "rounded-sm", 
                    "bg-transparent",
                    "truncate" 
                  ];

                  return (
                    <td key={`${rowIndex}-${header}`} className="px-6 py-4">
                      <input 
                        type="text"
                        value={displayValue} // displayValue is already a string or 'null' string
                        onChange={(e) => handleInputChange(rowIndex, header, e)}
                        className={inputClasses.join(" ")}
                        readOnly={isReadOnly}
                        title={inputTitle}
                      />
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-6 py-4 text-center text-gray-500">
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