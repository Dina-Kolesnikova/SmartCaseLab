import { faker } from '@faker-js/faker';

export const generateTestData = (rules) => {
  const { dataType, minValue, maxValue, enumValues, numberOfCases, booleanValue, nullProbability, stringLength, arrayLength, objectKeys, removeField, removeObject } = rules;
  const results = [];

  // If field should be removed, return array of undefined values
  if (removeField || removeObject) {
    return Array(numberOfCases).fill(undefined);
  }

  for (let i = 0; i < numberOfCases; i++) {
    let value;

    // Handle null probability first
    if (dataType === 'null' || (nullProbability && Math.random() * 100 < nullProbability)) {
      value = null;
    } else {
      switch (dataType) {
        case 'string':
          const minLength = stringLength?.min || 1;
          const maxLength = stringLength?.max || 10;
          value = faker.lorem.word({ length: { min: minLength, max: maxLength } });
          break;

        case 'number':
          const min = parseFloat(minValue) || 0;
          const max = parseFloat(maxValue) || 100;
          value = faker.number.float({ min, max, precision: 0.01 });
          break;

        case 'date':
          const startDate = minValue ? new Date(minValue) : new Date('2020-01-01');
          const endDate = maxValue ? new Date(maxValue) : new Date();
          value = faker.date.between({ from: startDate, to: endDate }).toISOString().split('T')[0];
          break;

        case 'email':
          value = faker.internet.email();
          break;

        case 'enum':
          const values = enumValues.split(',').map(v => v.trim()).filter(Boolean);
          value = values[Math.floor(Math.random() * values.length)];
          break;

        case 'boolean':
          if (booleanValue === 'random') {
            value = faker.datatype.boolean();
          } else {
            value = booleanValue === 'true';
          }
          break;

        case 'array':
          const minArrayLength = arrayLength?.min || 1;
          const maxArrayLength = arrayLength?.max || 5;
          const length = faker.number.int({ min: minArrayLength, max: maxArrayLength });
          value = Array.from({ length }, () => faker.lorem.word());
          break;

        case 'object':
          const keys = objectKeys.split(',').map(k => k.trim()).filter(Boolean);
          value = keys.reduce((obj, key) => {
            obj[key] = faker.lorem.word();
            return obj;
          }, {});
          break;

        case 'uuid':
          value = faker.string.uuid();
          break;

        case 'phone':
          value = faker.phone.number();
          break;

        case 'url':
          value = faker.internet.url();
          break;

        case 'ip':
          value = faker.internet.ip();
          break;

        case 'color':
          value = faker.internet.color();
          break;

        case 'json':
          value = JSON.stringify({
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            date: faker.date.past().toISOString()
          });
          break;

        default:
          value = faker.lorem.word();
      }
    }

    results.push(value);
  }

  return results;
};

export const detectFieldType = (fieldName, sampleValue) => {
  // Convert field name to lowercase for easier matching
  const fieldNameLower = fieldName.toLowerCase();

  // Check field name patterns
  if (fieldNameLower.includes('date') || fieldNameLower.includes('time')) {
    return 'date';
  }
  if (fieldNameLower.includes('email')) {
    return 'email';
  }
  if (fieldNameLower.includes('price') || fieldNameLower.includes('amount') || fieldNameLower.includes('cost')) {
    return 'number';
  }
  if (fieldNameLower.includes('status') || fieldNameLower.includes('type')) {
    return 'enum';
  }
  if (fieldNameLower.includes('is_') || fieldNameLower.includes('has_') || fieldNameLower.includes('should_')) {
    return 'boolean';
  }
  if (fieldNameLower.includes('uuid') || fieldNameLower.includes('guid')) {
    return 'uuid';
  }
  if (fieldNameLower.includes('phone') || fieldNameLower.includes('mobile')) {
    return 'phone';
  }
  if (fieldNameLower.includes('url') || fieldNameLower.includes('website')) {
    return 'url';
  }
  if (fieldNameLower.includes('ip')) {
    return 'ip';
  }
  if (fieldNameLower.includes('color')) {
    return 'color';
  }

  // Check sample value type
  if (sampleValue) {
    if (typeof sampleValue === 'number') {
      return 'number';
    }
    if (sampleValue instanceof Date || !isNaN(Date.parse(sampleValue))) {
      return 'date';
    }
    if (typeof sampleValue === 'string' && sampleValue.includes('@')) {
      return 'email';
    }
    if (typeof sampleValue === 'boolean') {
      return 'boolean';
    }
    if (Array.isArray(sampleValue)) {
      return 'array';
    }
    if (typeof sampleValue === 'object' && sampleValue !== null) {
      return 'object';
    }
    if (sampleValue === null) {
      return 'null';
    }
  }

  // Default to string if no specific type is detected
  return 'string';
}; 