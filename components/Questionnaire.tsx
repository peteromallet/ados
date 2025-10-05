'use client'

import { useState } from 'react'
import { Question } from '@/lib/types'
import { QuestionStep } from './QuestionStep'
import { ProgressBar } from './ui/ProgressBar'
import { Button } from './ui/Button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface QuestionnaireProps {
  questions: Question[]
  onSubmit: (answers: { question_id: string; answer_text: string }[]) => Promise<void>
}

export function Questionnaire({ questions, onSubmit }: QuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  // Filter questions based on conditional logic
  const getVisibleQuestions = () => {
    const visible: Question[] = []
    for (const question of questions) {
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
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <ProgressBar
        current={currentStep + 1}
        total={visibleQuestions.length}
        className="mb-12"
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

