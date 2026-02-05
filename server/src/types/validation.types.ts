export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidationResult {
  field: string;
  isValid: boolean;
  message?: string;
}
