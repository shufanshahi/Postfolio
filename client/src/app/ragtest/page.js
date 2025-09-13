'use client';

import { useState, useRef } from 'react';
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Upload, MessageCircle, FileText, Send, Loader2 } from "lucide-react";

export default function RagTestPage() {
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentProcessed, setDocumentProcessed] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
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
            content: `Document "${uploadedFile.name}" has been processed successfully. Previous document has been replaced. You can now ask questions about the new content.`
          }]);
        } else {
          throw new Error('Failed to process document');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setMessages([{
          type: 'error',
          content: 'Failed to process the document. Please try again.'
        }]);
      } finally {
        setIsProcessing(false);
      }
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim() || !documentProcessed) return;

    const userMessage = {
      type: 'user',
      content: currentQuestion
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
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
          question: currentQuestion
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: data.answer,
          context: data.context
        }]);
      } else {
        throw new Error('Failed to get answer');
      }
    } catch (error) {
      console.error('Error asking question:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Failed to get an answer. Please try again.'
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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">RAG Document Q&A</h1>
        <p className="text-gray-600">Upload a PDF document and ask questions about its content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Upload
            </CardTitle>
            <CardDescription>
              Upload a PDF document to start asking questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
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
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                    <p>Processing document...</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="h-8 w-8 text-green-500 mb-2" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">Document ready for questions</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p>Click to upload PDF</p>
                    <p className="text-sm text-gray-500">Or drag and drop</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Ask Questions
            </CardTitle>
            <CardDescription>
              Chat with your document using AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Messages */}
              <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Upload a document to start chatting
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-100 ml-8'
                            : message.type === 'error'
                            ? 'bg-red-100'
                            : 'bg-white mr-8'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {message.type === 'user' ? 'You' : 
                           message.type === 'error' ? 'Error' : 
                           message.type === 'system' ? 'System' : 'AI Assistant'}
                        </div>
                        <div className="text-sm">{message.content}</div>
                        {/* {message.context && (
                          <div className="mt-2 text-xs text-gray-600 border-t pt-2">
                            <strong>Context:</strong> {message.context}
                          </div>
                        )} */}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Question Input */}
              <div className="flex gap-2">
                <Textarea
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={documentProcessed ? "Ask a question about your document..." : "Upload a document first"}
                  disabled={!documentProcessed || isLoading}
                  className="flex-1"
                  rows={2}
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={!documentProcessed || !currentQuestion.trim() || isLoading}
                  size="sm"
                  className="self-end"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Section */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${documentProcessed ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">
                {documentProcessed ? 'Document ready for questions' : 'No document uploaded'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Powered by Groq AI (Llama 3.3 70B)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
