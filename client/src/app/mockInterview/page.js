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
  };

  const playCurrentQuestion = () => {
    if (currentQuestionIndex < questions.length) {
      setIsPlayingQuestion(true);
      setError('');
      if (questionAudioRef.current) {
        const audio = questionAudioRef.current;
        
        // Reset the audio element first
        audio.pause();
        audio.currentTime = 0;
        
        const handleCanPlay = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.play()
            .then(() => {
              console.log('Playing question:', questions[currentQuestionIndex].title);
            })
            .catch((err) => {
              setError('Failed to play question audio');
              console.error('Audio play error:', err);
              setIsPlayingQuestion(false);
            });
        };
        
        const handleError = () => {
          audio.removeEventListener('error', handleError);
          setError('Failed to load question audio');
          setIsPlayingQuestion(false);
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        
        audio.src = questions[currentQuestionIndex].audioFile;
        audio.load(); // Explicitly load the audio
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
            }, 1000);
          } else {
            setInterviewComplete(true);
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

      const token = localStorage.getItem("token");
      
      const response = await fetch('http://localhost:8080/api/interviews/generate-custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
        const token = localStorage.getItem("token");
        
        // Reset the audio element first
        questionAudioRef.current.pause();
        questionAudioRef.current.currentTime = 0;
        
        fetch(audioUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(response => response.blob())
          .then(blob => {
            const audioUrlObject = URL.createObjectURL(blob);
            
            // Set up event listeners before setting source
            const audio = questionAudioRef.current;
            
            const handleCanPlay = () => {
              audio.removeEventListener('canplay', handleCanPlay);
              audio.play()
                .then(() => {
                  console.log('Playing custom question:', questionIndex);
                })
                .catch((err) => {
                  console.error('Custom audio play error:', err);
                  setIsPlayingQuestion(false);
                });
            };
            
            const handleError = () => {
              audio.removeEventListener('error', handleError);
              console.error('Audio loading error');
              setIsPlayingQuestion(false);
            };
            
            audio.addEventListener('canplay', handleCanPlay);
            audio.addEventListener('error', handleError);
            
            // Set the source to trigger loading
            audio.src = audioUrlObject;
            audio.load(); // Explicitly load the audio
          })
          .catch((err) => {
            console.error('Fetch error:', err);
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
        {/* Video Call Interface - Only show when interview is active */}
        {(interviewStarted || customInterviewStarted) && (
          <>
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
              {/* Main Interview Screen */}
              <div className="relative p-6" style={{ height: '600px' }}>
                {/* AI Interviewer Main Screen */}
                <div className={`relative bg-gray-800 rounded-lg overflow-hidden w-full transition-all duration-300 ${
                  isPlayingQuestion ? 'ring-4 ring-blue-400 shadow-lg shadow-blue-400/50' : ''
                }`} style={{ height: '100%' }}>
                  <div className="w-full h-full flex items-center justify-center relative">
                    <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 13.5V10C15 8.9 14.1 8 13 8H11C9.9 8 9 8.9 9 10V14C9 15.1 9.9 16 11 16H13C14.1 16 15 15.1 15 14V10.5L21 17V15H22V9H21Z"/>
                      </svg>
                    </div>
                    {isPlayingQuestion && (
                      <div className="absolute inset-0 bg-blue-400/20 animate-pulse rounded-lg"></div>
                    )}
                    
                    {/* AI Interviewer Label */}
                    <div className="absolute bottom-6 left-6 bg-black/70 text-white px-4 py-2 rounded-full text-base">
                      AI Interviewer
                      {isPlayingQuestion && (
                        <span className="ml-3 inline-flex items-center">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="ml-2 text-sm">Speaking...</span>
                        </span>
                      )}
                    </div>

                    {/* Control Buttons - Center Bottom */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                      {/* Microphone/Record Button */}
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isPlayingQuestion || isTranscribing}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600 pulse' 
                            : isPlayingQuestion || isTranscribing
                              ? 'bg-gray-600 cursor-not-allowed opacity-50'
                              : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title={isRecording ? "Stop Recording" : "Start Recording"}
                      >
                        {isRecording ? (
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" rx="2"/>
                          </svg>
                        ) : (
                          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C13.1 2 14 2.9 14 4V12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12V4C10 2.9 10.9 2 12 2ZM19 11C19 15.2 15.8 18.6 11.5 18.95V21H13V23H11H9V21H10.5V18.95C6.2 18.6 3 15.2 3 11H5C5 14.3 7.7 17 11 17S17 14.3 17 11H19Z"/>
                          </svg>
                        )}
                      </button>

                      {/* Replay Question Button */}
                      {!isPlayingQuestion && !isRecording && !isTranscribing && (interviewStarted || customInterviewStarted) && (
                        <button
                          onClick={customInterviewStarted ? () => playCustomQuestion(customQuestionIndex) : playCurrentQuestion}
                          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all duration-200"
                          title="Replay Question"
                        >
                          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5V1L7 6L12 11V7C15.31 7 18 9.69 18 13S15.31 19 12 19S6 16.31 6 13H4C4 17.42 7.58 21 12 21S20 17.42 20 13S16.42 5 12 5Z"/>
                          </svg>
                        </button>
                      )}

                      {/* End Call Button */}
                      <button
                        onClick={resetInterview}
                        className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all duration-200"
                        title="End Interview"
                      >
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 9C10.5 9 9.2 9.7 8.5 10.8L15.5 10.8C14.8 9.7 13.5 9 12 9ZM12 2C6.48 2 2 6.48 2 12S6.48 22 12 22S22 17.52 22 12S17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4S20 7.59 20 12S16.41 20 12 20ZM15.5 13H8.5C9.2 14.3 10.5 15 12 15S14.8 14.3 15.5 13Z"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* User Picture-in-Picture (Upper Right) */}
                  <div className={`absolute top-6 right-6 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden transition-all duration-300 ${
                    isRecording ? 'ring-3 ring-red-400 shadow-lg shadow-red-400/50' : 'ring-2 ring-gray-600'
                  }`}>
                    <div className="w-full h-full flex items-center justify-center relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
                        </svg>
                      </div>
                      {isRecording && (
                        <div className="absolute inset-0 bg-red-400/20 animate-pulse rounded-lg"></div>
                      )}
                      
                      {/* User Label */}
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        You
                        {isRecording && (
                          <span className="ml-1 inline-flex items-center">
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                            <span className="ml-1 text-xs">Rec</span>
                          </span>
                        )}
                        {isTranscribing && (
                          <span className="ml-1 inline-flex items-center">
                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                            <span className="ml-1 text-xs">Processing</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Hidden audio element for playing questions */}
        <audio
          ref={questionAudioRef}
          onEnded={handleQuestionEnded}
          className="hidden"
        />

        {/* Content Area */}
        <div className="bg-gray-800 p-6">
          {!interviewStarted && !interviewComplete && (
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Welcome to the AI Mock Interview
                </h2>
                <p className="text-gray-300 mb-6">
                  This interview will ask you {questions.length - 1} questions. Listen to each question 
                  and provide your response when prompted. Click the microphone when you&apos;re ready to answer.
                </p>
              </div>
              
              <button
                onClick={startInterview}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105"
              >
                Join Interview Room
              </button>

            </div>
          )}

          {interviewStarted && !interviewComplete && (
            <div>
              {/* Current Question Display */}
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-white mb-4 text-center">
                  {currentQuestion.title}
                </h3>
                
                {isPlayingQuestion && (
                  <div className="flex items-center justify-center space-x-2 text-blue-400 mb-4">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">AI is asking the question...</span>
                  </div>
                )}

                {!isPlayingQuestion && !isRecording && !isTranscribing && (
                  <div className="text-center">
                    <p className="text-gray-300 mb-4">Question audio has finished. Ready to record your answer?</p>
                  </div>
                )}

                {isRecording && (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 text-red-400 mb-4">
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">Recording your response...</span>
                    </div>
                    <p className="text-gray-300">Speak clearly and click the microphone button when done.</p>
                  </div>
                )}

                {isTranscribing && (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 text-yellow-400 mb-4">
                      <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">Processing your response...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {interviewComplete && !customInterviewStarted && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-green-400 mb-4">
                  🎉 Initial Interview Complete!
                </h2>
                <p className="text-gray-300 mb-6">
                  Thank you for completing the initial interview. Here are your responses:
                </p>
              </div>

              {/* Interview Summary */}
              <div className="space-y-6 mb-8 max-h-96 overflow-y-auto">
                {responses.map((response, index) => (
                  <div key={response.questionId} className="bg-gray-700 border border-gray-600 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {index + 1}. {response.questionTitle}
                    </h3>
                    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                      <p className="text-gray-200 leading-relaxed">{response.transcript}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Interview Generation */}
              {isGeneratingCustomInterview && (
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center space-x-2 text-blue-400">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">Generating your personalized interview questions...</span>
                  </div>
                </div>
              )}

              {customInterviewData && !isGeneratingCustomInterview && (
                <div className="bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-500 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-blue-300 mb-4">
                    🚀 Your Personalized Interview is Ready!
                  </h3>
                  <p className="text-blue-200 mb-4">
                    Based on your responses, we&apos;ve generated {customInterviewData.questions?.length || 0} personalized questions 
                    for the role of <strong>{customInterviewData.role}</strong> with your experience level.
                  </p>
                  <button
                    onClick={startCustomInterview}
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    Start Personalized Interview
                  </button>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={resetInterview}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Start New Interview
                </button>
              </div>
            </div>
          )}

          {customInterviewStarted && (
            <div>
              {/* Current Custom Question Display */}
              <div className="bg-gradient-to-r from-purple-900 to-blue-900 border border-purple-500 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-purple-200 mb-2 text-center">
                  {getCurrentCustomQuestion()?.title || 'Loading...'}
                </h3>
                <p className="text-purple-100 mb-4 text-center">
                  {getCurrentCustomQuestion()?.question || 'Loading question...'}
                </p>
                
                {isPlayingQuestion && (
                  <div className="flex items-center justify-center space-x-2 text-purple-300 mb-4">
                    <div className="w-3 h-3 bg-purple-300 rounded-full animate-pulse"></div>
                    <span className="font-medium">AI is asking the personalized question...</span>
                  </div>
                )}

                {!isPlayingQuestion && !isRecording && !isTranscribing && (
                  <div className="text-center">
                    <p className="text-purple-200 mb-4">Question audio has finished. Ready to record your answer?</p>
                  </div>
                )}

                {isRecording && (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 text-red-400 mb-4">
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">Recording your response...</span>
                    </div>
                  </div>
                )}

                {isTranscribing && (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 text-yellow-400 mb-4">
                      <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">Processing your response...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
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
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-500 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">How the Video Interview Works:</h3>
              <ol className="list-decimal list-inside text-blue-200 space-y-2">
                <li>Click &quot;Join Interview Room&quot; to begin</li>
                <li>The AI interviewer will appear and ask questions</li>
                <li>Listen carefully to each audio question</li>
                <li>Click the microphone button to start recording your response</li>
                <li>Speak clearly and naturally</li>
                <li>Click the microphone again to stop recording</li>
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
