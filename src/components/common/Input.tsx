import { cn } from '@/utils/cn';
import { UseFormRegisterReturn } from 'react-hook-form';
import FieldWrapper, { WrapperPassThroughProps } from './FieldWrapper';

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    WrapperPassThroughProps {
  register?: UseFormRegisterReturn;
  type?: 'text' | 'number' | 'email' | 'password' | 'decimal' | 'date';
  className?: string;
}

function Input({
  type = 'text',
  labelValue,
  register,
  error,
  className,
  ...rest
}: InputProps) {
  function onKey(event: React.KeyboardEvent<HTMLInputElement>) {
    const key = event.key;

    const isNumeric = /^[0-9]$/.test(key);
    const isDecimalSeparator = key === '.' || key === ',';
    const isBackspace = key === 'Backspace';

    if (!(isNumeric || isDecimalSeparator || isBackspace)) {
      event.preventDefault();
    }

    // Allow only one decimal separator
    if (
      isDecimalSeparator &&
      (rest.value?.toString().includes('.') ||
        rest.value?.toString().includes(','))
    ) {
      event.preventDefault();
    }
  }

  return (
    <FieldWrapper labelValue={labelValue} error={error}>
      {type != 'decimal' ? (
        <input
          type={type}
          className={cn(
            className ||
              'radius-2xl shadow-input focus:shadow-input-focus/50 h-12 w-full rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-800 placeholder-neutral-400 transition-colors duration-200 ease-in-out focus:border-[#4d3c64]'
          )}
          {...register}
          {...rest}
        />
      ) : (
        <input
          type="string"
          onKeyDown={(e) => onKey(e)}
          className={cn(
            className ||
              'radius-2xl shadow-input focus:shadow-input-focus/50 h-12 w-full rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-800 placeholder-neutral-400 transition-colors duration-200 ease-in-out focus:border-[#4d3c64]'
          )}
          {...register}
          {...rest}
        />
      )}
    </FieldWrapper>
  );
}

export default Input;
