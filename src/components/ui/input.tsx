import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          className={`
            w-full rounded-lg border bg-white px-4 py-3 text-sm transition duration-300 
            ease-in-out placeholder:text-gray-500 focus:outline-none 
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:border-gray-700 dark:bg-gray-800 dark:ring-offset-gray-800 
            dark:placeholder-gray-400 dark:focus:ring-blue-400 
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="absolute text-sm text-red-500 left-0 bottom-[-20px]">
            Please correct this field.
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
