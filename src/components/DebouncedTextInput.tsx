import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDebouncedInput } from '@/hooks/useDebouncedInput';
import { Loader2 } from 'lucide-react';

interface DebouncedTextInputProps {
  value: string;
  onChange: (value: string) => void | Promise<any>;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
  delay?: number;
}

export function DebouncedTextInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  disabled = false,
  className,
  id,
  delay = 300
}: DebouncedTextInputProps) {
  const {
    value: localValue,
    isUpdating,
    handleChange,
    hasChanges
  } = useDebouncedInput(value, onChange, { delay });

  const inputProps = {
    id,
    value: localValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      handleChange(e.target.value),
    placeholder,
    disabled: disabled || isUpdating,
    className: `${className || ''} ${hasChanges ? 'border-amber-300' : ''} ${isUpdating ? 'opacity-75' : ''}`.trim()
  };

  return (
    <div className="relative">
      {multiline ? (
        <Textarea {...inputProps} rows={rows} />
      ) : (
        <Input {...inputProps} />
      )}
      
      {isUpdating && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {hasChanges && !isUpdating && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        </div>
      )}
    </div>
  );
}