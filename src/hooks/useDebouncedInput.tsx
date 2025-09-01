import { useState, useEffect, useCallback, useRef } from 'react';

interface DebouncedInputConfig {
  delay?: number;
  minLength?: number;
  maxLength?: number;
}

export function useDebouncedInput<T>(
  initialValue: T,
  onUpdate: (value: T) => void | Promise<any>,
  config: DebouncedInputConfig = {}
) {
  const { delay = 300, minLength = 0, maxLength = 10000 } = config;
  
  const [localValue, setLocalValue] = useState<T>(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<T>(initialValue);

  // Update local value when initial value changes (external updates)
  useEffect(() => {
    setLocalValue(initialValue);
    lastUpdateRef.current = initialValue;
  }, [initialValue]);

  // Debounced update function
  const debouncedUpdate = useCallback(
    async (value: T) => {
      // Skip if value hasn't actually changed
      if (value === lastUpdateRef.current) {
        return;
      }

      // Validate string length if applicable
      if (typeof value === 'string') {
        if (value.length < minLength || value.length > maxLength) {
          return;
        }
      }

      try {
        setIsUpdating(true);
        await onUpdate(value);
        lastUpdateRef.current = value;
      } catch (error) {
        console.error('Debounced update failed:', error);
        // Revert to last known good value on error
        setLocalValue(lastUpdateRef.current);
      } finally {
        setIsUpdating(false);
      }
    },
    [onUpdate, minLength, maxLength]
  );

  // Handle input changes with debouncing
  const handleChange = useCallback(
    (newValue: T) => {
      setLocalValue(newValue);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for debounced update
      timeoutRef.current = setTimeout(() => {
        debouncedUpdate(newValue);
      }, delay);
    },
    [debouncedUpdate, delay]
  );

  // Force immediate update
  const forceUpdate = useCallback(
    async (value?: T) => {
      const valueToUpdate = value !== undefined ? value : localValue;
      
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      await debouncedUpdate(valueToUpdate);
    },
    [localValue, debouncedUpdate]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    value: localValue,
    isUpdating,
    handleChange,
    forceUpdate,
    hasChanges: localValue !== lastUpdateRef.current
  };
}