import React, { useState } from 'react';

const HomePage = ({ onJsonParsed }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [fileError, setFileError] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [parsedFileData, setParsedFileData] = useState(null);

  const handleFileChange = (event) => {
    setFileError('');
    setParsedFileData(null);
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsedJson = JSON.parse(e.target.result);
            setJsonInput(JSON.stringify(parsedJson, null, 2));
            setParsedFileData(parsedJson);
          } catch (err) {
            setFileError('Error parsing JSON file: ' + err.message);
            setJsonInput('');
          }
        };
        reader.readAsText(file);
      } else {
        setFileError('Invalid file type. Please upload a .json file.');
        setJsonInput('');
      }
    }
  };

  const handleProcessUploadedJson = () => {
    if (parsedFileData) {
      console.log('Processing uploaded JSON:', parsedFileData);
      if (onJsonParsed) {
        onJsonParsed(parsedFileData);
      }
    } else {
      setFileError('No file data to process. Please upload a file first.');
    }
  };

  const handlePasteChange = (event) => {
    setPasteError('');
    setJsonInput(event.target.value);
    setParsedFileData(null);
  };

  const handleProcessPastedJson = () => {
    setPasteError('');
    if (!jsonInput.trim()) {
        setPasteError('Textarea is empty. Paste some JSON data.');
        return;
    }
    try {
      const parsedJson = JSON.parse(jsonInput);
      console.log('Processing pasted JSON:', parsedJson);
      if (onJsonParsed) {
          onJsonParsed(parsedJson);
      }
    } catch (err) {
      setPasteError('Error parsing pasted JSON: ' + err.message);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setFileError('');
    setParsedFileData(null);
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsedJson = JSON.parse(e.target.result);
            setJsonInput(JSON.stringify(parsedJson, null, 2));
            setParsedFileData(parsedJson);
          } catch (err) {
            setFileError('Error parsing JSON from dropped file: ' + err.message);
            setJsonInput('');
          }
        };
        reader.readAsText(file);
      } else {
        setFileError('Invalid file type. Please drop a .json file.');
        setJsonInput('');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">SmartCaseLab</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* File Upload Section */}
        <div
          className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center flex flex-col justify-between"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div>
            <h2 className="text-xl font-semibold mb-2">Upload JSON File</h2>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100 mb-2"
            />
            <p className="text-xs text-gray-500">Drag & drop a .json file here</p>
            {fileError && <p className="text-red-500 text-sm mt-2">{fileError}</p>}
          </div>
          {parsedFileData && (
            <button
              onClick={handleProcessUploadedJson}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 self-center"
            >
              Process Uploaded JSON
            </button>
          )}
        </div>

        {/* Paste JSON Section */}
        <div className="border border-gray-300 p-6 rounded-lg flex flex-col">
          <h2 className="text-xl font-semibold mb-2">Paste JSON Data</h2>
          <textarea
            value={jsonInput}
            onChange={handlePasteChange}
            placeholder='{\n  "key": "value",\n  "nested": {\n    "anotherKey": "anotherValue"\n  }\n}'
            className="w-full h-40 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 flex-grow"
          />
          <button
            onClick={handleProcessPastedJson}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 self-start"
          >
            Process Pasted JSON
          </button>
          {pasteError && <p className="text-red-500 text-sm mt-2">{pasteError}</p>}
        </div>
      </div>
    </div>
  );
};

export default HomePage; 