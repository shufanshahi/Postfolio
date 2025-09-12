"use client"
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
import { Upload, FileText, BookOpen, Check, X, ChevronRight, Brain, FileUp, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MCQViewer from '@/components/MCQViewer';

// Design tokens borrowed from dashboard for cohesive theming
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

const PreparationPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [mcqSets, setMcqSets] = useState([]);
  const [currentMCQSet, setCurrentMCQSet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const isTextFile = file.type === 'text/plain' || file.name.endsWith('.txt');
    const isPdfFile = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (isTextFile || isPdfFile) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please select a text file (.txt) or PDF file (.pdf)');
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
        formData.append('questionCount', questionCount.toString());
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
            documentName: documentName,
            questionCount: questionCount
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow ring-1 ring-white/40">
                <Brain className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">Preparation Hub</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">Generate personalized MCQs from your documents to ace your preparation</p>
          </div>
        </div>

        {(error || success) && (
          <div className={`rounded-2xl p-4 backdrop-blur ${error ? 'bg-rose-50/80 border border-rose-200/70 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30' : 'bg-emerald-50/80 border border-emerald-200/70 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {error ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {error || success}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className={`rounded-2xl overflow-hidden ${subtleCard} shadow-sm`}>
              <div className="flex border-b border-teal-900/10 dark:border-slate-700/60">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-4 px-6 text-sm font-medium tracking-wide transition-all border-b-2 ${activeTab === 'upload' ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white/60 dark:bg-slate-900/40' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <FileUp className="inline h-4 w-4 mr-2" /> Upload Document
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-4 px-6 text-sm font-medium tracking-wide transition-all border-b-2 ${activeTab === 'text' ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white/60 dark:bg-slate-900/40' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <FileText className="inline h-4 w-4 mr-2" /> Paste Text
                </button>
              </div>
              <div className="p-8 space-y-8">
                {activeTab === 'upload' ? (
                  <div className="space-y-6">
                    <div
                      className="border-2 border-dashed border-teal-900/15 dark:border-slate-700/60 hover:border-indigo-500/40 rounded-2xl p-10 text-center transition-colors cursor-pointer bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">Drag & drop your text or PDF file here, or click to browse</p>
                      <input ref={fileInputRef} type="file" accept=".txt,.pdf,text/plain,application/pdf" onChange={handleFileSelect} className="hidden" id="fileInput" />
                      <label htmlFor="fileInput" className="inline-flex items-center h-10 px-6 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium shadow-sm cursor-pointer transition-colors">Choose File</label>
                    </div>
                    {selectedFile && (
                      <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center min-w-0 gap-2">
                          <FileText className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{selectedFile.name}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400">Document Name</label>
                      <input
                        type="text"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        placeholder="Enter a name"
                        className="w-full h-11 px-4 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 backdrop-blur"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400">Document Content</label>
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        rows={10}
                        placeholder="Paste your document content here..."
                        className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 resize-none leading-relaxed backdrop-blur"
                      />
                    </div>
                  </div>
                )}

                {/* Question Count Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400">Number of Questions</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[10, 20, 30].map((count) => (
                      <button
                        key={count}
                        onClick={() => setQuestionCount(count)}
                        className={`h-11 rounded-xl text-sm font-medium transition-all ${questionCount === count
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800/60'
                          }`}
                      >
                        {count} MCQs
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <button
                    onClick={generateMCQs}
                    disabled={loading || (activeTab === 'upload' ? !selectedFile : !textContent.trim() || !documentName.trim())}
                    className="w-full h-11 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading && (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {loading ? 'Generating MCQs (up to 30s)...' : `Generate ${questionCount} MCQs`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className={`rounded-2xl p-6 ${subtleCard} shadow-sm`}>
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm mr-3">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Your MCQ Sets</h3>
              </div>
              {mcqSets.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-10 text-sm">No MCQ sets yet. Generate your first set!</p>
              ) : (
                <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1 custom-scrollbar">
                  {mcqSets.map(mcqSet => (
                    <div
                      key={mcqSet.id}
                      className="group p-4 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 hover:border-teal-500/40 cursor-pointer transition-colors flex items-start gap-4"
                      onClick={() => loadMCQSet(mcqSet.id)}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-medium text-slate-800 dark:text-slate-100 truncate text-sm group-hover:text-slate-900 dark:group-hover:text-slate-50">{mcqSet.documentName}</h4>
                        <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400 gap-1">
                          <Clock className="h-3 w-3" /> {new Date(mcqSet.createdAt).toLocaleDateString()}
                        </div>
                        <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">{mcqSet.questions.length} questions</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`rounded-2xl p-6 ${gradientPanel} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,theme(colors.indigo.300)/35,transparent_70%)] dark:bg-[radial-gradient(circle_at_20%_30%,oklch(0.35_0.1_265)/25,transparent_70%)]" />
              <div className="relative space-y-4">
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 text-sm uppercase tracking-wide">How it works</h4>
                <ul className="space-y-3 text-xs text-indigo-700 dark:text-indigo-300">
                  {['Upload a text or PDF document or paste content', 'AI generates 25 relevant MCQs', 'Practice and get instant feedback'].map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px] font-semibold shadow-sm">{i + 1}</span>
                      <span className="leading-snug flex-1">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(PreparationPage);