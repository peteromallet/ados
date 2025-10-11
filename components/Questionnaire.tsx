'use client'

import { useState, useEffect } from 'react'
import { Question } from '@/lib/types'
import { QuestionStep } from './QuestionStep'
import { ProgressBar } from './ui/ProgressBar'
import { Button } from './ui/Button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface QuestionnaireProps {
  questions: Question[]
  onSubmit: (answers: { question_id: string; answer_text: string }[]) => Promise<void>
  isUpdating?: boolean
  inviteName?: string
}

export function Questionnaire({ questions, onSubmit, isUpdating = false, inviteName }: QuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Generate a unique storage key based on first question ID (event-specific)
  const storageKey = questions.length > 0 ? `questionnaire_${questions[0].event_id}` : null

  // Load saved answers on mount
  useEffect(() => {
    if (!storageKey) return
    
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsedAnswers = JSON.parse(saved)
        setAnswers(parsedAnswers)
        
        // If updating and has saved answers, jump to summary
        if (isUpdating && Object.keys(parsedAnswers).length > 0) {
          setShowSummary(true)
        }
      }
    } catch (error) {
      console.error('Failed to load saved answers:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [storageKey, isUpdating])

  // Auto-save answers whenever they change
  useEffect(() => {
    if (!storageKey || !isLoaded) return
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers))
    } catch (error) {
      console.error('Failed to save answers:', error)
    }
  }, [answers, storageKey, isLoaded])

  // Filter questions based on conditional logic
  const getVisibleQuestions = () => {
    const visible: Question[] = []
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      
      // Skip first question if user came via invite
      if (i === 0 && inviteName) {
        continue
      }
      
      // Check if this is the conditional travel location question
      if (question.question_text.toLowerCase().includes('where will you travel from')) {
        // Only show if they need travel support
        const travelSupportAnswer = Object.entries(answers).find(([id, _]) => {
          const q = questions.find(q => q.id === id)
          return q?.question_text.toLowerCase().includes('travel support')
        })
        if (travelSupportAnswer && travelSupportAnswer[1] === 'No') {
          continue // Skip this question
        }
      }
      visible.push(question)
    }
    return visible
  }

  const visibleQuestions = getVisibleQuestions()
  const currentQuestion = visibleQuestions[currentStep]

  const validateCurrentQuestion = () => {
    const answer = answers[currentQuestion.id] || ''
    
    if (currentQuestion.is_required && !answer.trim()) {
      setErrors({ ...errors, [currentQuestion.id]: 'This question is required' })
      return false
    }
    
    setErrors({ ...errors, [currentQuestion.id]: '' })
    return true
  }

  const handleNext = () => {
    if (validateCurrentQuestion()) {
      if (currentStep === visibleQuestions.length - 1) {
        setShowSummary(true)
      } else {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Only include answers for visible questions
    const formattedAnswers = visibleQuestions.map(question => ({
      question_id: question.id,
      answer_text: answers[question.id] || '',
    }))

    try {
      await onSubmit(formattedAnswers)
      
      // Clear saved answers after successful submission
      if (storageKey) {
        localStorage.removeItem(storageKey)
      }
    } catch (error) {
      console.error('Error submitting answers:', error)
      alert('There was an error submitting your application. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleEditAnswer = (stepIndex: number) => {
    setShowSummary(false)
    setCurrentStep(stepIndex)
  }

  const handleAnswerChange = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value })
    // Clear error when user starts typing
    if (errors[currentQuestion.id]) {
      setErrors({ ...errors, [currentQuestion.id]: '' })
    }
  }

  // Don't render until loaded to prevent flash
  if (!isLoaded) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-lg p-8 min-h-[400px] flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (showSummary) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Answers</h2>
          <p className="text-gray-600 mb-8">Please review your responses before submitting</p>

          <div className="space-y-6 mb-8">
            {visibleQuestions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{question.question_text}</h3>
                  <button
                    onClick={() => handleEditAnswer(index)}
                    className="text-sm text-blue-600 hover:text-blue-800 ml-4"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{answers[question.id] || '(No answer provided)'}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <Button
              onClick={() => setShowSummary(false)}
              variant="ghost"
              className="flex items-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>Back to questions</span>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (isUpdating ? 'Updating...' : 'Submitting...') : (isUpdating ? 'Update' : 'Submit')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      {inviteName && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-blue-500">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Accept Invitation</h3>
          <p className="text-gray-700">
            You signed up at an invite link belonging to <span className="font-semibold text-blue-600">{inviteName}</span>
          </p>
        </div>
      )}
      
      <ProgressBar
        current={currentStep + 1}
        total={visibleQuestions.length}
        className="mb-8"
      />

      <div className="bg-white rounded-lg shadow-lg p-8 min-h-[400px]">
        <QuestionStep
          question={currentQuestion}
          value={answers[currentQuestion.id] || ''}
          onChange={handleAnswerChange}
          error={errors[currentQuestion.id]}
        />

        <div className="flex justify-between mt-12">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="ghost"
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Previous</span>
          </Button>

          {currentStep === visibleQuestions.length - 1 ? (
            <Button
              onClick={handleNext}
              className="flex items-center space-x-2"
            >
              <span>Review answers</span>
              <ArrowRight size={20} />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight size={20} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

