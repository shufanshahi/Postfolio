"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, BookOpen, Check, X, ChevronRight, Brain, FileUp, Clock } from 'lucide-react';
import MCQViewer from '@/components/MCQViewer';

const PreparationPage = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [mcqSets, setMcqSets] = useState([]);
  const [currentMCQSet, setCurrentMCQSet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please select a text file (.txt)');
      setSelectedFile(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect({ target: { files: [file] } });
    }
  };

  const validateInputs = () => {
    if (activeTab === 'upload' && !selectedFile) {
      setError('Please select a file');
      return false;
    }
    if (activeTab === 'text' && (!textContent.trim() || !documentName.trim())) {
      setError(activeTab === 'text' && !documentName.trim()
        ? 'Please enter a document name'
        : 'Please enter some text content');
      return false;
    }
    return true;
  };

  const generateMCQs = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      if (activeTab === 'upload') {
        const formData = new FormData();
        formData.append('document', selectedFile);
        // Use synchronous endpoint for immediate results
        response = await fetch('http://localhost:8080/api/preparation/generate-mcq-sync', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        response = await fetch('http://localhost:8080/api/preparation/generate-mcq-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            documentContent: textContent,
            documentName: documentName
          })
        });
      }

      if (!response.ok) throw new Error('Failed to generate MCQs');

      const data = await response.json();

      // Only set currentMCQSet if we have questions
      if (data.success && data.questions && data.questions.length > 0) {
        setCurrentMCQSet(data);
        setSuccess('MCQs generated successfully!');
      } else {
        setError('No questions were generated. Please try again with different content.');
      }

      // Reset form
      if (activeTab === 'upload') {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setTextContent('');
        setDocumentName('');
      }

      await loadMCQSets();
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMCQSets = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/preparation/mcq-sets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load MCQ sets');
      const data = await response.json();
      setMcqSets(data);
    } catch (err) {
      console.error('Failed to load MCQ sets:', err);
      setError('Failed to load MCQ sets');
    }
  };

  const loadMCQSet = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/preparation/mcq-sets/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load MCQ set');
      const data = await response.json();
      setCurrentMCQSet(data);
    } catch (err) {
      setError(err.message || 'Failed to load MCQ set');
    }
  };

  useEffect(() => {
    loadMCQSets();
  }, []);

  if (currentMCQSet) {
    return <MCQViewer mcqSet={currentMCQSet} onBack={() => setCurrentMCQSet(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center mb-3 md:mb-4">
            <Brain className="h-10 w-10 md:h-12 md:w-12 text-indigo-600 mr-2 md:mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Preparation Hub</h1>
          </div>
          <p className="text-gray-600 text-base md:text-lg">Generate personalized MCQs from your documents to ace your preparation</p>
        </div>

        {(error || success) && (
          <div className={`mb-4 md:mb-6 p-4 rounded-lg ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center">
              {error ? <X className="h-5 w-5 text-red-500 mr-2" /> : <Check className="h-5 w-5 text-green-500 mr-2" />}
              <span className={error ? "text-red-700" : "text-green-700"}>{error || success}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-3 md:py-4 px-4 md:px-6 text-center font-medium transition-colors ${activeTab === 'upload'
                        ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <FileUp className="h-5 w-5 inline mr-2" />
                    <span className="hidden sm:inline">Upload Document</span>
                    <span className="sm:hidden">Upload</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 py-3 md:py-4 px-4 md:px-6 text-center font-medium transition-colors ${activeTab === 'text'
                        ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <FileText className="h-5 w-5 inline mr-2" />
                    <span className="hidden sm:inline">Paste Text</span>
                    <span className="sm:hidden">Text</span>
                  </button>
                </div>
              </div>

              <div className="p-4 md:p-6 lg:p-8">
                {activeTab === 'upload' ? (
                  <div>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-3 md:mb-4" />
                      <p className="text-gray-600 mb-3 md:mb-4">
                        Drag and drop your text file here, or click to browse
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="fileInput"
                      />
                      <label
                        htmlFor="fileInput"
                        className="bg-indigo-600 text-white px-4 py-2 md:px-6 md:py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors inline-block"
                      >
                        Choose File
                      </label>
                    </div>

                    {selectedFile && (
                      <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center truncate">
                            <FileText className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0" />
                            <span className="text-gray-700 truncate">{selectedFile.name}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="text-red-500 hover:text-red-700 ml-2"
                            aria-label="Remove file"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                        Document Name
                      </label>
                      <input
                        type="text"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        placeholder="Enter a name for your document"
                        className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                        Document Content
                      </label>
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        rows={10}
                        placeholder="Paste your document content here..."
                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={generateMCQs}
                  disabled={loading || (activeTab === 'upload' ? !selectedFile : !textContent.trim() || !documentName.trim())}
                  className="w-full mt-4 md:mt-6 bg-indigo-600 text-white py-2 md:py-3 px-4 md:px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating MCQs... This may take up to 30 seconds
                    </span>
                  ) : (
                    'Generate 25 MCQs'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex items-center mb-4 md:mb-6">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-indigo-600 mr-2" />
                <h3 className="text-base md:text-lg font-semibold text-gray-800">Your MCQ Sets</h3>
              </div>

              {mcqSets.length === 0 ? (
                <p className="text-gray-500 text-center py-6 md:py-8">
                  No MCQ sets yet. Generate your first set!
                </p>
              ) : (
                <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto">
                  {mcqSets.map((mcqSet) => (
                    <div
                      key={mcqSet.id}
                      className="border rounded-lg p-3 md:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => loadMCQSet(mcqSet.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">
                            {mcqSet.documentName}
                          </h4>
                          <div className="flex items-center text-xs md:text-sm text-gray-500 mt-1">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            {new Date(mcqSet.createdAt).toLocaleDateString()}
                          </div>
                          <p className="text-xs md:text-sm text-indigo-600 mt-1">
                            {mcqSet.questions.length} questions
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 md:p-6">
              <h4 className="font-semibold text-indigo-800 mb-2 md:mb-3">How it works</h4>
              <ul className="space-y-2 text-xs md:text-sm text-indigo-700">
                <li className="flex items-start">
                  <span className="bg-indigo-200 text-indigo-800 rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">1</span>
                  Upload a text document or paste content
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-200 text-indigo-800 rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">2</span>
                  AI generates 25 relevant MCQs
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-200 text-indigo-800 rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">3</span>
                  Practice and get instant feedback
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreparationPage;