import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-dark mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors bg-white text-gray-900 placeholder:text-gray-400 ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  rows?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, rows = 4, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-dark mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none bg-white text-gray-900 placeholder:text-gray-400 ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

