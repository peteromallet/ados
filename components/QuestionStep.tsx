'use client'

import { Question } from '@/lib/types'
import { Input, Textarea } from '@/components/ui/Input'

interface QuestionStepProps {
  question: Question
  value: string
  onChange: (value: string) => void
  error?: string
}

export function QuestionStep({ question, value, onChange, error }: QuestionStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold text-text-dark mb-2">
          {question.question_text}
        </h2>
        {question.is_required && (
          <span className="text-sm text-red-500">* Required</span>
        )}
      </div>

      {question.question_type === 'textarea' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          rows={6}
          placeholder="Type your answer here..."
          className="text-lg"
        />
      ) : question.question_type === 'multiple_select' && question.options ? (
        <div className="space-y-3">
          {(question.options as string[]).map((option) => {
            const selectedValues = value ? value.split(',') : []
            const isChecked = selectedValues.includes(option)
            
            const handleCheckboxChange = (checked: boolean) => {
              let newValues: string[]
              if (checked) {
                newValues = [...selectedValues, option]
              } else {
                newValues = selectedValues.filter(v => v !== option)
              }
              onChange(newValues.join(','))
            }
            
            return (
              <label
                key={option}
                className="flex items-center space-x-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(e.target.checked)}
                  className="w-5 h-5 text-primary rounded"
                />
                <span className="text-lg">{option}</span>
              </label>
            )
          })}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      ) : question.question_type === 'multiple_choice' && question.options ? (
        <div className="space-y-3">
          {(question.options as string[]).map((option) => (
            <label
              key={option}
              className="flex items-center space-x-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                className="w-5 h-5 text-primary"
              />
              <span className="text-lg">{option}</span>
            </label>
          ))}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          placeholder="Type your answer here..."
          className="text-lg"
        />
      )}
    </div>
  )
}

