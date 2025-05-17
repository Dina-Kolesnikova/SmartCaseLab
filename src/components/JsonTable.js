import React from 'react';

const JsonTable = ({ headers, rows }) => {
  if (!headers || headers.length === 0) {
    return <p className="text-gray-500">No data to display or JSON is empty.</p>;
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg mt-4">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-6 py-3 whitespace-nowrap">
                {header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} {/* Prettify header names */}
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
                  let displayValue = cellValue;
                  if (typeof cellValue === 'boolean') {
                    displayValue = cellValue ? 'true' : 'false';
                  } else if (cellValue === null || cellValue === undefined) {
                    displayValue = ''; // Display empty string for null/undefined
                  } else if (typeof cellValue === 'object') {
                    displayValue = JSON.stringify(cellValue); // For nested objects/arrays not stringified by `flat` (e.g. with safe:true)
                  }

                  return (
                    <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap">
                      {/* For now, direct display. Editable cells will be part of Task 4 */}
                      {String(displayValue)}
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