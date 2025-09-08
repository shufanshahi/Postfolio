"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AssemblyAI } from "assemblyai";
import { 
  Mic, MicOff, Play, PhoneOff, RotateCcw, Video, 
  CheckCircle, AlertCircle, Clock, Award, Target,
  Loader2, ChevronRight, ArrowLeft, Bot, User2,
  Volume2, VolumeX, Settings, Star, Briefcase, Activity
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from '@/components/ui/card';
import {
  Button
} from '@/components/ui/button';
import {
  Badge
} from '@/components/ui/badge';
import {
  Progress
} from '@/components/ui/progress';
import {
  Alert, AlertDescription
} from '@/components/ui/alert';
import Navbar from '@/components/Navbar';

export default function PreviousMockInterviewPage() {
  const { mockInterviewId } = useParams();
  const router = useRouter();
  
  const [customInterviewComplete, setCustomInterviewComplete] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');
  const [responses, setResponses] = useState([]);
  const [audioRecordings, setAudioRecordings] = useState([]);
  const [customInterviewData, setCustomInterviewData] = useState(null);
  const [isGeneratingCustomInterview, setIsGeneratingCustomInterview] = useState(false);
  const [customInterviewStarted, setCustomInterviewStarted] = useState(false);
  const [customQuestionIndex, setCustomQuestionIndex] = useState(0);

  // For mock interview data
  const [mockInterviewData, setMockInterviewData] = useState(null);
  const [loadingMockInterview, setLoadingMockInterview] = useState(true);
  
  // For interview evaluation
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  
  // Fetch mock interview data and generate custom interview
  useEffect(() => {
    const fetchMockInterviewAndGenerate = async () => {
      if (!mockInterviewId) return;
      
      setLoadingMockInterview(true);
      setError('');
      
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch specific mock interview data
        const mockRes = await fetch(`http://localhost:8080/api/interviews/mock-interview/${mockInterviewId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!mockRes.ok) {
          throw new Error('Failed to fetch mock interview data');
        }
        
        const mockData = await mockRes.json();
        setMockInterviewData(mockData);
        
        // Start generating custom interview immediately
        generateCustomInterviewFromMockData(mockData, token);
        
      } catch (err) {
        console.error('Error fetching mock interview:', err);
        setError(`Failed to load mock interview: ${err.message}`);
      } finally {
        setLoadingMockInterview(false);
      }
    };
    
    fetchMockInterviewAndGenerate();
  }, [mockInterviewId]);

  // Function to generate custom interview from mock data
  const generateCustomInterviewFromMockData = async (mockData, token) => {
    setIsGeneratingCustomInterview(true);
    setError('');

    try {
      // Create mock responses based on the stored mock interview data
      const mockResponses = [
        {
          questionId: 'startInterview',
          questionTitle: 'Interview Introduction',
          responseKey: 'resstartInterview',
          transcript: 'Ready to start the interview',
          timestamp: new Date().toISOString()
        },
        {
          questionId: 'getRole',
          questionTitle: 'Role Information',
          responseKey: 'resgetRole',
          transcript: mockData.role,
          timestamp: new Date().toISOString()
        },
        {
          questionId: 'experience',
          questionTitle: 'Experience Details',
          responseKey: 'resexperience',
          transcript: mockData.experience,
          timestamp: new Date().toISOString()
        },
        {
          questionId: 'interviewType',
          questionTitle: 'Interview Type',
          responseKey: 'resinterviewType',
          transcript: mockData.interviewType,
          timestamp: new Date().toISOString()
        },
        {
          questionId: 'questionNumber',
          questionTitle: 'Question Number',
          responseKey: 'resquestionNumber',
          transcript: mockData.numQuestions,
          timestamp: new Date().toISOString()
        }
      ];

      setResponses(mockResponses);

      const response = await fetch('http://localhost:8080/api/interviews/generate-custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses: mockResponses
        }),
      });

      if (response.ok) {
        const customData = await response.json();
        setCustomInterviewData(customData);
      } else {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('Error generating custom interview:', err);
      setError('Error generating personalized interview. Please try again.');
    } finally {
      setIsGeneratingCustomInterview(false);
    }
  };
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const questionAudioRef = useRef(null);

  // Initialize AssemblyAI client
  const client = new AssemblyAI({
    apiKey: "09d85cff6d24428d88d54bb6dde7007d",
  });

  // Play custom question audio when custom interview progresses
  useEffect(() => {
    if (customInterviewStarted && customInterviewData) {
      playCustomQuestion(customQuestionIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customQuestionIndex, customInterviewStarted]);

  // Evaluate interview when custom interview transcription is complete
  useEffect(() => {
    console.log('Evaluation useEffect triggered:', {
      customInterviewComplete,
      isTranscribing,
      responsesLength: responses.length,
      hasCustomInterviewData: !!customInterviewData,
      hasEvaluationResults: !!evaluationResults,
      isEvaluating
    });
    
    if (customInterviewComplete && !isTranscribing && responses.length > 5 && customInterviewData && !evaluationResults && !isEvaluating) {
      console.log('Starting evaluation...');
      // Delay evaluation slightly to ensure all state updates are complete
      setTimeout(() => {
        evaluateInterview();
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customInterviewComplete, isTranscribing, responses.length, customInterviewData]);

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
        
        // Store audio recording instead of transcribing immediately
        storeAudioRecording(audioBlob);
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

  const storeAudioRecording = (audioBlob) => {
    if (customInterviewStarted) {
      // Handle custom interview responses
      const customQuestion = getCurrentCustomQuestion();
      const newRecording = {
        questionId: `custom_${customQuestionIndex}`,
        questionTitle: customQuestion?.title || `Custom Question ${customQuestionIndex + 1}`,
        responseKey: `custom_response_${customQuestionIndex}`,
        audioBlob: audioBlob,
        timestamp: new Date().toISOString()
      };

      setAudioRecordings(prev => [...prev, newRecording]);
      
      // Move to next custom question
      if (customQuestionIndex < (customInterviewData?.audioUrls?.length || 0) - 1) {
        setTimeout(() => {
          setCustomQuestionIndex(prev => prev + 1);
        }, 1000);
      } else {
        // Custom interview complete - transcribe all recordings
        setCustomInterviewStarted(false);
        setCustomInterviewComplete(true);
        transcribeAllRecordings([...audioRecordings, newRecording]);
      }
    }
    
    setAudioBlob(null);
  };

  const transcribeAllRecordings = async (recordings) => {
    setIsTranscribing(true);
    setError('');
    
    try {
      const transcribedResponses = [];
      
      for (let i = 0; i < recordings.length; i++) {
        const recording = recordings[i];
        
        // Convert blob to array buffer
        const arrayBuffer = await recording.audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const params = {
          audio: uint8Array,
          speech_model: "universal",
        };

        const transcript = await client.transcripts.transcribe(params);
        
        if (transcript.text) {
          transcribedResponses.push({
            questionId: recording.questionId,
            questionTitle: recording.questionTitle,
            responseKey: recording.responseKey,
            transcript: transcript.text,
            timestamp: recording.timestamp
          });
        } else {
          // If no speech detected, add a placeholder
          transcribedResponses.push({
            questionId: recording.questionId,
            questionTitle: recording.questionTitle,
            responseKey: recording.responseKey,
            transcript: "[No speech detected]",
            timestamp: recording.timestamp
          });
        }
      }
      
      // Append transcribed responses to existing responses (keeping the initial setup responses)
      setResponses(prevResponses => [...prevResponses, ...transcribedResponses]);
      
    } catch (err) {
      setError('Failed to transcribe audio recordings. Please try again.');
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const resetInterview = () => {
    // Navigate back to the main mock interview page
    router.push('/mockInterview');
  };

  const evaluateInterview = async () => {
    if (!customInterviewData || !responses || responses.length === 0) {
      setError('No interview data available for evaluation');
      return;
    }

    setIsEvaluating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare question-answer pairs for evaluation
      const questionAnswers = [];
      
      // Filter out only the custom interview responses (not the setup responses)
      const customResponses = responses.filter(response => 
        response.questionId && response.questionId.startsWith('custom_')
      );
      
      console.log('Total responses:', responses.length);
      console.log('Custom responses:', customResponses.length);
      console.log('Custom interview questions:', customInterviewData.questions?.length || 0);

      console.log('Custom Interview Data:', customInterviewData.questions);
      console.log('Custom Responses:', customResponses);
      
      // Match custom questions with custom responses
      if (customInterviewData.questions && customResponses.length > 0) {
        for (let i = 0; i < customInterviewData.questions.length && i < customResponses.length; i++) {
          const question = customInterviewData.questions[i];
          const response = customResponses[i+1];
          
          if (question && response && response.transcript && response.transcript !== "[No speech detected]") {
            questionAnswers.push({
              question: question.question,
              answer: response.transcript
            });
          }
        }
      }

      console.log('Question-answer pairs for evaluation:', questionAnswers);

      if (questionAnswers.length === 0) {
        console.error('No valid question-answer pairs found');
        throw new Error('No valid question-answer pairs found for evaluation');
      }

      const response = await fetch('http://localhost:8080/api/interviews/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionAnswers: questionAnswers
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const evaluationData = await response.json();
      console.log('Evaluation data received:', evaluationData);
      setEvaluationResults(evaluationData);
      setShowEvaluation(true);

    } catch (err) {
      console.error('Evaluation error:', err);
      setError(`Failed to evaluate interview: ${err.message}`);
    } finally {
      setIsEvaluating(false);
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

  // Design tokens (matching dashboard and mockInterview)
  const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
  const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient matching dashboard */}
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>
      
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-10 px-6 space-y-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
              Previous Mock Interview
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Review and continue your interview session
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm text-slate-700 text-sm"
              onClick={() => router.push('/mockInterview')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mock Interviews
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loadingMockInterview && (
          <Card className={`rounded-2xl ${subtleCard} shadow-lg`}>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Loading Interview Data
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Retrieving your previous mock interview details...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Video Call Interface - Show when custom interview is ready or started */}
        {!loadingMockInterview && customInterviewStarted && (
          <Card className={`rounded-2xl overflow-hidden ${subtleCard} shadow-lg`}>
            {/* Video Call Header */}
            <div className="bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 dark:from-teal-500 dark:via-indigo-500 dark:to-purple-500 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">AI Interview Session</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {customInterviewStarted && (
                    <span>Question {customQuestionIndex + 1} of {customInterviewData?.audioUrls?.length || 0}</span>
                  )}
                </Badge>
              </div>
            </div>

            {/* Main Video Call Interface */}
            <div className="relative p-8" style={{ minHeight: '600px' }}>
              {/* AI Interviewer Main Screen */}
              <div className={`relative rounded-2xl overflow-hidden w-full transition-all duration-300 ${
                isPlayingQuestion 
                  ? 'ring-4 ring-teal-400 shadow-lg shadow-teal-400/30' 
                  : 'ring-2 ring-slate-200 dark:ring-slate-700'
              } bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900`} style={{ height: '100%' }}>
                <div className="w-full h-full flex items-center justify-center relative min-h-[500px]">
                  {/* AI Avatar */}
                  <div className="w-48 h-48 bg-gradient-to-br from-teal-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/30">
                    <Bot className="w-24 h-24 text-white" />
                  </div>
                  
                  {/* Speaking Animation */}
                  {isPlayingQuestion && (
                    <div className="absolute inset-0 bg-teal-400/10 animate-pulse rounded-2xl"></div>
                  )}
                  
                  {/* AI Interviewer Label */}
                  <div className="absolute bottom-6 left-6 bg-gradient-to-r from-teal-600/90 to-indigo-600/90 backdrop-blur text-white px-4 py-2 rounded-full text-base font-medium shadow-lg">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      AI Interviewer
                      {isPlayingQuestion && (
                        <Badge className="bg-green-400/20 text-green-100 border-green-400/30 ml-2">
                          <Volume2 className="h-3 w-3 mr-1" />
                          Speaking
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Control Buttons - Center Bottom */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                    {/* Microphone/Record Button */}
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isPlayingQuestion || isTranscribing}
                      size="lg"
                      className={`w-16 h-16 rounded-full shadow-xl transition-all duration-300 ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-400/30 animate-pulse' 
                          : isPlayingQuestion || isTranscribing
                            ? 'bg-slate-400 cursor-not-allowed opacity-50'
                            : 'bg-green-600 hover:bg-green-700 ring-4 ring-green-400/30 hover:scale-110'
                      }`}
                      title={isRecording ? "Stop Recording" : "Start Recording"}
                    >
                      {isRecording ? (
                        <MicOff className="w-7 h-7 text-white" />
                      ) : (
                        <Mic className="w-7 h-7 text-white" />
                      )}
                    </Button>

                    {/* Replay Question Button */}
                    {!isPlayingQuestion && !isRecording && !isTranscribing && customInterviewStarted && (
                      <Button
                        onClick={() => playCustomQuestion(customQuestionIndex)}
                        size="lg"
                        className="w-16 h-16 rounded-full bg-teal-600 hover:bg-teal-700 shadow-xl ring-4 ring-teal-400/30 hover:scale-110 transition-all duration-300"
                        title="Replay Question"
                      >
                        <RotateCcw className="w-7 h-7 text-white" />
                      </Button>
                    )}

                    {/* End Call Button */}
                    <Button
                      onClick={resetInterview}
                      size="lg"
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-xl ring-4 ring-red-400/30 hover:scale-110 transition-all duration-300"
                      title="End Interview"
                    >
                      <PhoneOff className="w-7 h-7 text-white" />
                    </Button>
                  </div>
                </div>

                {/* User Picture-in-Picture (Upper Right) */}
                <div className={`absolute top-6 right-6 w-48 h-36 rounded-2xl overflow-hidden transition-all duration-300 ${
                  isRecording 
                    ? 'ring-4 ring-red-400 shadow-lg shadow-red-400/30' 
                    : 'ring-2 ring-slate-300 dark:ring-slate-600'
                } bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800`}>
                  <div className="w-full h-full flex items-center justify-center relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                      <User2 className="w-10 h-10 text-white" />
                    </div>
                    {isRecording && (
                      <div className="absolute inset-0 bg-red-400/20 animate-pulse rounded-2xl"></div>
                    )}
                    
                    {/* User Label */}
                    <div className="absolute bottom-2 left-2 bg-gradient-to-r from-green-600/90 to-teal-600/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <User2 className="h-3 w-3" />
                        You
                        {isRecording && (
                          <Badge className="bg-red-400/20 text-red-100 border-red-400/30 ml-1 text-xs">
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse mr-1"></div>
                            Rec
                          </Badge>
                        )}
                        {isTranscribing && (
                          <Badge className="bg-yellow-400/20 text-yellow-100 border-yellow-400/30 ml-1 text-xs">
                            <Loader2 className="w-2 h-2 animate-spin mr-1" />
                            Processing
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Hidden audio element for playing questions */}
        <audio
          ref={questionAudioRef}
          onEnded={handleQuestionEnded}
          className="hidden"
        />

        {/* Content Area - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Mock Interview Information */}
            {!loadingMockInterview && mockInterviewData && !customInterviewStarted && (
              <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
                <CardContent className="p-8 text-center">
                  <div className="mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                      <Briefcase className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      Previous Mock Interview Details
                    </h2>
                    <div className={`${gradientPanel} rounded-xl p-6 mb-6 max-w-lg mx-auto`}>
                      <div className="space-y-3 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Role:</span>
                          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                            {mockInterviewData.role}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Experience:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{mockInterviewData.experience}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Interview Type:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{mockInterviewData.interviewType}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Questions:</span>
                          <Badge variant="secondary">{mockInterviewData.numQuestions}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing States */}
            {(isGeneratingCustomInterview || isTranscribing) && (
              <Card className={`rounded-2xl ${subtleCard} shadow-lg`}>
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                    {isTranscribing
                      ? 'Processing Your Responses'
                      : 'Generating Personalized Questions'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {isTranscribing
                      ? 'Analyzing your audio responses and converting them to text...'
                      : 'Creating customized interview questions based on your previous responses...'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Custom Interview Ready */}
            {customInterviewData && !isGeneratingCustomInterview && !isTranscribing && !customInterviewStarted && (
              <Card className={`rounded-2xl overflow-hidden ${gradientPanel} shadow-lg`}>
                <div className="absolute inset-0 bg-gradient-to-br from-teal-100/40 via-transparent to-indigo-100/40 dark:from-teal-500/10 dark:to-indigo-500/10" />
                <CardContent className="relative p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                        Personalized Interview Ready!
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Continue from where you left off
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                    Based on your previous responses, we&apos;ve generated <strong>{customInterviewData.questions?.length || 0} personalized questions</strong> 
                    for the role of <strong>{mockInterviewData?.role}</strong> with your experience level.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={startCustomInterview}
                      className="bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Personalized Interview
                    </Button>
                    {/* <Button
                      onClick={resetInterview}
                      variant="outline"
                      className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm"
                    >
                      Return to Mock Interviews
                    </Button> */}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Custom Question */}
            {customInterviewStarted && (
              <Card className={`rounded-2xl ${gradientPanel} shadow-lg`}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-transparent to-indigo-100/40 dark:from-purple-500/10 dark:to-indigo-500/10" />
                <CardHeader className="relative pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100 text-xl">
                    <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    {getCurrentCustomQuestion()?.title || 'Loading...'}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {getCurrentCustomQuestion()?.question || 'Loading question...'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  {isPlayingQuestion && (
                    <Alert className="border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20">
                      <Volume2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <AlertDescription className="text-purple-700 dark:text-purple-300">
                        AI is asking your personalized question. Take your time to think and respond.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!isPlayingQuestion && !isRecording && !isTranscribing && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        Question completed. Ready to record your personalized response?
                      </AlertDescription>
                    </Alert>
                  )}

                  {isRecording && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20">
                      <Mic className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-700 dark:text-red-300">
                        Recording your detailed response to this personalized question.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isTranscribing && (
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
                      <Loader2 className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-spin" />
                      <AlertDescription className="text-amber-700 dark:text-amber-300">
                        Processing your response for detailed evaluation.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

         
          {/* {showEvaluation && evaluationResults && !customInterviewStarted && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-green-900 to-blue-900 border border-green-500 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-green-300 mb-4 text-center">
                  🎯 Interview Evaluation Results
                </h3>
                
                
                <div className="bg-green-800/30 border border-green-600 rounded-lg p-4 mb-4 text-center">
                  <h4 className="text-lg font-semibold text-green-300 mb-2">Overall Rating</h4>
                  <div className="text-3xl font-bold text-white mb-2">
                    {evaluationResults.rating}/100
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${evaluationResults.rating}%` }}
                    ></div>
                  </div>
                </div>

                
                {evaluationResults.strengths && evaluationResults.strengths.length > 0 && (
                  <div className="bg-green-800/20 border border-green-600 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Strengths
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-green-200">
                      {evaluationResults.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

            
                {evaluationResults.weaknesses && evaluationResults.weaknesses.length > 0 && (
                  <div className="bg-red-800/20 border border-red-600 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-red-300 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Areas for Improvement
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-red-200">
                      {evaluationResults.weaknesses.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluationResults.improvements && evaluationResults.improvements.length > 0 && (
                  <div className="bg-blue-800/20 border border-blue-600 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      Actionable Recommendations
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-blue-200">
                      {evaluationResults.improvements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-center">
                  <button
                    onClick={resetInterview}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    Start New Intervieww
                  </button>
                </div>
              </div>
            </div>
          )} */}

          {/* Show loading during evaluation or when waiting for evaluation */}
          {/* {(isEvaluating || (customInterviewComplete && !customInterviewStarted && !showEvaluation && !isTranscribing)) && (
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 text-green-400">
                <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">
                  {isEvaluating ? 'Evaluating your interview performance...' : 'Preparing evaluation...'}
                </span>
              </div>
              <p className="text-gray-300 text-sm mt-2">This may take a few moments</p>
            </div>
          )} */}

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
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Interview Status */}
            <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-base font-semibold">
                  <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Interview Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Interview Type</span>
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                      Previous Session
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Questions Available</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {customInterviewData ? `${customInterviewData.questions?.length || 0} Generated` : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Current Phase</span>
                    <Badge className={`text-xs ${
                      customInterviewStarted
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : customInterviewData
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {customInterviewStarted 
                        ? 'In Progress'
                        : customInterviewData
                          ? 'Ready to Start'
                          : 'Preparing'
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interview Tips */}
            <Card className={`rounded-2xl ${gradientPanel} shadow-sm`}>
              <div className="absolute inset-0 bg-gradient-to-br from-teal-100/40 via-transparent to-indigo-100/40 dark:from-teal-500/10 dark:to-indigo-500/10 rounded-2xl" />
              <CardHeader className="relative pb-3">
                <CardTitle className="text-slate-800 dark:text-slate-100 text-base font-semibold">
                  Interview Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-3">
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Build on your previous responses</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Use specific examples and metrics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Take time to think before answering</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Replay questions if needed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Interview Evaluation Results */}
        {showEvaluation && evaluationResults && !customInterviewStarted && (
          <Card className={`rounded-2xl overflow-hidden ${gradientPanel} shadow-lg`}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/40 via-transparent to-blue-100/40 dark:from-green-500/10 dark:to-blue-500/10" />
            <CardContent className="relative p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Interview Evaluation Results
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Your performance analysis and improvement recommendations
                </p>
              </div>
              
              {/* Overall Rating */}
              <Card className={`rounded-xl mb-6 ${subtleCard}`}>
                <CardContent className="p-6 text-center">
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Overall Rating</h4>
                  <div className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                    {evaluationResults.rating}/100
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${evaluationResults.rating}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {evaluationResults.rating >= 80 ? 'Excellent Performance!' : 
                     evaluationResults.rating >= 60 ? 'Good Performance' : 
                     'Room for Improvement'}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Areas for Improvement */}
                {evaluationResults.weaknesses && evaluationResults.weaknesses.length > 0 && (
                  <Card className={`rounded-xl ${subtleCard}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">Areas to Improve</h4>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        {evaluationResults.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {evaluationResults.improvements && evaluationResults.improvements.length > 0 && (
                  <Card className={`rounded-xl ${subtleCard}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">Recommendations</h4>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        {evaluationResults.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* <div className="text-center">
                <Button
                  onClick={resetInterview}
                  className="bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start New Interview
                </Button>
              </div> */}
            </CardContent>
          </Card>
        )}

        {/* Loading during evaluation */}
        {(isEvaluating || (customInterviewComplete && !customInterviewStarted && !showEvaluation && !isTranscribing)) && (
          <Card className={`rounded-2xl ${subtleCard} shadow-lg`}>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-12 h-12 text-green-600 dark:text-green-400 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                {isEvaluating ? 'Evaluating Interview Performance' : 'Preparing Evaluation'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {isEvaluating ? 'Analyzing your responses and generating feedback...' : 'This may take a few moments'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

      </div>
    </div>
  );
}