import { cn } from '@/utils/cn';
import { FieldError } from 'react-hook-form';

interface WrapperProps {
  children: React.ReactNode;
  labelValue?: string;
  className?: string;
  error?: FieldError | undefined;
}

function FieldWrapper({
  labelValue,
  className,
  error,
  children,
}: WrapperProps) {
  return (
    <div>
      <label
        className={cn(
          'ml-1 text-sm font-medium leading-none text-neutral-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
      >
        {labelValue}
      </label>

      {children}

      {error?.message && (
        <div
          role="alert"
          aria-label={error.message}
          className="absolute ml-1 mt-1 text-xs font-normal text-red-600"
        >
          {error.message}
        </div>
      )}
    </div>
  );
}

export type WrapperPassThroughProps = Omit<
  WrapperProps,
  'className' | 'children'
>;
export default FieldWrapper;
