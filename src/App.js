import React, { useState } from 'react';
import HomePage from './components/HomePage';
import JsonTable from './components/JsonTable';
import { parseJsonData } from './parserModule';
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
          <JsonTable headers={tableData.headers} rows={tableData.rows} />
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