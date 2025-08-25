"use client";

import { useState, useRef, useEffect } from 'react';
import { AssemblyAI } from "assemblyai";

export default function MockInterviewPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [responses, setResponses] = useState([]);
  const [customInterviewData, setCustomInterviewData] = useState(null);
  const [isGeneratingCustomInterview, setIsGeneratingCustomInterview] = useState(false);
  const [customInterviewStarted, setCustomInterviewStarted] = useState(false);
  const [customQuestionIndex, setCustomQuestionIndex] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const questionAudioRef = useRef(null);

  // Initialize AssemblyAI client
  const client = new AssemblyAI({
    apiKey: "09d85cff6d24428d88d54bb6dde7007d",
  });

  // Interview questions sequence
  const questions = [
    { 
      id: 'startInterview', 
      audioFile: '/startInterview.mp3', 
      title: 'Interview Introduction',
      responseKey: 'resstartInterview'
    },
    { 
      id: 'getRole', 
      audioFile: '/getRole.mp3', 
      title: 'Role Information',
      responseKey: 'resgetRole'
    },
    { 
      id: 'experience', 
      audioFile: '/experience.mp3', 
      title: 'Experience Details',
      responseKey: 'resexperience'
    },
    { 
      id: 'interviewType', 
      audioFile: '/interviewType.mp3', 
      title: 'Interview Type',
      responseKey: 'resinterviewType'
    },
    { 
      id: 'questionNumber', 
      audioFile: '/questionNumber.mp3', 
      title: 'Question Number',
      responseKey: 'resquestionNumber'
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];


  const startInterview = () => {
    setInterviewStarted(true);
    setCurrentQuestionIndex(0);
    setResponses([]);
    // Don't call playCurrentQuestion here; let useEffect handle it
  };

  const playCurrentQuestion = () => {
    if (currentQuestionIndex < questions.length) {
      setIsPlayingQuestion(true);
      setError('');
      if (questionAudioRef.current) {
        questionAudioRef.current.src = questions[currentQuestionIndex].audioFile;
        questionAudioRef.current.play()
          .then(() => {
            console.log('Playing question:', questions[currentQuestionIndex].title);
          })
          .catch((err) => {
            setError('Failed to play question audio');
            console.error('Audio play error:', err);
            setIsPlayingQuestion(false);
          });
      }
    }
  };

  // Play question audio whenever currentQuestionIndex changes and interview is started
  useEffect(() => {
    if (interviewStarted && !interviewComplete) {
      playCurrentQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, interviewStarted, interviewComplete]);

  // Play custom question audio when custom interview progresses
  useEffect(() => {
    if (customInterviewStarted && customInterviewData) {
      playCustomQuestion(customQuestionIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customQuestionIndex, customInterviewStarted]);

  // Generate custom interview when interview is complete
  useEffect(() => {
    if (interviewComplete && responses.length > 0 && !customInterviewData && !isGeneratingCustomInterview) {
      generateCustomInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewComplete, responses.length]);

  const handleQuestionEnded = () => {
    setIsPlayingQuestion(false);
  };

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Automatically transcribe the response
        transcribeResponse(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone. Please ensure microphone permissions are granted.');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeResponse = async (audioBlob) => {
    setIsTranscribing(true);
    setError('');

    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const params = {
        audio: uint8Array,
        speech_model: "universal",
      };

      const transcript = await client.transcripts.transcribe(params);
      
      if (transcript.text) {
        if (customInterviewStarted) {
          // Handle custom interview responses
          const customQuestion = getCurrentCustomQuestion();
          const newResponse = {
            questionId: `custom_${customQuestionIndex}`,
            questionTitle: customQuestion?.title || `Custom Question ${customQuestionIndex + 1}`,
            responseKey: `custom_response_${customQuestionIndex}`,
            transcript: transcript.text,
            timestamp: new Date().toISOString()
          };

          setResponses(prev => [...prev, newResponse]);
          
          // Move to next custom question
          if (customQuestionIndex < (customInterviewData?.audioUrls?.length || 0) - 1) {
            setTimeout(() => {
              setCustomQuestionIndex(prev => prev + 1);
            }, 1000);
          } else {
            // Custom interview complete
            setCustomInterviewStarted(false);
            alert('🎉 Custom interview complete! All responses have been recorded.');
          }
        } else {
          // Handle regular interview responses
          const newResponse = {
            questionId: currentQuestion.id,
            questionTitle: currentQuestion.title,
            responseKey: currentQuestion.responseKey,
            transcript: transcript.text,
            timestamp: new Date().toISOString()
          };

          setResponses(prev => [...prev, newResponse]);
          
          // Move to next question or complete interview
          if (currentQuestionIndex < questions.length - 1) {
            setTimeout(() => {
              setCurrentQuestionIndex(prev => prev + 1);
            }, 1000); // Small delay before next question
          } else {
            setInterviewComplete(true);
            // Custom interview generation will be handled by useEffect
          }
        }
      } else {
        setError('No speech detected in the audio recording. Please try again.');
      }
    } catch (err) {
      setError('Failed to transcribe audio. Please try again.');
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
      setAudioBlob(null);
    }
  };

  const resetInterview = () => {
    setInterviewStarted(false);
    setInterviewComplete(false);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setIsRecording(false);
    setIsPlayingQuestion(false);
    setAudioBlob(null);
    setError('');
    setCustomInterviewData(null);
    setCustomInterviewStarted(false);
    setCustomQuestionIndex(0);
    setIsGeneratingCustomInterview(false);
  };

  const generateCustomInterview = async () => {
    setIsGeneratingCustomInterview(true);
    setError('');

    try {
      // Filter out the startInterview response before sending to backend
      const filteredResponses = responses.filter(response => response.questionId !== 'startInterview');
      console.log('Total responses collected:', responses.length);
      console.log('All responses:', responses.map(r => ({ id: r.questionId, title: r.questionTitle })));
      console.log('Filtered responses being sent to backend:', filteredResponses.length);
      console.log('Filtered responses:', filteredResponses.map(r => ({ id: r.questionId, title: r.questionTitle })));
      
      const response = await fetch('http://localhost:8080/api/interviews/generate-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: filteredResponses
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Custom interview data:', data);
        setCustomInterviewData(data);
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        setError(`Failed to generate custom interview. Server returned: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Error connecting to server. Please ensure the backend is running on port 8080.');
    } finally {
      setIsGeneratingCustomInterview(false);
    }
  };

  const startCustomInterview = () => {
    setCustomInterviewStarted(true);
    setCustomQuestionIndex(0);
    playCustomQuestion(0);
  };

  const playCustomQuestion = (questionIndex) => {
    if (customInterviewData && questionIndex < customInterviewData.audioUrls.length) {
      setIsPlayingQuestion(true);
      setError('');
      
      if (questionAudioRef.current) {
        const audioUrl = `http://localhost:8080${customInterviewData.audioUrls[questionIndex]}`;
        questionAudioRef.current.src = audioUrl;
        questionAudioRef.current.play()
          .then(() => {
            console.log('Playing custom question:', questionIndex);
          })
          .catch((err) => {
            setError('Failed to play custom question audio');
            console.error('Custom audio play error:', err);
            setIsPlayingQuestion(false);
          });
      }
    }
  };

  const getCurrentCustomQuestion = () => {
    if (!customInterviewData || !customInterviewData.questions) return null;
    
    // Introduction is at index 0, questions start at index 1
    if (customQuestionIndex === 0) {
      return {
        title: 'Introduction',
        question: customInterviewData.introduction
      };
    }
    
    const questionData = customInterviewData.questions[customQuestionIndex - 1];
    return questionData ? {
      title: `Question ${questionData.id}`,
      question: questionData.question
    } : null;
  };

  return (
    <div className="min-h-screen bg-gray-900 py-4">
      <div className="max-w-6xl mx-auto px-4">
        {/* Video Call Header */}
        <div className="bg-gray-800 rounded-t-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-white font-medium">AI Mock Interview Session</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-gray-300 text-sm">
              {interviewStarted && !interviewComplete && (
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              )}
              {customInterviewStarted && (
                <span>Custom Q{customQuestionIndex + 1} of {customInterviewData?.audioUrls?.length || 0}</span>
              )}
            </div>
          </div>
        </div>

        {/* Main Video Call Interface */}
        <div className="bg-black rounded-b-lg overflow-hidden">
          {/* Video Grid */}
          <div className="grid grid-cols-2 gap-4 p-6 min-h-[600px]">
            {/* AI Interviewer Video */}
            <div className={`relative bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 ${
              isPlayingQuestion ? 'ring-4 ring-blue-400 shadow-lg shadow-blue-400/50' : ''
            }`}>
              <div className="aspect-video flex items-center justify-center relative">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 13.5V10C15 8.9 14.1 8 13 8H11C9.9 8 9 8.9 9 10V14C9 15.1 9.9 16 11 16H13C14.1 16 15 15.1 15 14V10.5L21 17V15H22V9H21Z"/>
                  </svg>
                </div>
                {isPlayingQuestion && (
                  <div className="absolute inset-0 bg-blue-400/20 animate-pulse rounded-lg"></div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  AI Interviewer
                  {isPlayingQuestion && (
                    <span className="ml-2 inline-flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="ml-1 text-xs">Speaking...</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* User Video */}
            <div className={`relative bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 ${
              isRecording ? 'ring-4 ring-red-400 shadow-lg shadow-red-400/50' : ''
            }`}>
              <div className="aspect-video flex items-center justify-center relative">
                <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
                  </svg>
                </div>
                {isRecording && (
                  <div className="absolute inset-0 bg-red-400/20 animate-pulse rounded-lg"></div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  You
                  {isRecording && (
                    <span className="ml-2 inline-flex items-center">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="ml-1 text-xs">Recording...</span>
                    </span>
                  )}
                  {isTranscribing && (
                    <span className="ml-2 inline-flex items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="ml-1 text-xs">Processing...</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-gray-800 p-4 flex items-center justify-center space-x-6">
            {/* Microphone Control */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isPlayingQuestion || isTranscribing}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : isPlayingQuestion || isTranscribing
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              {isRecording ? (
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Replay Question Button */}
            {!isPlayingQuestion && !isRecording && !isTranscribing && (interviewStarted || customInterviewStarted) && (
              <button
                onClick={customInterviewStarted ? () => playCustomQuestion(customQuestionIndex) : playCurrentQuestion}
                className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9V15H7L12 20V4L7 9H3ZM16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.23V5.29C16.89 6.15 19 8.83 19 12S16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12S18.01 4.14 14 3.23Z"/>
                </svg>
              </button>
            )}

            {/* End Call / Reset Button */}
            <button
              onClick={resetInterview}
              className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 9C10.9 9 10 9.9 10 11V13C10 14.1 10.9 15 12 15S14 14.1 14 13V11C14 9.9 13.1 9 12 9ZM19 11C19 15.2 15.8 18.6 11.5 18.95V21H13V23H11V23H9V21H10.5V18.95C6.2 18.6 3 15.2 3 11H5C5 14.3 7.7 17 11 17S17 14.3 17 11H19Z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Hidden audio element for playing questions */}
        <audio
          ref={questionAudioRef}
          onEnded={handleQuestionEnded}
          className="hidden"
        />

          {!interviewStarted && !interviewComplete && (
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Welcome to the AI Mock Interview
                </h2>
                <p className="text-gray-600 mb-6">
                  This interview will ask you {questions.length - 1} questions. Listen to each question 
                  and provide your response when prompted. Click &quot;End Recording&quot; after answering each question.
                </p>
              </div>
              
              <button
                onClick={startInterview}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200"
              >
                Start Interview
              </button>

              <div className="mt-4">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('http://localhost:8080/api/interviews/test-custom');
                      const text = await response.text();
                      console.log('Backend test:', text);
                      alert(response.ok ? text : 'Backend connection failed');
                    } catch (err) {
                      console.error('Backend test error:', err);
                      alert('Backend is not running or unreachable');
                    }
                  }}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm"
                >
                  Test Backend Connection
                </button>
              </div>
            </div>
          )}

          {interviewStarted && !interviewComplete && (
            <div>
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Question */}
              <div className="bg-gray-50 border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {currentQuestion.title}
                </h3>
                
                {isPlayingQuestion && (
                  <div className="flex items-center space-x-2 text-blue-500 mb-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Playing question...</span>
                  </div>
                )}

                {!isPlayingQuestion && !isRecording && !isTranscribing && (
                  <button
                    onClick={playCurrentQuestion}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 mb-4"
                  >
                    🔊 Replay Question
                  </button>
                )}
              </div>

              {/* Recording Controls */}
              {!isPlayingQuestion && (
                <div className="text-center mb-6">
                  {!isRecording && !isTranscribing && (
                    <button
                      onClick={startRecording}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      <span>Start Recording Answer</span>
                    </button>
                  )}

                  {isRecording && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-2 text-red-500">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Recording your response...</span>
                      </div>
                      <button
                        onClick={stopRecording}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                        <span>End Recording</span>
                      </button>
                    </div>
                  )}

                  {isTranscribing && (
                    <div className="flex items-center justify-center space-x-2 text-blue-500">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">Processing your response...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {interviewComplete && !customInterviewStarted && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-green-600 mb-4">
                  🎉 Initial Interview Complete!
                </h2>
                <p className="text-gray-600 mb-6">
                  Thank you for completing the initial interview. Here are your responses:
                </p>
              </div>

              {/* Interview Summary */}
              <div className="space-y-6 mb-8">
                {responses.map((response, index) => (
                  <div key={response.questionId} className="bg-gray-50 border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {index + 1}. {response.questionTitle}
                    </h3>
                    <div className="bg-white border rounded-lg p-4">
                      <p className="text-gray-800 leading-relaxed">{response.transcript}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Interview Generation */}
              {isGeneratingCustomInterview && (
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center space-x-2 text-blue-500">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">Generating your personalized interview questions...</span>
                  </div>
                </div>
              )}

              {customInterviewData && !isGeneratingCustomInterview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">
                    🚀 Your Personalized Interview is Ready!
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Based on your responses, we&apos;ve generated {customInterviewData.questions?.length || 0} personalized questions 
                    for the role of <strong>{customInterviewData.role}</strong> with your experience level.
                  </p>
                  <button
                    onClick={startCustomInterview}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Start Personalized Interview
                  </button>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={resetInterview}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Start New Interview
                </button>
              </div>
            </div>
          )}

          {customInterviewStarted && (
            <div>
              {/* Custom Interview Progress */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Custom Question {customQuestionIndex + 1} of {(customInterviewData?.audioUrls?.length || 0)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Personalized Interview
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((customQuestionIndex + 1) / (customInterviewData?.audioUrls?.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Custom Question */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                  {getCurrentCustomQuestion()?.title || 'Loading...'}
                </h3>
                <p className="text-purple-700 mb-4">
                  {getCurrentCustomQuestion()?.question || 'Loading question...'}
                </p>
                
                {isPlayingQuestion && (
                  <div className="flex items-center space-x-2 text-purple-500 mb-4">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Playing question...</span>
                  </div>
                )}

                {!isPlayingQuestion && !isRecording && !isTranscribing && (
                  <button
                    onClick={() => playCustomQuestion(customQuestionIndex)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 mb-4"
                  >
                    🔊 Replay Question
                  </button>
                )}
              </div>

              {/* Recording Controls for Custom Interview */}
              {!isPlayingQuestion && (
                <div className="text-center mb-6">
                  {!isRecording && !isTranscribing && (
                    <button
                      onClick={startRecording}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      <span>Start Recording Answer</span>
                    </button>
                  )}

                  {isRecording && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-2 text-red-500">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Recording your response...</span>
                      </div>
                      <button
                        onClick={stopRecording}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                        <span>End Recording</span>
                      </button>
                    </div>
                  )}

                  {isTranscribing && (
                    <div className="flex items-center justify-center space-x-2 text-blue-500">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">Processing your response...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!interviewStarted && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">How the Interview Works:</h3>
              <ol className="list-decimal list-inside text-blue-700 space-y-2">
                <li>Click &quot;Start Interview&quot; to begin</li>
                <li>Listen to each audio question carefully</li>
                <li>Click &quot;Start Recording Answer&quot; to record your response</li>
                <li>Speak clearly and naturally</li>
                <li>Click &quot;End Recording&quot; when you finish answering</li>
                <li>Your response will be automatically transcribed</li>
                <li>The next question will play automatically</li>
                <li>View all your responses at the end</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}