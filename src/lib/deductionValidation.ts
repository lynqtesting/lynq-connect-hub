export interface DeductionValidationResult {
  isValid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  validFields: string[];
}

export interface ValidationMessage {
  field: string;
  message: string;
  suggestion?: string;
}

interface FieldSchema {
  type: 'number' | 'object' | 'array';
  label: string;
  min?: number;
  max?: number;
  optional?: boolean;
  requiredKeys?: string[];
}

const fieldSchemas: Record<string, FieldSchema> = {
  // Core required metrics
  STR_overall: { 
    type: 'number', 
    min: 0, 
    max: 1, 
    label: 'STR Score',
    optional: false 
  },
  engagement_rate_overall: { 
    type: 'number', 
    min: 0, 
    max: 1, 
    label: 'Engagement Rate',
    optional: false 
  },
  learning_progress_status: { 
    type: 'object', 
    label: 'Learning Progress Status',
    requiredKeys: ['Completed', 'In Progress', 'Not Started'],
    optional: false 
  },
  
  // Optional but validated if present
  productivity_time_saved_avg_hours: { 
    type: 'number', 
    min: 0, 
    label: 'Time Saved (hours)',
    optional: true 
  },
  'dropoff_rate_%': { 
    type: 'number', 
    min: 0, 
    max: 100, 
    label: 'Dropoff Rate (%)',
    optional: true 
  },
  num_rows: { 
    type: 'number', 
    min: 0, 
    label: 'Number of Rows',
    optional: true 
  },
  region_wise_STR: { 
    type: 'object', 
    label: 'Regional STR Data',
    optional: true 
  },
  client_objection_region_wise: { 
    type: 'object', 
    label: 'Client Objections by Region',
    optional: true 
  },
  cod_by_theme: { 
    type: 'object', 
    label: 'CSR Hotspots (Card Data)',
    optional: true 
  },
  cod_total_hits: { 
    type: 'number', 
    min: 0, 
    label: 'Total Card Hits',
    optional: true 
  },
  confusion_areas: { 
    type: 'array', 
    label: 'Confusion Areas',
    optional: true 
  },
};

// Check if a value looks like it should be a decimal but was passed as whole number
function detectPercentageAsWholeNumber(value: number, max: number): boolean {
  return max === 1 && value > 1 && value <= 100;
}

export function validateDeductionJson(data: any): DeductionValidationResult {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const validFields: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: 'Data must be a valid JSON object',
      suggestion: 'Ensure your file contains a valid JSON object with curly braces { }',
    });
    return { isValid: false, errors, warnings, validFields };
  }

  // Validate each field according to schema
  for (const [fieldName, schema] of Object.entries(fieldSchemas)) {
    const value = data[fieldName];
    
    // Check if required field is missing
    if (value === undefined || value === null) {
      if (!schema.optional) {
        errors.push({
          field: fieldName,
          message: `${schema.label} is required`,
          suggestion: getFieldExample(fieldName, schema),
        });
      } else {
        // Optional field missing - just a warning
        warnings.push({
          field: fieldName,
          message: `${schema.label} is not provided (optional)`,
          suggestion: getFieldExample(fieldName, schema),
        });
      }
      continue;
    }

    // Validate type
    if (schema.type === 'number') {
      if (typeof value !== 'number') {
        errors.push({
          field: fieldName,
          message: `${schema.label} should be a number, got ${typeof value}`,
          suggestion: typeof value === 'string' ? `Remove quotes: "${value}" → ${parseFloat(value) || 0}` : undefined,
        });
        continue;
      }

      // Check for percentage as whole number mistake
      if (schema.max !== undefined && detectPercentageAsWholeNumber(value, schema.max)) {
        errors.push({
          field: fieldName,
          message: `${schema.label} should be between 0 and 1 (you provided ${value})`,
          suggestion: `Did you mean ${(value / 100).toFixed(2)}? Values should be decimals (e.g., 0.72 for 72%)`,
        });
        continue;
      }

      // Check range
      if (schema.min !== undefined && value < schema.min) {
        errors.push({
          field: fieldName,
          message: `${schema.label} should be at least ${schema.min}, got ${value}`,
        });
        continue;
      }
      if (schema.max !== undefined && value > schema.max) {
        errors.push({
          field: fieldName,
          message: `${schema.label} should be at most ${schema.max}, got ${value}`,
          suggestion: schema.max === 1 ? `Values should be decimals (e.g., 0.72 for 72%)` : undefined,
        });
        continue;
      }
      
      validFields.push(fieldName);
    } else if (schema.type === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push({
          field: fieldName,
          message: `${schema.label} should be an object`,
          suggestion: getFieldExample(fieldName, schema),
        });
        continue;
      }

      // Check required keys for objects
      if (schema.requiredKeys) {
        const missingKeys: string[] = [];
        const alternateKeyMap: Record<string, string[]> = {
          'In Progress': ['In-Progress', 'InProgress', 'in_progress'],
          'Not Started': ['Not_Started', 'NotStarted', 'not_started'],
          'Completed': ['completed'],
        };

        for (const key of schema.requiredKeys) {
          const hasKey = value[key] !== undefined;
          const hasAlternate = alternateKeyMap[key]?.some(alt => value[alt] !== undefined);
          
          if (!hasKey && !hasAlternate) {
            missingKeys.push(key);
          }
        }

        if (missingKeys.length > 0) {
          warnings.push({
            field: fieldName,
            message: `${schema.label} is missing keys: ${missingKeys.join(', ')}`,
            suggestion: `Add the missing keys with numeric values (e.g., "${missingKeys[0]}": 50)`,
          });
        } else {
          validFields.push(fieldName);
        }
      } else {
        validFields.push(fieldName);
      }
    } else if (schema.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push({
          field: fieldName,
          message: `${schema.label} should be an array`,
          suggestion: getFieldExample(fieldName, schema),
        });
        continue;
      }
      validFields.push(fieldName);
    }
  }

  // Additional cross-field validations
  if (data.cod_by_theme && !data.cod_total_hits) {
    warnings.push({
      field: 'cod_total_hits',
      message: 'cod_by_theme is provided but cod_total_hits is missing',
      suggestion: 'Add "cod_total_hits" to calculate CSR Hotspot percentages correctly',
    });
  }

  // Check learning_progress_status values are numbers
  if (data.learning_progress_status && typeof data.learning_progress_status === 'object') {
    for (const [key, val] of Object.entries(data.learning_progress_status)) {
      if (typeof val !== 'number') {
        errors.push({
          field: `learning_progress_status.${key}`,
          message: `"${key}" should be a number, got ${typeof val}`,
          suggestion: typeof val === 'string' ? `Remove quotes: "${val}" → ${parseInt(val as string) || 0}` : undefined,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validFields,
  };
}

function getFieldExample(fieldName: string, schema: FieldSchema): string {
  switch (fieldName) {
    case 'STR_overall':
      return 'Add "STR_overall": 0.72 (value between 0 and 1, e.g., 0.72 = 72%)';
    case 'engagement_rate_overall':
      return 'Add "engagement_rate_overall": 0.85 (value between 0 and 1)';
    case 'learning_progress_status':
      return 'Add "learning_progress_status": { "Completed": 120, "In Progress": 80, "Not Started": 50 }';
    case 'productivity_time_saved_avg_hours':
      return 'Add "productivity_time_saved_avg_hours": 8.5 (hours saved)';
    case 'dropoff_rate_%':
      return 'Add "dropoff_rate_%": 12 (percentage value 0-100)';
    case 'region_wise_STR':
      return 'Add "region_wise_STR": { "North": 0.75, "South": 0.68 }';
    case 'client_objection_region_wise':
      return 'Add "client_objection_region_wise": { "North": { "Price": 15, "Quality": 10 } }';
    case 'cod_by_theme':
      return 'Add "cod_by_theme": { "Card_1_Quiz": 45, "Card_2_Info": 30 }';
    case 'confusion_areas':
      return 'Add "confusion_areas": [{ "label": "Pricing", "percentage": 35 }]';
    default:
      return `Add "${fieldName}" field`;
  }
}

// Helper to generate a sample template
export function generateSampleDeductionJson(): object {
  return {
    STR_overall: 0.72,
    engagement_rate_overall: 0.85,
    objective_score_overall: 0.78,
    productivity_time_saved_avg_hours: 8.5,
    'dropoff_rate_%': 12,
    num_rows: 250,
    learning_progress_status: {
      Completed: 120,
      'In Progress': 80,
      'Not Started': 50,
    },
    region_wise_STR: {
      North: 0.75,
      South: 0.68,
      East: 0.72,
      West: 0.80,
    },
    client_objection_region_wise: {
      North: { 'Price concerns': 15, 'Feature requests': 10 },
      South: { 'Support issues': 8, 'Integration needs': 5 },
    },
    cod_by_theme: {
      Card_1_Quiz: 45,
      Card_2_Info: 30,
      Card_3_Video: 25,
      Card_4_Assessment: 40,
    },
    cod_total_hits: 140,
    confusion_areas: [
      { label: 'Pricing Structure', percentage: 35 },
      { label: 'Feature Comparison', percentage: 28 },
      { label: 'Implementation Steps', percentage: 20 },
    ],
  };
}
