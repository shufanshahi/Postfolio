import React, { useState } from 'react';
import { Check, X, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

const MCQViewer = ({ mcqSet, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const calculateScore = () => {
    if (!mcqSet || !mcqSet.questions) return 0;

    let correct = 0;
    mcqSet.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  if (showResults) {
    const score = calculateScore();
    const totalQuestions = mcqSet?.questions?.length || 0;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="pointer-events-none select-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-10 h-[32rem] w-[32rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
          <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
        </div>
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-teal-900/10 dark:border-slate-700/60 shadow-sm p-8">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${percentage >= 70 ? 'bg-green-100 text-green-600' :
                percentage >= 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                }`}>
                <span className="text-2xl font-bold">{percentage}%</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Quiz Complete!</h2>
              <p className="text-slate-600 dark:text-slate-400">You scored {score} out of {totalQuestions} questions</p>
            </div>

            <div className="space-y-6 mb-8">
              {mcqSet?.questions?.map((question, index) => (
                <div key={`question-${index}`} className="p-6 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium text-slate-800 dark:text-slate-100 flex-1">
                      {index + 1}. {question.question}
                    </h3>
                    <div className={`ml-4 px-2 py-1 rounded text-sm font-medium ${selectedAnswers[index] === question.correctAnswer
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {selectedAnswers[index] === question.correctAnswer ? 'Correct' : 'Wrong'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {['A', 'B', 'C', 'D'].map(option => (
                      <div
                        key={`option-${index}-${option}`}
                        className={`p-3 rounded-lg border text-sm leading-relaxed ${option === question.correctAnswer
                          ? 'bg-green-50 border-green-200'
                          : selectedAnswers[index] === option && option !== question.correctAnswer
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white/60 dark:bg-slate-900/30 border-teal-900/10 dark:border-slate-700/60'
                          }`}
                      >
                        <span className="font-medium">{option}. </span>
                        {question[`option${option}`]}
                        {option === question.correctAnswer && (
                          <Check className="inline ml-2 h-4 w-4 text-green-600" />
                        )}
                        {selectedAnswers[index] === option && option !== question.correctAnswer && (
                          <X className="inline ml-2 h-4 w-4 text-red-600" />
                        )}
                      </div>
                    ))}
                  </div>

                  {question.explanation && (
                    <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200/70 dark:border-indigo-500/30">
                      <h4 className="font-medium text-indigo-700 dark:text-indigo-300 mb-2">Explanation:</h4>
                      <p className="text-indigo-600 dark:text-indigo-300 text-sm leading-relaxed">{question.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={onBack}
                className="flex-1 h-11 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium shadow-sm transition-colors"
              >
                Back to Preparation Hub
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add null checks for mcqSet and questions
  if (!mcqSet || !mcqSet.questions || mcqSet.questions.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="pointer-events-none select-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-10 h-[32rem] w-[32rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
          <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
        </div>
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-teal-900/10 dark:border-slate-700/60 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">No Questions Available</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">There are no questions to display in this MCQ set.</p>
              <button
                onClick={onBack}
                className="h-11 px-8 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium shadow-sm transition-colors"
              >
                Back to Preparation Hub
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = mcqSet.questions[currentQuestion];

  // Additional check for current question
  if (!question) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="pointer-events-none select-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-10 h-[32rem] w-[32rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
          <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
        </div>
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-teal-900/10 dark:border-slate-700/60 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Question Not Found</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">The current question could not be loaded.</p>
              <button
                onClick={onBack}
                className="h-11 px-8 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium shadow-sm transition-colors"
              >
                Back to Preparation Hub
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[32rem] w-[32rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-teal-900/10 dark:border-slate-700/60 shadow-sm">
          <div className="p-6 border-b border-teal-900/10 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </button>
              <div className="text-right">
                <p className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400 uppercase">Question {currentQuestion + 1} of {mcqSet?.questions?.length || 0}</p>
                <div className="w-64 h-2 mt-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / (mcqSet?.questions?.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">{mcqSet.documentName}</h2>
          </div>
          <div className="p-8 space-y-8">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
              {question.question}
            </h3>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map(option => (
                <button
                  key={`current-${option}`}
                  onClick={() => handleAnswerSelect(currentQuestion, option)}
                  className={`w-full text-left p-4 rounded-xl border text-sm leading-relaxed transition-colors backdrop-blur ${selectedAnswers[currentQuestion] === option
                    ? 'bg-indigo-50/80 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/40 text-indigo-800 dark:text-indigo-200'
                    : 'bg-white/60 dark:bg-slate-900/40 border-teal-900/10 dark:border-slate-700/60 hover:border-indigo-400/50 dark:hover:border-indigo-400/40'
                    }`}
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{option}. </span>
                  <span className="text-slate-700 dark:text-slate-300">{question[`option${option}`]}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                disabled={currentQuestion === 0}
                className="h-11 px-6 rounded-full bg-slate-300 text-slate-700 hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                Previous
              </button>
              {currentQuestion < (mcqSet?.questions?.length || 0) - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="h-11 px-8 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => setShowResults(true)}
                  className="h-11 px-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCQViewer;