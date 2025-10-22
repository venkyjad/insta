'use client';

import { useState } from 'react';
import type { RepurposingGoal, TargetPlatform, ContentTone, VisualPreference } from '@/lib/types';
import {
  PLATFORM_CONFIGS,
  GOAL_LABELS,
  TONE_LABELS,
  TONE_DESCRIPTIONS,
  VISUAL_PREFERENCE_LABELS,
  LANGUAGES,
} from '@/lib/repurposing-config';

interface RepurposingWizardProps {
  originalTranscript: string;
  originalCaption?: string;
  originalHashtags?: string[];
  onGenerate: (data: RepurposingFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface RepurposingFormData {
  goal: RepurposingGoal;
  targetPlatform: TargetPlatform;
  tone: ContentTone;
  visualPreference: VisualPreference;
  targetLanguage?: string;
  customInstructions?: string;
}

type Step = 'goal' | 'platform' | 'tone' | 'visual' | 'review';

export default function RepurposingWizard({
  originalTranscript,
  originalCaption,
  originalHashtags,
  onGenerate,
  onCancel,
  isLoading = false,
}: RepurposingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('goal');
  const [formData, setFormData] = useState<Partial<RepurposingFormData>>({});

  const steps: Step[] = ['goal', 'platform', 'tone', 'visual', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSubmit = () => {
    if (
      formData.goal &&
      formData.targetPlatform &&
      formData.tone &&
      formData.visualPreference
    ) {
      onGenerate(formData as RepurposingFormData);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'goal':
        return !!formData.goal;
      case 'platform':
        return !!formData.targetPlatform;
      case 'tone':
        return !!formData.tone;
      case 'visual':
        return !!formData.visualPreference;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header with Progress */}
      <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Repurpose Content</h2>
            <p className="text-sm text-neutral-400">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-all"
          >
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-800 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentStep === 'goal' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What do you want to do with this Reel?</h3>
              <p className="text-sm text-neutral-400">Choose your repurposing goal</p>
            </div>

            <div className="space-y-3">
              {Object.entries(GOAL_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFormData({ ...formData, goal: value as RepurposingGoal })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    formData.goal === value
                      ? 'border-white bg-neutral-900 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{label}</span>
                    {formData.goal === value && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {formData.goal === 'repost-language' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-white mb-2">Target Language</label>
                <select
                  value={formData.targetLanguage || ''}
                  onChange={(e) => setFormData({ ...formData, targetLanguage: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="">Select language...</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {currentStep === 'platform' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Target Platform</h3>
              <p className="text-sm text-neutral-400">
                Each platform has unique characteristics and best practices
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(PLATFORM_CONFIGS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFormData({ ...formData, targetPlatform: key as TargetPlatform })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.targetPlatform === key
                      ? 'border-white bg-neutral-900'
                      : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white">{config.name}</h4>
                    {formData.targetPlatform === key && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="space-y-2 text-xs text-neutral-400">
                    <p>
                      <span className="font-medium text-neutral-300">Duration:</span> {config.idealDuration}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-300">Tone:</span> {config.tone}
                    </p>
                    <p className="text-[11px] leading-relaxed">{config.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'tone' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Tone & Emotion</h3>
              <p className="text-sm text-neutral-400">
                What tone do you want in the repurposed version?
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(TONE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFormData({ ...formData, tone: value as ContentTone })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.tone === value
                      ? 'border-white bg-neutral-900 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-center">
                    <p className="font-medium text-sm mb-1">{label}</p>
                    <p className="text-[10px] text-neutral-500">
                      {TONE_DESCRIPTIONS[value]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'visual' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Visual Preference</h3>
              <p className="text-sm text-neutral-400">
                What kind of visuals should accompany this repurpose?
              </p>
            </div>

            <div className="space-y-3">
              {Object.entries(VISUAL_PREFERENCE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFormData({ ...formData, visualPreference: value as VisualPreference })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    formData.visualPreference === value
                      ? 'border-white bg-neutral-900 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{label}</span>
                    {formData.visualPreference === value && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Custom Instructions (Optional)
              </label>
              <textarea
                value={formData.customInstructions || ''}
                onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                placeholder="Add any specific requirements or preferences..."
                rows={4}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white resize-none"
              />
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Review Your Choices</h3>
              <p className="text-sm text-neutral-400">
                Make sure everything looks good before generating
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Goal</p>
                  <p className="text-sm text-white font-medium">
                    {formData.goal && GOAL_LABELS[formData.goal]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Platform</p>
                  <p className="text-sm text-white font-medium">
                    {formData.targetPlatform && PLATFORM_CONFIGS[formData.targetPlatform].name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Tone</p>
                  <p className="text-sm text-white font-medium">
                    {formData.tone && TONE_LABELS[formData.tone]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Visual Style</p>
                  <p className="text-sm text-white font-medium">
                    {formData.visualPreference && VISUAL_PREFERENCE_LABELS[formData.visualPreference]}
                  </p>
                </div>
              </div>

              {formData.targetLanguage && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Target Language</p>
                  <p className="text-sm text-white font-medium">
                    {LANGUAGES.find((l) => l.code === formData.targetLanguage)?.name}
                  </p>
                </div>
              )}

              {formData.customInstructions && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Custom Instructions</p>
                  <p className="text-sm text-neutral-300">{formData.customInstructions}</p>
                </div>
              )}
            </div>

            <div className="bg-blue-950 border border-blue-900 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                <span className="font-semibold">Ready to generate!</span> AI will analyze your original content
                and create a tailored version based on your selections.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 border-t border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={currentStepIndex === 0 ? onCancel : handleBack}
            className="px-4 py-2 text-neutral-400 hover:text-white transition-all"
          >
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </button>

          {currentStep === 'review' ? (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Content'
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
