# 🧠 SmartCaseLab – Software Specification

**Project Name:** SmartCaseLab  
**Description:** A smart web UI tool that transforms JSON API request payloads into structured test cases for automation testing in Postman. Supports value generation (auto/manual), nested key handling, CSV/JSON export, and draft saving.

---

## 🚀 Overview

SmartCaseLab is a web-based application that allows QA testers to:
- Upload or paste a JSON request payload
- Automatically generate a table of test cases (each key becomes a column)
- Fill test values manually or via auto-generation (random or boundary-based)
- Save work-in-progress locally as drafts
- Export data in formats compatible with Postman Runner: JSON and CSV
- Eventually generate Postman-compatible requests with variables

---

## 📦 Technology Stack

| Component       | Technology             |
|----------------|------------------------|
| Frontend       | React.js (with Hooks)  |
| Styling        | Tailwind CSS           |
| State Mgmt     | useReducer or Context API |
| Persistence    | LocalStorage / IndexedDB |
| Data Gen       | faker.js + custom rules |
| CSV Parsing    | PapaParse              |
| JSON Utils     | Custom flattener or `json-to-flat`

---

## 🧩 Key Features

### 1. Home Page UI
- Upload JSON File (via file picker)
- Paste JSON Data (via textarea)
- Validate JSON format
- Store uploaded/pasted JSON for next step

### 2. JSON Analysis & Table Generation
- Flatten nested objects (e.g., `pickup_info.name`)
- Handle arrays using indexed keys (e.g., `cars[0].VIN`)
- Generate dynamic table:
  - Each key → a column
  - Each row → a test case
- Include a `Test Case Name` column (editable)

### 3. Test Data Entry
- Manually editable cells
- Support "Test Case Name" manual entry (default auto-generated as `TC_1`, `TC_2`...)

### 4. Auto Data Generation per Field
- Use `faker.js` or internal generators
- Generate data per column
  - Types: string, number, email, boolean, date, VIN, etc.
  - Edge cases: empty, max length, special characters
- Auto-fill all rows in that column
- Generated data stays editable

### 5. Field Rules (Reusable)
- Allow users to configure presets for certain fields
  - Example: `price` → int between 100 and 1000
  - Example: `VIN` → 17-char uppercase
- Rules saved in LocalStorage
- Auto-generation follows configured rules

### 6. Row Management
- Add Row button
- Delete Row button
- Dynamic row updates

### 7. Save/Load Draft (Local)
- Save current state (columns, rows, field rules) in LocalStorage
- Load saved draft to resume work

### 8. Export Features
#### Export JSON:
- Match structure of original input (not flattened)
- Convert rows into objects with original schema
- Handle arrays properly (`cars` as array of objects)

#### Export CSV:
- Flattened keys as hea
