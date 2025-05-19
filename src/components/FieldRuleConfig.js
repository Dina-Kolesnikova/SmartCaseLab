import React, { useState } from 'react';

const FieldRuleConfig = ({ isOpen, onClose, fieldName, onSaveRules }) => {
  const [rules, setRules] = useState({
    dataType: 'string',
    minValue: '',
    maxValue: '',
    format: '',
    enumValues: '',
    numberOfCases: 0,
    dependencies: [],
    booleanValue: 'true', // For boolean type
    nullProbability: 0, // For null type
    stringLength: { min: 1, max: 10 }, // For string type
    arrayLength: { min: 1, max: 5 }, // For array type
    objectKeys: '', // For object type
    applyToExisting: false, // New option to apply rules to existing rows
    removeField: false, // New option to remove field
    removeObject: false, // New option to remove entire object
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRules(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(onSaveRules)
    onSaveRules(fieldName, rules);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Configure Rules for {fieldName}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="removeField"
              name="removeField"
              checked={rules.removeField}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="removeField" className="block text-sm font-medium text-gray-700">
              Remove this field from current test case
            </label>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="removeObject"
              name="removeObject"
              checked={rules.removeObject}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="removeObject" className="block text-sm font-medium text-gray-700">
              Remove entire object from current test case
            </label>
          </div>

          {!rules.removeField && !rules.removeObject && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data Type</label>
                <select
                  name="dataType"
                  value={rules.dataType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="email">Email</option>
                  <option value="enum">Enumeration</option>
                  <option value="boolean">Boolean</option>
                  <option value="null">Null</option>
                  <option value="array">Array</option>
                  <option value="object">Object</option>
                  <option value="uuid">UUID</option>
                  <option value="phone">Phone Number</option>
                  <option value="url">URL</option>
                  <option value="ip">IP Address</option>
                  <option value="color">Color (HEX)</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              {rules.dataType === 'string' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Length</label>
                    <input
                      type="number"
                      name="stringLength.min"
                      value={rules.stringLength.min}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maximum Length</label>
                    <input
                      type="number"
                      name="stringLength.max"
                      value={rules.stringLength.max}
                      onChange={handleChange}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {rules.dataType === 'number' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Value</label>
                    <input
                      type="number"
                      name="minValue"
                      value={rules.minValue}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maximum Value</label>
                    <input
                      type="number"
                      name="maxValue"
                      value={rules.maxValue}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {rules.dataType === 'date' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      name="minValue"
                      value={rules.minValue}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      name="maxValue"
                      value={rules.maxValue}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {rules.dataType === 'enum' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Possible Values (comma-separated)</label>
                  <input
                    type="text"
                    name="enumValues"
                    value={rules.enumValues}
                    onChange={handleChange}
                    placeholder="value1, value2, value3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              {rules.dataType === 'boolean' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Value</label>
                  <select
                    name="booleanValue"
                    value={rules.booleanValue}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                    <option value="random">Random</option>
                  </select>
                </div>
              )}

              {rules.dataType === 'null' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Probability of Null (0-100%)</label>
                  <input
                    type="number"
                    name="nullProbability"
                    value={rules.nullProbability}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              {rules.dataType === 'array' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Length</label>
                    <input
                      type="number"
                      name="arrayLength.min"
                      value={rules.arrayLength.min}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maximum Length</label>
                    <input
                      type="number"
                      name="arrayLength.max"
                      value={rules.arrayLength.max}
                      onChange={handleChange}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {rules.dataType === 'object' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Object Keys (comma-separated)</label>
                  <input
                    type="text"
                    name="objectKeys"
                    value={rules.objectKeys}
                    onChange={handleChange}
                    placeholder="key1, key2, key3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Additional Test Cases</label>
                <input
                  type="number"
                  name="numberOfCases"
                  value={rules.numberOfCases}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="applyToExisting"
                  name="applyToExisting"
                  checked={rules.applyToExisting}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="applyToExisting" className="block text-sm font-medium text-gray-700">
                  Apply to existing rows
                </label>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Rules
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FieldRuleConfig; 