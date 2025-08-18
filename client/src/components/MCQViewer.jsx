import React, { useState } from 'react';
import { Check, X, ArrowLeft } from 'lucide-react';

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
    const percentage = Math.round((score / mcqSet.questions.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                percentage >= 70 ? 'bg-green-100 text-green-600' : 
                percentage >= 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
              }`}>
                <span className="text-2xl font-bold">{percentage}%</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
              <p className="text-gray-600">You scored {score} out of {mcqSet.questions.length} questions</p>
            </div>

            <div className="space-y-6 mb-8">
              {mcqSet.questions.map((question, index) => (
                <div key={`question-${index}`} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium text-gray-800 flex-1">
                      {index + 1}. {question.question}
                    </h3>
                    <div className={`ml-4 px-2 py-1 rounded text-sm font-medium ${
                      selectedAnswers[index] === question.correctAnswer 
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
                        className={`p-3 rounded-lg border ${
                          option === question.correctAnswer
                            ? 'bg-green-50 border-green-200'
                            : selectedAnswers[index] === option && option !== question.correctAnswer
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Explanation:</h4>
                      <p className="text-blue-700">{question.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={onBack}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Question {currentQuestion + 1} of {mcqSet.questions.length}</p>
                <div className="w-64 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                    style={{width: `${((currentQuestion + 1) / mcqSet.questions.length) * 100}%`}}
                  ></div>
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{mcqSet.documentName}</h2>
          </div>

          <div className="p-8">
            <h3 className="text-lg font-medium text-gray-800 mb-6">
              {question.question}
            </h3>

            <div className="space-y-3 mb-8">
              {['A', 'B', 'C', 'D'].map(option => (
                <button
                  key={`current-${option}`}
                  onClick={() => handleAnswerSelect(currentQuestion, option)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedAnswers[currentQuestion] === option
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-medium">{option}. </span>
                  {question[`option${option}`]}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                disabled={currentQuestion === 0}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentQuestion < mcqSet.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => setShowResults(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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