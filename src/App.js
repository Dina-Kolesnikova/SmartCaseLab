import React, { useState } from 'react';
import HomePage from './components/HomePage';
import JsonTable from './components/JsonTable';
import { parseJsonData } from './parserModule';
import { faker } from '@faker-js/faker'; // Import faker
import './index.css'; // Assuming Tailwind CSS is set up here

function App() {
  const [tableData, setTableData] = useState({ headers: [], rows: [] });
  const [currentJson, setCurrentJson] = useState(null);
  const [error, setError] = useState('');

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
      if (!prevData.headers || prevData.headers.length === 0) {
        // Cannot add a row if there are no headers (e.g., no JSON processed yet)
        return prevData;
      }
      const newRow = {};
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

  return (
    <div className="App">
      <HomePage onJsonParsed={handleJsonSuccessfullyParsed} />
      {error && (
        <div className="container mx-auto p-4 mt-2 text-red-600 bg-red-100 border border-red-400 rounded">
          <p><strong>Processing Error:</strong> {error}</p>
        </div>
      )}
      {tableData.headers && tableData.headers.length > 0 && (
        <div className="container mx-auto p-4 mt-4 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-2">Generated Test Cases Table</h2>
          <button 
            onClick={handleAddRow}
            className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Add New Row
          </button>
          <JsonTable 
            headers={tableData.headers} 
            rows={tableData.rows} 
            onCellChange={handleCellChange}
            onDeleteRow={handleDeleteRow}
            onAutoGenerateCell={handleAutoGenerateCell}
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