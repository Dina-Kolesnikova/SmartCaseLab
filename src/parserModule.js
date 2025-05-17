import { flatten } from 'flat';

const parseJsonData = (jsonData) => {
  console.log('JSON data received by parserModule:', jsonData);
  const inputDataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

  let headers = ['Test Case Name'];
  let finalRows = [];

  const firstValidItem = inputDataArray.find(item => typeof item === 'object' && item !== null && Object.keys(item).length > 0);

  if (firstValidItem) {
    // Flatten the first item completely to get all possible headers in order
    // Not using {safe: true} will result in cars.0.id, cars.1.id, etc.
    const flatTemplate = flatten(firstValidItem); 
    const discoveredKeys = Object.keys(flatTemplate);
    headers = ['Test Case Name', ...discoveredKeys];
  } else {
    // Fallback for completely empty or invalid input
    return {
      headers: ['Test Case Name'],
      rows: [{ 'Test Case Name': 'TC_01' }],
      originalData: jsonData,
    };
  }

  // Process each item to generate rows
  inputDataArray.forEach(item => {
    if (typeof item !== 'object' || item === null) return;
    // Flatten the entire item completely. Indexed paths for array elements will be created.
    const flattenedItem = flatten(item);
    finalRows.push(flattenedItem);
  });

  if (finalRows.length === 0) {
    // This can happen if inputDataArray was empty, or contained only non-objects.
    // If headers were determined (from a valid firstValidItem), create one default row with those headers.
    if (headers.length > 1) { 
        const defaultRow = { 'Test Case Name': 'TC_01' };
        headers.slice(1).forEach(header => defaultRow[header] = '');
        finalRows.push(defaultRow);
    } else {
        // Fallback to minimal if no headers could be determined (e.g., truly empty input)
        return { 
            headers: ['Test Case Name'],
            rows: [{ 'Test Case Name': 'TC_01' }],
            originalData: jsonData,
        };
    }
  }

  // Ensure all rows conform to the final header list
  const processedRows = finalRows.map((row, index) => {
    const newRow = { 'Test Case Name': `TC_${String(index + 1).padStart(2, '0')}` };
    headers.slice(1).forEach(header => {
      newRow[header] = row.hasOwnProperty(header) ? row[header] : '';
    });
    return newRow;
  });

  // If, after all processing, processedRows is empty but we have headers (more than just TC Name),
  // ensure at least one row is present for table display.
  if (processedRows.length === 0 && headers.length > 1) { 
    const defaultRow = { 'Test Case Name': 'TC_01' };
    headers.slice(1).forEach(header => defaultRow[header] = '');
    processedRows.push(defaultRow);
  }

  console.log('Processed data (arrays fully flattened to indexed columns):', { headers, rows: processedRows });
  return {
    headers,
    rows: processedRows,
    originalData: jsonData
  };
};

export { parseJsonData }; 