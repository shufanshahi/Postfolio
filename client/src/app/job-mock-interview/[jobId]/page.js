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

export default function JobMockInterviewPage() {
  const { jobId } = useParams();
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

  // For job-based interview data
  const [jobData, setJobData] = useState(null);
  const [loadingJobData, setLoadingJobData] = useState(false);
  const [numQuestions, setNumQuestions] = useState('');
  const [interviewType, setInterviewType] = useState('Technical');
  const [showInputForm, setShowInputForm] = useState(true);
  
  // For interview evaluation
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  
  // Fetch job data and generate custom interview
  const fetchJobDataAndGenerate = async () => {
    if (!jobId) return;
    
    setLoadingJobData(true);
    setError('');
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch job details
      const jobRes = await fetch(`http://localhost:8080/api/jobs/${jobId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!jobRes.ok) {
        throw new Error('Failed to fetch job details');
      }
      
      const jobDetails = await jobRes.json();
      setJobData(jobDetails);
      
      // Create role and experience from job data
      const role = `${jobDetails.position} - ${jobDetails.requiredSkills}`;
      const experience = jobDetails.requiredExperience;
      
      // Generate interview data using job information
      generateInterviewFromJobData(role, experience, token);
      
    } catch (err) {
      console.error('Error fetching job data:', err);
      setError(`Failed to load job details: ${err.message}`);
    } finally {
      setLoadingJobData(false);
    }
  };

  // Function to generate interview from job data
  const generateInterviewFromJobData = async (role, experience, token) => {
    setIsGeneratingCustomInterview(true);
    setError('');

    try {
      // Create responses based on the job data and user inputs
      const jobBasedResponses = [
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
          transcript: role,
          timestamp: new Date().toISOString()
        },
        {
          questionId: 'experience',
          questionTitle: 'Experience Details',
          responseKey: 'resexperience',
          transcript: experience,
          timestamp: new Date().toISOString()
        },
        {
          questionId: 'interviewType',
          questionTitle: 'Interview Type',
          responseKey: 'resinterviewType',
          transcript: interviewType,
          timestamp: new Date().toISOString()
        },
        {
          questionId: 'questionNumber',
          questionTitle: 'Question Number',
          responseKey: 'resquestionNumber',
          transcript: numQuestions,
          timestamp: new Date().toISOString()
        }
      ];

      setResponses(jobBasedResponses);

      const response = await fetch('http://localhost:8080/api/interviews/generate-custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses: jobBasedResponses
        }),
      });

      if (response.ok) {
        const customData = await response.json();
        setCustomInterviewData(customData);
        setShowInputForm(false);
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

      console.log('Custom interview data:', customInterviewData.questions);
      console.log('Custom responses data:', customResponses);
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

      console.log('Sending evaluation request with questionAnswers:', questionAnswers);

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

  // Design tokens (matching dashboard and prev-mock-interview)
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
              Job-Based Mock Interview
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Prepare for your specific job role with tailored questions
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

        {/* Loading State - Centered in page */}
        {loadingJobData && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className={`rounded-2xl ${subtleCard} shadow-lg max-w-md w-full`}>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-16 h-16 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  Loading Job Details
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Retrieving job information and preparing your interview...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuration and Status Grid */}
        {!customInterviewData && !loadingJobData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">

              {/* Interview Setup Form */}
              {!loadingJobData && !jobData && (
                <Card className={`rounded-2xl ${subtleCard} shadow-lg`}>
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-teal-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                        <Settings className="w-12 h-12 text-white" />
                      </div>
                      <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                        Interview Configuration
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        Customize your interview experience based on the job requirements
                      </p>
                    </div>
                    
                    <div className={`${gradientPanel} rounded-xl p-6 max-w-md mx-auto`}>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-3">
                            Number of Questions
                          </label>
                          <div className="space-y-2">
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={numQuestions}
                              onChange={(e) => setNumQuestions(e.target.value)}
                              placeholder="Enter number of questions (1-20)"
                              className="w-full px-4 py-3 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 backdrop-blur"
                            />
                            {numQuestions && (parseInt(numQuestions) < 1 || parseInt(numQuestions) > 20) && (
                              <p className="text-red-500 text-xs">Please enter a number between 1 and 20</p>
                            )}
                            {!numQuestions && (
                              <p className="text-slate-500 text-xs">Please enter the number of questions you want in your interview</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-3">
                            Interview Type
                          </label>
                          <select
                            value={interviewType}
                            onChange={(e) => setInterviewType(e.target.value)}
                            className="w-full px-4 py-3 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 backdrop-blur"
                          >
                            <option value="Technical">Technical</option>
                            <option value="Behavioral">Behavioral</option>
                            <option value="Mixed">Mixed (Technical + Behavioral)</option>
                          </select>
                        </div>
                        
                        <Button
                          onClick={fetchJobDataAndGenerate}
                          disabled={isGeneratingCustomInterview || !numQuestions || parseInt(numQuestions) < 1 || parseInt(numQuestions) > 20}
                          className="w-full bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isGeneratingCustomInterview ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating Interview...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Generate Interview
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Information Display */}
              {!loadingJobData && jobData && showInputForm && (
                <Card className={`rounded-2xl ${subtleCard} shadow-lg`}>
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-teal-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                        <Briefcase className="w-12 h-12 text-white" />
                      </div>
                      <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                        Job-Based Interview Setup
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400">
                        Review your job details and interview configuration
                      </p>
                    </div>
                    
                    <div className={`${gradientPanel} rounded-xl p-6 max-w-lg mx-auto mb-6`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Position:</span>
                          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                            {jobData.position}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Required Skills:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium text-right max-w-xs truncate">{jobData.requiredSkills}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Experience Level:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{jobData.requiredExperience}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Interview Type:</span>
                          <Badge variant="secondary">{interviewType}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Questions:</span>
                          <Badge variant="secondary">{numQuestions}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 justify-center">
                      {/* <Button
                        onClick={() => {
                          setShowInputForm(true);
                          setJobData(null);
                        }}
                        variant="outline"
                        className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Change Settings
                      </Button> */}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Status and Tips */}
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
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                        Job-Based
                      </Badge>
                    </div>
                    {jobData && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Position</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100 text-right max-w-xs truncate">
                          {jobData.position}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Questions Available</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {customInterviewData ? `${numQuestions} Generated` : 'Pending'}
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
                    Job Interview Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Research the company and role thoroughly</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Use the STAR method for behavioral questions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Mention specific skills from the job description</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Ask thoughtful questions about the role</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Video Call Interface - Show when custom interview is ready or started */}
        {!loadingJobData && customInterviewStarted && (
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
                    <span>Question {customQuestionIndex + 1} of {numQuestions}</span>
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

        {/* Content Area - Full Width for Interview Ready and Evaluation */}
        {/* Custom Interview Ready - Full Width */}
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
                    Job-Specific Interview Ready!
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Tailored for {jobData?.position || 'your role'}
                  </p>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                Based on the job requirements for <strong>{jobData?.position}</strong>, we&apos;ve generated <strong>{customInterviewData.questions?.length || 0} personalized questions</strong> 
                focusing on <strong>{jobData?.requiredSkills}</strong> and requiring <strong>{jobData?.requiredExperience}</strong> experience level.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={startCustomInterview}
                  className="bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Job-Specific Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interview Evaluation Results - Full Width */}
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
              <Card className={`rounded-xl mb-6 ${subtleCard} max-w-md mx-auto`}>
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
                {/* Strengths */}
                {/* {evaluationResults.strengths && evaluationResults.strengths.length > 0 && (
                  <Card className={`rounded-xl ${subtleCard}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">Your Strengths</h4>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        {evaluationResults.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )} */}

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
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">Actionable Recommendations</h4>
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

              <div className="text-center">
                <Button
                  onClick={resetInterview}
                  className="bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start New Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing States - Centered in page */}
        {(isGeneratingCustomInterview || isTranscribing) && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className={`rounded-2xl ${subtleCard} shadow-lg max-w-md w-full`}>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-16 h-16 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  {isTranscribing
                    ? 'Processing Your Responses'
                    : 'Generating Job-Specific Questions'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {isTranscribing
                    ? 'Analyzing your audio responses and converting them to text...'
                    : `Creating customized interview questions for ${jobData?.position || 'this role'}...`}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Area - Two Column Layout for Other Content */}
        {!isGeneratingCustomInterview && !isTranscribing && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">

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
                        AI is asking your job-specific question. Take your time to think and respond.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!isPlayingQuestion && !isRecording && !isTranscribing && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        Question completed. Ready to record your response?
                      </AlertDescription>
                    </Alert>
                  )}

                  {isRecording && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20">
                      <Mic className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-700 dark:text-red-300">
                        Recording your response to this job-specific question.
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
          </div>
        </div>
        )}

        {/* Evaluation Loading - Centered in page */}
        {(isEvaluating || (customInterviewComplete && !customInterviewStarted && !showEvaluation && !isTranscribing)) && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className={`rounded-2xl ${subtleCard} shadow-lg max-w-md w-full`}>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-16 h-16 text-green-600 dark:text-green-400 animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  {isEvaluating ? 'Evaluating Interview Performance' : 'Preparing Evaluation'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {isEvaluating ? 'Analyzing your responses and generating feedback...' : 'This may take a few moments'}
                </p>
              </CardContent>
            </Card>
          </div>
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
