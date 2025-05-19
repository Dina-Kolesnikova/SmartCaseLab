import { faker } from '@faker-js/faker';

const generationRules = [
  { test: (colId) => colId.includes('email'), generate: faker.internet.email },
  { test: (colId) => colId.includes('name'), generate: faker.person.fullName },
  { test: (colId) => colId.includes('id') && !colId.includes('uuid'), generate: () => faker.string.alphanumeric({ length: 8, casing: 'upper' }) },
  { test: (colId) => colId.includes('uuid') || colId.includes('guid'), generate: faker.string.uuid },
  { test: (colId) => colId.includes('phone') || colId.includes('number'), generate: faker.phone.number }, // Note: 'number' is broad, might need refinement
  { test: (colId) => colId.includes('address'), generate: faker.location.streetAddress },
  { test: (colId) => colId.includes('city'), generate: faker.location.city },
  { test: (colId) => colId.includes('zip') || colId.includes('postal'), generate: faker.location.zipCode },
  { test: (colId) => colId.includes('country'), generate: faker.location.country },
  { test: (colId) => colId.includes('date'), generate: () => faker.date.past().toLocaleDateString() },
  { test: (colId) => colId.includes('url') || colId.includes('website'), generate: faker.internet.url },
  { test: (colId) => colId.includes('price') || colId.includes('amount'), generate: faker.commerce.price },
  { test: (colId) => colId.includes('description') || colId.includes('comment') || colId.includes('text'), generate: faker.lorem.sentence },
  // Add more specific rules above the default/fallback
];

export function generateDataForColumn(columnId) {
  if (columnId === 'Test Case Name') {
    return null; // Signal to keep existing value or handle specially in App.js
  }
  const lowerColumnId = columnId.toLowerCase();
  const rule = generationRules.find(r => r.test(lowerColumnId));

  if (rule) {
    return rule.generate();
  }
  return faker.lorem.words(3); // Default fallback
} 