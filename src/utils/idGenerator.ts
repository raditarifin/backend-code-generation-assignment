import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a new UUID v4
 * @returns {string} A new UUID string
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Validates if a string is a valid UUID
 * @param {string} id - The string to validate
 * @returns {boolean} True if valid UUID, false otherwise
 */
export const isValidUuid = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Generates a short ID (first 8 characters of UUID)
 * Useful for display purposes
 * @returns {string} A short ID string
 */
export const generateShortId = (): string => {
  return uuidv4().substring(0, 8);
};

export default {
  generateId,
  isValidUuid,
  generateShortId,
};
