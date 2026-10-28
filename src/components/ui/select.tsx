import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ReactNode } from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string; icon?: ReactNode }[];
  label: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  label,
  id,
  disabled,
  className = '',
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        id={id}
        className={`select-trigger ${className}`}
        aria-label={label}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon>
          <ChevronDown size={14} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="select-content"
          position="popper"
          sideOffset={6}
          collisionPadding={12}
        >
          <SelectPrimitive.ScrollUpButton className="select-scroll">
            <ChevronUp size={14} />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="select-viewport">
            {options.map((option) => (
              <SelectPrimitive.Item
                className="select-item"
                value={option.value}
                key={option.value}
              >
                <SelectPrimitive.ItemText>
                  <span className="select-option">
                    {option.icon && <span aria-hidden="true">{option.icon}</span>}
                    {option.label}
                  </span>
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check size={14} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="select-scroll">
            <ChevronDown size={14} />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
