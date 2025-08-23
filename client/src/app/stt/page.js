"use client";

import { useState, useRef } from 'react';
import { AssemblyAI } from "assemblyai";

export default function STTPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Initialize AssemblyAI client
  const client = new AssemblyAI({
    apiKey: "09d85cff6d24428d88d54bb6dde7007d",
  });

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
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
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

  const transcribeAudio = async () => {
    if (!audioBlob) {
      setError('No audio recording found. Please record audio first.');
      return;
    }

    setIsTranscribing(true);
    setError('');
    setTranscript('');

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
        setTranscript(transcript.text);
      } else {
        setError('No speech detected in the audio recording.');
      }
    } catch (err) {
      setError('Failed to transcribe audio. Please try again.');
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearAll = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript('');
    setError('');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Speech to Text Converter
          </h1>
          
          {/* Recording Controls */}
          <div className="flex flex-col items-center space-y-6 mb-8">
            <div className="flex space-x-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
                >
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                  <span>Stop Recording</span>
                </button>
              )}
              
              {audioBlob && (
                <button
                  onClick={clearAll}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Clear All
                </button>
              )}
            </div>

            {isRecording && (
              <div className="flex items-center space-x-2 text-red-500">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Recording...</span>
              </div>
            )}
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Recorded Audio:</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}

          {/* Transcription Controls */}
          {audioBlob && (
            <div className="mb-8 text-center">
              <button
                onClick={transcribeAudio}
                disabled={isTranscribing}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
              >
                {isTranscribing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Transcribing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Transcribe Audio</span>
                  </>
                )}
              </button>
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

          {/* Transcript Display */}
          {transcript && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Transcription:</h3>
              <div className="bg-gray-100 border rounded-lg p-6">
                <p className="text-gray-800 leading-relaxed">{transcript}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">How to Use:</h3>
            <ol className="list-decimal list-inside text-blue-700 space-y-2">
              <li>Click &quot;Start Recording&quot; to begin capturing audio</li>
              <li>Speak clearly into your microphone</li>
              <li>Click &quot;Stop Recording&quot; when finished</li>
              <li>Play back your recording to verify</li>
              <li>Click &quot;Transcribe Audio&quot; to convert speech to text</li>
              <li>View your transcription results below</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
