# Test info

- Name: Field Rule Configuration and Data Generation >> should open the Configure Rules modal for a cell
- Location: /Users/dinakolesnikova/Documents/Apps/SmartCaseLab/e2e/rule-configuration.spec.js:32:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: getByText('Data Type:')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByText('Data Type:')

    at /Users/dinakolesnikova/Documents/Apps/SmartCaseLab/e2e/rule-configuration.spec.js:57:48
```

# Page snapshot

```yaml
- heading "SmartCaseLab" [level=1]
- heading "Upload JSON File" [level=2]
- button "Choose File"
- paragraph: Drag & drop a .json file here
- heading "Paste JSON Data" [level=2]
- 'textbox "{\\n \"key\": \"value\",\\n \"nested\": {\\n \"anotherKey\": \"anotherValue\"\\n }\\n}"': "{ \"id\": 1, \"name\": \"Test Item\", \"description\": \"A sample item for testing rules\" }"
- button "Process Pasted JSON"
- heading "Generated Test Cases Table" [level=2]
- button "Save Draft"
- button "Load Draft"
- button "Export JSON"
- button "Export CSV"
- button "Export Postman Template"
- button "Clear All Cases"
- button "Add New Row"
- textbox "New Column Name"
- button "Add Custom Column"
- table:
  - rowgroup:
    - row "Actions Test Case Name Id Mark Req Name Mark Req Description Mark Req":
      - columnheader "Actions"
      - columnheader "Test Case Name"
      - columnheader "Id Mark Req":
        - text: Id
        - button "Mark Req"
      - columnheader "Name Mark Req":
        - text: Name
        - button "Mark Req"
      - columnheader "Description Mark Req":
        - text: Description
        - button "Mark Req"
  - rowgroup:
    - row "Delete TC_01 Rules 1 Rules Test Item Rules A sample item for testing rules Rules":
      - cell "Delete":
        - button "Delete"
      - cell "TC_01 Rules":
        - textbox "TC_01"
        - button "Rules"
      - cell "1 Rules":
        - textbox "1"
        - button "Rules"
      - cell "Test Item Rules":
        - textbox "Test Item"
        - button "Rules"
      - cell "A sample item for testing rules Rules":
        - textbox "A sample item for testing rules"
        - button "Rules"
- heading "Configure Rules for id" [level=2]
- checkbox "Remove this field from current test case"
- text: Remove this field from current test case
- checkbox "Remove entire object from current test case"
- text: Remove entire object from current test case Data Type
- combobox:
  - option "String" [selected]
  - option "Number"
  - option "Date"
  - option "Email"
  - option "Enumeration"
  - option "Boolean"
  - option "Null"
  - option "Array"
  - option "Object"
  - option "UUID"
  - option "Phone Number"
  - option "URL"
  - option "IP Address"
  - option "Color (HEX)"
  - option "JSON"
- text: Minimum Length
- spinbutton: "1"
- text: Maximum Length
- spinbutton: "10"
- text: Number of Additional Test Cases
- spinbutton: "0"
- checkbox "Apply to existing rows"
- text: Apply to existing rows
- button "Cancel"
- button "Save Rules"
- heading "Original JSON Input:" [level=3]
- text: "{ \"id\": 1, \"name\": \"Test Item\", \"description\": \"A sample item for testing rules\" }"
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 |
   3 | test.describe('Field Rule Configuration and Data Generation', () => {
   4 |   const sampleJsonString = JSON.stringify({
   5 |     "id": 1,
   6 |     "name": "Test Item",
   7 |     "description": "A sample item for testing rules"
   8 |   }, null, 2);
   9 |
  10 |   const correctPlaceholder = '{\n  "key": "value",\n  "nested": {\n    "anotherKey": "anotherValue"\n  }\n}';
  11 |
  12 |   test.beforeEach(async ({ page }) => {
  13 |     await page.goto('http://localhost:3000');
  14 |     // Wait specifically for the textarea to be visible
  15 |     const textareaSelector = `textarea[placeholder='${correctPlaceholder}']`;
  16 |     try {
  17 |       await page.waitForSelector(textareaSelector, { state: 'visible', timeout: 15000 }); // Wait 15s
  18 |       await page.locator(textareaSelector).fill(sampleJsonString);
  19 |     } catch (e) {
  20 |       console.error("Textarea not found with placeholder selector, trying class selector...");
  21 |       // Fallback to a less specific selector if the placeholder one fails
  22 |       const fallbackTextareaSelector = 'textarea.w-full.h-40.p-2.border.border-gray-300';
  23 |       await page.waitForSelector(fallbackTextareaSelector, { state: 'visible', timeout: 10000 }); // Wait 10s
  24 |       await page.locator(fallbackTextareaSelector).fill(sampleJsonString);
  25 |     }
  26 |     await page.getByRole('button', { name: 'Process Pasted JSON' }).click();
  27 |     await expect(page.getByRole('heading', { name: 'Generated Test Cases Table' })).toBeVisible({ timeout: 10000 });
  28 |     // Ensure the first data row is visible
  29 |     await expect(page.getByRole('row').nth(1)).toBeVisible();
  30 |   });
  31 |
  32 |   test('should open the Configure Rules modal for a cell', async ({ page }) => {
  33 |     // Target the first data row (nth(1) because nth(0) is the header row)
  34 |     const firstDataRow = page.getByRole('row').nth(1);
  35 |
  36 |     // Cells are: Actions, Test Case Name, Id, Name, Description
  37 |     // The 'Id' column should be the 3rd cell (index 2) in the data row
  38 |     // Or, more robustly, find the 'Id' column header index first
  39 |     const headers = await page.getByRole('columnheader').allTextContents();
  40 |     console.log('Actual column headers found:', headers); // Log headers
  41 |
  42 |     const idColumnIndex = headers.findIndex(h => h.trim().toLowerCase().startsWith('id'));
  43 |     expect(idColumnIndex, `Could not find column starting with 'id'. Found headers: ${headers.join(', ')}`).toBeGreaterThan(-1);
  44 |
  45 |     // Get the cell in the first data row corresponding to the 'Id' column
  46 |     const targetCell = firstDataRow.getByRole('cell').nth(idColumnIndex);
  47 |
  48 |     // Click the "Rules" button within this cell
  49 |     // Assuming the "Rules" button has a unique identifier or text within the cell
  50 |     // Let's assume the button has the text "Rules" or a specific test ID.
  51 |     // For now, we'll look for a button with the text "Rules".
  52 |     await targetCell.getByRole('button', { name: 'Rules' }).click();
  53 |
  54 |     // Verify the modal is open
  55 |     await expect(page.getByRole('heading', { name: 'Configure Rules for id' })).toBeVisible();
  56 |     // Check for some elements within the modal
> 57 |     await expect(page.getByText('Data Type:')).toBeVisible();
     |                                                ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  58 |     await expect(page.getByRole('combobox').first()).toBeVisible(); // The data type selector
  59 |     await expect(page.getByRole('button', { name: 'Generate & Apply' })).toBeVisible();
  60 |     await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  61 |   });
  62 |
  63 | }); 
```