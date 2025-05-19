const { test, expect } = require('@playwright/test');

test.describe('Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000'); // Adjust if your app runs on a different port
  });

  test('should load the home page and display initial elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Smart Case Lab' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload JSON File' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Paste JSON Data' })).toBeVisible();
    await expect(page.getByPlaceholder('Paste your JSON here...')).toBeVisible();
  });

  const sampleJsonString = JSON.stringify({
    "id": 1,
    "name": "Test Item",
    "details": {
      "price": 100,
      "stock": 10
    },
    "tags": ["tag1", "tag2"]
  }, null, 2);

  const sampleJsonHeaders = ['id', 'name', 'details.price', 'details.stock', 'tags.0', 'tags.1'];
  const manualHeaders = ['Manual Column 1'];

  test('should allow pasting JSON and generate table', async ({ page }) => {
    await page.getByPlaceholder('Paste your JSON here...').fill(sampleJsonString);
    await page.getByRole('button', { name: 'Process Pasted JSON' }).click();

    // Wait for table to appear (you might need a more specific loader/spinner check if applicable)
    await expect(page.getByRole('heading', { name: 'Generated Test Cases Table' })).toBeVisible({ timeout: 10000 });
    
    // Check for Test Case Name header + JSON headers
    await expect(page.getByRole('columnheader', { name: 'Test Case Name' })).toBeVisible();
    for (const header of sampleJsonHeaders) {
      // Header text in UI often has spaces and capitalization
      const formattedHeader = header.replace(/\./g, ' ').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      await expect(page.getByRole('columnheader', { name: new RegExp(formattedHeader, 'i') })).toBeVisible();
    }

    // Check for the first row (index 0 for Playwright locators)
    await expect(page.getByRole('row').nth(1)).toBeVisible(); // nth(0) is header row, nth(1) is first data row
    await expect(page.getByRole('cell', { name: 'TC_01' })).toBeVisible();
  });

  test('should allow adding a manual column', async ({ page }) => {
    // First, process some JSON to have a table
    await page.getByPlaceholder('Paste your JSON here...').fill(sampleJsonString);
    await page.getByRole('button', { name: 'Process Pasted JSON' }).click();
    await expect(page.getByRole('heading', { name: 'Generated Test Cases Table' })).toBeVisible();

    await page.getByPlaceholder('New Column Name').fill(manualHeaders[0]);
    await page.getByRole('button', { name: 'Add Custom Column' }).click();

    await expect(page.getByText('Custom column "Manual Column 1" added.')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Manual Column 1' })).toBeVisible();

    // Check if the new manual column appears in the first data row (should be empty by default)
    const firstDataRow = page.getByRole('row').nth(1);
    // Find the index of the 'Manual Column 1' header
    const headers = await page.getByRole('columnheader').allTextContents();
    const manualColIndex = headers.findIndex(h => h.trim() === 'Manual Column 1');
    expect(manualColIndex).toBeGreaterThan(-1);

    // The cell in the first data row for the new manual column
    // Cell indexing: Actions (0), Test Case Name (1), Manual Column 1 (2 in this case if it's first manual)
    // This depends on exact column order. Let's assume it's added after 'Test Case Name'
    const manualCellInRow = firstDataRow.getByRole('cell').nth(manualColIndex); // Indexing can be tricky
    await expect(manualCellInRow.locator('input[type="text"]')).toHaveValue('');
  });

  test('should allow adding and deleting rows', async ({ page }) => {
    // Process JSON to enable Add Row button
    await page.getByPlaceholder('Paste your JSON here...').fill(sampleJsonString);
    await page.getByRole('button', { name: 'Process Pasted JSON' }).click();
    await expect(page.getByRole('heading', { name: 'Generated Test Cases Table' })).toBeVisible();

    // Initial row count (header + 1 data row)
    await expect(page.getByRole('row')).toHaveCount(2);

    await page.getByRole('button', { name: 'Add New Row' }).click();
    await expect(page.getByRole('row')).toHaveCount(3);
    await expect(page.getByRole('cell', { name: 'TC_02' })).toBeVisible();

    // Delete the second data row (TC_02)
    // Rows are 0-indexed in getByRole('row').nth(). Header is 0. TC_01 is 1. TC_02 is 2.
    const rowToDelete = page.getByRole('row').nth(2);
    await rowToDelete.getByRole('button', { name: 'Delete' }).click();
    
    // Confirm deletion (if there's a confirm dialog, handle it)
    // For now, assuming direct deletion based on current app behavior
    // await page.on('dialog', dialog => dialog.accept()); // If a native confirm dialog appears

    await expect(page.getByRole('row')).toHaveCount(2);
    await expect(page.getByRole('cell', { name: 'TC_02' })).not.toBeVisible();
    await expect(page.getByRole('cell', { name: 'TC_01' })).toBeVisible();
  });

}); 