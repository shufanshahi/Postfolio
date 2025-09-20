'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Upload, MessageCircle, FileText, Send, Loader2, Bot, User, AlertCircle, CheckCircle, Sparkles, BrainCircuit } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function RagTestPage() {
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentProcessed, setDocumentProcessed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const fileInputRef = useRef(null);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessages([{
        type: 'error',
        content: 'You must be logged in to use the AI Document Assistant. Please log in and try again.',
        timestamp: new Date().toLocaleTimeString()
      }]);
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  }, []);

  // Design tokens matching dashboard
  const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
  const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

  const handleFileUpload = async (event) => {
    if (!isAuthenticated) {
      alert('Please log in to upload documents');
      return;
    }
    
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setIsProcessing(true);
      
      // Clear previous messages and show uploading status
      if (documentProcessed) {
        setMessages([{
          type: 'system',
          content: `Replacing previous document with "${uploadedFile.name}"...`
        }]);
      }
      
      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:8080/api/rag/upload', {
          method: 'POST',
            headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (response.ok) {
          setDocumentProcessed(true);
          setMessages([{
            type: 'system',
            content: `Document "${uploadedFile.name}" has been processed successfully with semantic embeddings. Previous document has been replaced. You can now ask questions about the new content.`,
            timestamp: new Date().toLocaleTimeString()
          }]);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed. Please log in again.');
        } else {
          const errorData = await response.text();
          throw new Error(errorData || 'Failed to process document');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setMessages([{
          type: 'error',
          content: error.message || 'Failed to process the document. Please try again.',
          timestamp: new Date().toLocaleTimeString()
        }]);
      } finally {
        setIsProcessing(false);
      }
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleAskQuestion = async () => {
    if (!isAuthenticated) {
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Please log in to ask questions',
        timestamp: new Date().toLocaleTimeString()
      }]);
      return;
    }
    
    if (!currentQuestion.trim() || !documentProcessed) return;

    const userMessage = {
      type: 'user',
      content: currentQuestion,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    const questionToProcess = currentQuestion;
    setCurrentQuestion('');

    try {
              const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8080/api/rag/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: questionToProcess
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: data.answer,
          context: data.context,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed. Please log in again.');
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to get answer');
      }
    } catch (error) {
      console.error('Error asking question:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: error.message || 'Failed to get an answer. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradients matching dashboard */}
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>

      <Navbar />

      <div className="container mx-auto p-6 max-w-6xl relative">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 via-indigo-500 to-purple-500 text-white shadow-lg">
              <BrainCircuit className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">AI Document Assistant</h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                Upload any PDF document and chat with it using advanced semantic search and AI understanding
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-6">
            <Badge className="bg-teal-500/15 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300 rounded-full px-4 py-2 h-8 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Semantic Search Enabled
            </Badge>
            <Badge className="bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300 rounded-full px-4 py-2 h-8 text-sm font-medium">
              <Bot className="h-4 w-4 mr-2" />
              Groq Llama 3.3 70B
            </Badge>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Upload Section */}
          <Card className={`rounded-2xl ${subtleCard} shadow-lg hover:shadow-xl transition-all duration-300`}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100 text-xl font-semibold">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Upload className="h-5 w-5" />
                </div>
                Document Upload
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Upload a PDF document to start your AI-powered conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    file 
                      ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 shadow-inner' 
                      : 'border-slate-300 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {isProcessing ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-teal-600 dark:text-teal-400" />
                        <div className="absolute inset-0 rounded-full bg-teal-100 dark:bg-teal-900/20 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-slate-800 dark:text-slate-200">Processing document...</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Generating semantic embeddings</p>
                      </div>
                    </div>
                  ) : file ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                          <FileText className="h-8 w-8" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</p>
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 rounded-full px-3 py-1">
                          Ready for questions
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300">
                        <Upload className="h-8 w-8" />
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="font-medium text-slate-800 dark:text-slate-200">Click to upload PDF</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Or drag and drop your file here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className={`rounded-2xl ${subtleCard} shadow-lg hover:shadow-xl transition-all duration-300`}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100 text-xl font-semibold">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <MessageCircle className="h-5 w-5" />
                </div>
                AI Conversation
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Ask questions about your document using natural language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Messages Container */}
                <div className="h-80 overflow-y-auto border rounded-2xl p-4 bg-gradient-to-br from-slate-50/50 to-white/80 dark:from-slate-900/50 dark:to-slate-800/80 backdrop-blur-sm space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300">
                        <Bot className="h-8 w-8" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-slate-700 dark:text-slate-300">Ready to chat with your document</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Upload a PDF to start the conversation</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 ${
                            message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            message.type === 'user'
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                              : message.type === 'error'
                              ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white'
                              : message.type === 'system'
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                              : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                          }`}>
                            {message.type === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : message.type === 'error' ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : message.type === 'system' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>

                          {/* Message Content */}
                          <div className={`flex-1 max-w-[80%] ${
                            message.type === 'user' ? 'text-right' : 'text-left'
                          }`}>
                            <div className={`rounded-2xl px-4 py-3 ${
                              message.type === 'user'
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                : message.type === 'error'
                                ? 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800'
                                : message.type === 'system'
                                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600'
                            }`}>
                              <div className="space-y-2">
                                <div className={`text-sm ${
                                  message.type === 'user' ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                  {message.content}
                                </div>
                                {message.timestamp && (
                                  <div className={`text-xs flex items-center gap-1 ${
                                    message.type === 'user' 
                                      ? 'text-blue-100 justify-end' 
                                      : 'text-slate-500 dark:text-slate-400'
                                  }`}>
                                    {message.timestamp}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Context section for AI responses */}
                            {/* {message.context && (
                              <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                                    Retrieved Context
                                  </span>
                                </div>
                                <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed max-h-20 overflow-y-auto">
                                  {message.context}
                                </div>
                              </div>
                            )} */}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Question Input */}
                <div className="flex gap-3">
                  <Textarea
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={documentProcessed ? "Ask anything about your document..." : "Upload a document first to start chatting"}
                    disabled={!documentProcessed || isLoading}
                    className="flex-1 rounded-xl border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm focus:ring-teal-500 focus:border-teal-500 resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleAskQuestion}
                    disabled={!documentProcessed || !currentQuestion.trim() || isLoading}
                    className="self-end px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Section */}
        <Card className={`mt-8 ${gradientPanel} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,theme(colors.teal.200)/40,transparent_60%)] dark:bg-[radial-gradient(circle_at_20%_20%,oklch(0.3_0.05_210)/40,transparent_60%)]" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-4 w-4 rounded-full ${
                  documentProcessed 
                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' 
                    : 'bg-slate-300 dark:bg-slate-600'
                } transition-all duration-300`} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {documentProcessed ? 'AI Assistant Ready' : 'Waiting for document...'}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {documentProcessed 
                      ? 'Semantic search and embeddings active' 
                      : 'Upload a PDF to begin'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="bg-teal-500/15 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300 rounded-full px-3 py-1 text-xs font-medium">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Semantic Search
                </Badge>
                <Badge className="bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300 rounded-full px-3 py-1 text-xs font-medium">
                  <Bot className="h-3 w-3 mr-1" />
                  Groq Llama 3.3 70B
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
