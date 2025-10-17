import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isDark?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isDark = false, children, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: isDark 
        ? 'bg-yellow-50 text-black hover:bg-yellow-100' 
        : 'bg-gray-800 text-white hover:bg-gray-700',
      secondary: isDark
        ? 'bg-black text-white border-2 border-white hover:bg-gray-900'
        : 'bg-white text-primary border-2 border-primary hover:bg-gray-50',
      ghost: isDark
        ? 'bg-transparent text-white hover:bg-white/10'
        : 'bg-transparent text-primary hover:bg-gray-100',
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

