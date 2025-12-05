/**
 * Network error detection and handling utilities
 */

export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  const message = error?.message || '';
  return (
    message === 'Failed to fetch' ||
    message.includes('NetworkError') ||
    message.includes('network') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ERR_NETWORK') ||
    error?.name === 'TypeError' && message === 'Failed to fetch'
  );
};

export const getErrorMessage = (error: any): string => {
  if (isNetworkError(error)) {
    return 'Network connection issue. Please check your internet and try again.';
  }
  return error?.message || 'An unexpected error occurred';
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Only retry on network errors
      if (!isNetworkError(error) || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
