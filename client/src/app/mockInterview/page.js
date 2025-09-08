"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function MockInterviewPage() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [responses, setResponses] = useState([]);
  const [audioRecordings, setAudioRecordings] = useState([]); // Store audio recordings
  const [customInterviewData, setCustomInterviewData] = useState(null);
  const [isGeneratingCustomInterview, setIsGeneratingCustomInterview] = useState(false);
  const [customInterviewStarted, setCustomInterviewStarted] = useState(false);
  const [customQuestionIndex, setCustomQuestionIndex] = useState(0);

  // For previous mock interviews
  const [profileId, setProfileId] = useState(null);
  const [previousMockInterviews, setPreviousMockInterviews] = useState([]);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [errorPrevious, setErrorPrevious] = useState('');
  
  // For interview evaluation
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  // Fetch profileId and previous mock interviews
  useEffect(() => {
    const fetchProfileAndInterviews = async () => {
      setLoadingPrevious(true);
      setErrorPrevious('');
      try {
        const token = localStorage.getItem("token");
        // Get profile info
        const profileRes = await fetch('http://localhost:8080/api/profile/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!profileRes.ok) throw new Error('Failed to fetch profile');
        const profileData = await profileRes.json();
        setProfileId(profileData.id);
        // Get previous mock interviews
        const mockRes = await fetch(`http://localhost:8080/api/interviews/mock-interviews/${profileData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!mockRes.ok) throw new Error('Failed to fetch previous mock interviews');
        const mockData = await mockRes.json();
        console.log('Previous Mock Interviews:', mockData);
        setPreviousMockInterviews(mockData);
      } catch (err) {
        setErrorPrevious(err.message || 'Error fetching previous mock interviews');
      } finally {
        setLoadingPrevious(false);
      }
    };
    fetchProfileAndInterviews();
  }, []);

  // Refetch previous interviews after a new one is completed
  useEffect(() => {
    if (interviewComplete && profileId) {
      const fetchPrevious = async () => {
        setLoadingPrevious(true);
        setErrorPrevious('');
        try {
          const token = localStorage.getItem("token");
          const mockRes = await fetch(`http://localhost:8080/api/interviews/mock-interviews/${profileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!mockRes.ok) throw new Error('Failed to fetch previous mock interviews');
          const mockData = await mockRes.json();
          setPreviousMockInterviews(mockData);
        } catch (err) {
          setErrorPrevious(err.message || 'Error fetching previous mock interviews');
        } finally {
          setLoadingPrevious(false);
        }
      };
      fetchPrevious();
    }
  }, [interviewComplete, profileId]);
  
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

  // Evaluate interview when custom interview transcription is complete
  useEffect(() => {
    if (!customInterviewStarted && !isTranscribing && responses.length > 5 && customInterviewData && !evaluationResults && !isEvaluating) {
      // Delay evaluation slightly to ensure all state updates are complete
      setTimeout(() => {
        evaluateInterview();
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customInterviewStarted, isTranscribing, responses.length, customInterviewData]);

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
        transcribeAllRecordings([...audioRecordings, newRecording]);
      }
    } else {
      // Handle regular interview responses
      const newRecording = {
        questionId: currentQuestion.id,
        questionTitle: currentQuestion.title,
        responseKey: currentQuestion.responseKey,
        audioBlob: audioBlob,
        timestamp: new Date().toISOString()
      };

      setAudioRecordings(prev => [...prev, newRecording]);
      
      // Move to next question or complete interview
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
        }, 1000);
      } else {
        // All questions answered - transcribe all recordings
        setInterviewComplete(true);
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
      
      setResponses(transcribedResponses);
      
    } catch (err) {
      setError('Failed to transcribe audio recordings. Please try again.');
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
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
    setAudioRecordings([]); // Clear audio recordings
    setIsRecording(false);
    setIsPlayingQuestion(false);
    setAudioBlob(null);
    setError('');
    setCustomInterviewData(null);
    setCustomInterviewStarted(false);
    setCustomQuestionIndex(0);
    setIsGeneratingCustomInterview(false);
    setEvaluationResults(null);
    setIsEvaluating(false);
    setShowEvaluation(false);
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
      
      // Add custom interview questions and their responses
      if (customInterviewData.questions && responses.length > 0) {
        for (let i = 0; i < customInterviewData.questions.length && i < responses.length - 5; i++) {
          const question = customInterviewData.questions[i];
          const response = responses[i + 5]; // Skip the initial 5 setup questions
          
          if (question && response && response.transcript) {
            questionAnswers.push({
              question: question.question,
              answer: response.transcript
            });
          }
        }
      }

      if (questionAnswers.length === 0) {
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
      setEvaluationResults(evaluationData);
      setShowEvaluation(true);

    } catch (err) {
      console.error('Evaluation error:', err);
      setError(`Failed to evaluate interview: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
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

      // Extract information from responses for storing mock interview
      const roleResponse = filteredResponses.find(r => r.questionId === 'getRole');
      const experienceResponse = filteredResponses.find(r => r.questionId === 'experience');
      const interviewTypeResponse = filteredResponses.find(r => r.questionId === 'interviewType');
      const numQuestionsResponse = filteredResponses.find(r => r.questionId === 'questionNumber');

      // Store mock interview data first
      if (profileId && roleResponse && experienceResponse && interviewTypeResponse && numQuestionsResponse) {
        const storeMockInterviewData = {
          profileId: profileId,
          role: roleResponse.transcript,
          experience: experienceResponse.transcript,
          interviewType: interviewTypeResponse.transcript,
          numQuestions: numQuestionsResponse.transcript
        };

        console.log('Storing mock interview data:', storeMockInterviewData);

        const storeResponse = await fetch('http://localhost:8080/api/interviews/store-mock-interview', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(storeMockInterviewData),
        });

        if (storeResponse.ok) {
          const storedData = await storeResponse.json();
          console.log('Mock interview stored successfully:', storedData);
          
          // Refresh previous mock interviews list
          const mockRes = await fetch(`http://localhost:8080/api/interviews/mock-interviews/${profileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (mockRes.ok) {
            const mockData = await mockRes.json();
            setPreviousMockInterviews(mockData);
          }
        } else {
          console.error('Failed to store mock interview:', await storeResponse.text());
        }
      }
      
      // Then generate custom interview
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

  // Design tokens (matching dashboard)
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
              AI Mock Interview
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Practice with our intelligent interview assistant
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm text-slate-700 text-sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Video Call Interface - Only show when interview is active */}
        {(interviewStarted || customInterviewStarted) && (
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
                  {interviewStarted && !interviewComplete && (
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  )}
                  {customInterviewStarted && (
                    <span>Custom Q{customQuestionIndex + 1} of {customInterviewData?.audioUrls?.length || 0}</span>
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
                    {!isPlayingQuestion && !isRecording && !isTranscribing && (interviewStarted || customInterviewStarted) && (
                      <Button
                        onClick={customInterviewStarted ? () => playCustomQuestion(customQuestionIndex) : playCurrentQuestion}
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

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Screen */}
            {!interviewStarted && !interviewComplete && (
              <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
                <CardContent className="p-8 text-center">
                  <div className="mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                      <Bot className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      Welcome to AI Mock Interview
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto leading-relaxed">
                      Experience a realistic interview environment with our AI interviewer. You&apos;ll be asked {questions.length - 1} questions 
                      to help you practice and improve your interview skills.
                    </p>
                  </div>
                  <Button
                    onClick={startInterview}
                    size="lg"
                    className="bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 hover:from-teal-700 hover:via-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Video className="w-5 h-5 mr-3" />
                    Join Interview Room
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Current Question Display (during interview) */}
            {interviewStarted && !interviewComplete && (
              <Card className={`rounded-2xl ${subtleCard} shadow-lg`}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100 text-xl">
                    <Target className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    {currentQuestion.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isPlayingQuestion && (
                    <Alert className="border-teal-200 bg-teal-50 dark:border-teal-700 dark:bg-teal-900/20">
                      <Volume2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <AlertDescription className="text-teal-700 dark:text-teal-300">
                        AI interviewer is asking the question. Listen carefully and prepare your response.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!isPlayingQuestion && !isRecording && !isTranscribing && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        Question completed. Click the microphone to record your answer.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isRecording && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20">
                      <Mic className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-700 dark:text-red-300">
                        Recording your response. Speak clearly and click the microphone when finished.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isTranscribing && (
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
                      <Loader2 className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-spin" />
                      <AlertDescription className="text-amber-700 dark:text-amber-300">
                        Processing all your responses. This may take a few moments...
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-center">
                    <div className="w-full max-w-md">
                      <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        <span>Progress</span>
                        <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                      </div>
                      <Progress 
                        value={((currentQuestionIndex + 1) / questions.length) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interview Complete Section */}
            {interviewComplete && !customInterviewStarted && (
              <div className="space-y-6">
                {(isGeneratingCustomInterview || isTranscribing) && (
                  <Card className={`rounded-2xl ${subtleCard} shadow-lg`}>
                    <CardContent className="p-8 text-center">
                      <Loader2 className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                        {isTranscribing
                          ? 'Processing Your Responses'
                          : 'Creating Personalized Questions'}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {isTranscribing
                          ? 'Analyzing your audio responses and converting them to text...'
                          : 'Generating customized interview questions based on your profile...'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {customInterviewData && !isGeneratingCustomInterview && !isTranscribing && (
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
                            Tailored questions for {customInterviewData.role}
                          </p>
                        </div>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                        We&apos;ve generated <strong>{customInterviewData.questions?.length || 0} personalized questions</strong> based on 
                        your experience level and target role. These questions will challenge you with real-world scenarios.
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={startCustomInterview}
                          className="bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Personalized Interview
                        </Button>
                        <Button
                          onClick={resetInterview}
                          variant="outline"
                          className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm"
                        >
                          Start Over
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Custom Interview Section */}
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
                    <span className="text-slate-600 dark:text-slate-400">Current Phase</span>
                    <Badge className={`text-xs ${
                      !interviewStarted 
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        : interviewComplete && customInterviewStarted
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : interviewComplete
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                    }`}>
                      {!interviewStarted 
                        ? 'Ready to Start'
                        : interviewComplete && customInterviewStarted
                          ? 'Personalized Round'
                          : interviewComplete
                            ? 'Initial Complete'
                            : 'In Progress'
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Questions Answered</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {interviewStarted ? `${currentQuestionIndex + (interviewComplete ? 1 : 0)}/${questions.length}` : '0/5'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Custom Questions</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {customInterviewData ? `${customInterviewData.questions?.length || 0} Generated` : 'Pending'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips & Instructions */}
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
                    <span>Listen carefully to each question</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Take a moment to organize your thoughts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Speak clearly and at a normal pace</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Use the STAR method for behavioral questions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>You can replay questions if needed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Previous Mock Interviews Section - only visible on welcome screen */}
        {!interviewStarted && !interviewComplete && (
          <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100 text-xl">
                <Clock className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                Previous Mock Interviews
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Review your interview history and track your progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingPrevious && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-teal-600 dark:text-teal-400 animate-spin mr-3" />
                  <span className="text-slate-600 dark:text-slate-400">Loading interview history...</span>
                </div>
              )}
              
              {errorPrevious && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    {errorPrevious}
                  </AlertDescription>
                </Alert>
              )}
              
              {!loadingPrevious && !errorPrevious && previousMockInterviews && previousMockInterviews.length === 0 && (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No previous interviews found</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">Start your first mock interview to see your history here</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {previousMockInterviews && previousMockInterviews.map((mock) => (
                  <Card 
                    key={mock.id} 
                    className={`group cursor-pointer rounded-xl ${subtleCard} hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
                    onClick={() => router.push(`/prev-mock-interview/${mock.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                              {mock.role}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {mock.interviewType} Interview
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Experience Level:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{mock.experience}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Questions Asked:</span>
                          <Badge variant="secondary" className="text-xs">
                            {mock.numQuestions}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/prev-mock-interview/${mock.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                {/* Strengths */}
                {/* {evaluationResults.strengths && evaluationResults.strengths.length > 0 && (
                  <Card className={`rounded-xl ${subtleCard}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">Strengths</h4>
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

        {/* Loading during evaluation */}
        {isEvaluating && (
          <Card className={`rounded-2xl ${subtleCard} shadow-lg`}>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-12 h-12 text-green-600 dark:text-green-400 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Evaluating Your Performance
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Our AI is analyzing your responses and generating detailed feedback...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Hidden audio element for playing questions */}
        <audio
          ref={questionAudioRef}
          onEnded={handleQuestionEnded}
          className="hidden"
        />
      </div>
    </div>
  );
}
