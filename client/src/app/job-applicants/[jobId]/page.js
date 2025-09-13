"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Dialog } from "@headlessui/react";
import { useParams, useRouter } from "next/navigation";
import { jobServiceFetch } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, Users, Calendar, Clock, Mail, Video, CheckCircle, 
  XCircle, UserCheck, Eye, MoreVertical, Briefcase, MapPin, 
  DollarSign, Filter, Search, Settings, Activity, Target,
  TrendingUp, Award, Star, Loader2, Zap, FileText
} from 'lucide-react';

export default function JobApplicants() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId;

  // Design tokens matching dashboard
  const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
  const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

  // Section state: 'applicants', 'rejected', 'selected'
  const [section, setSection] = useState('applicants');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // For scheduling interview
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [scheduleInput, setScheduleInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [applicantsWithDetails, setApplicantsWithDetails] = useState([]);
  
  // Auto-select state
  const [showAutoSelect, setShowAutoSelect] = useState(false);
  const [autoSelectLoading, setAutoSelectLoading] = useState(false);
  const [autoSelectData, setAutoSelectData] = useState({
    offerLetter: "",
    desiredSelectNumber: "",
    letterExpiry: ""
  });
  const [autoSelectError, setAutoSelectError] = useState("");
  
  // Select with score state
  const [showSelectScore, setShowSelectScore] = useState(false);
  const [selectedApplicantForScore, setSelectedApplicantForScore] = useState(null);
  const [scoreInput, setScoreInput] = useState("");
  const [scoreError, setScoreError] = useState("");
  const [scoreLoading, setScoreLoading] = useState(false);
  const [profilePictures, setProfilePictures] = useState({});
  
  const handleScheduleClick = (applicantId) => {
    setSelectedApplicant(applicantId);
    setShowSchedule(true);
    setScheduleInput("");
    setNotesInput("");
    setScheduleError("");
  };

  // Handle auto-select modal
  const handleAutoSelectClick = () => {
    setShowAutoSelect(true);
    setAutoSelectData({
      offerLetter: "",
      desiredSelectNumber: "",
      letterExpiry: ""
    });
    setAutoSelectError("");
  };

  // Handle auto-select submission
  const handleAutoSelectSubmit = async (e) => {
    e.preventDefault();
    setAutoSelectError("");
    
    // Validation
    if (!autoSelectData.offerLetter.trim()) {
      setAutoSelectError("Offer letter content is required.");
      return;
    }
    if (!autoSelectData.desiredSelectNumber || autoSelectData.desiredSelectNumber < 1) {
      setAutoSelectError("Please enter a valid number of candidates to select.");
      return;
    }
    if (!autoSelectData.letterExpiry) {
      setAutoSelectError("Letter expiry date is required.");
      return;
    }

    setAutoSelectLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // First, activate all candidates for this job
      const activateResponse = await fetch(`http://localhost:8080/api/job-candidates/job/${jobId}/activate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          desiredSelectNumber: parseInt(autoSelectData.desiredSelectNumber),
          expireDate: autoSelectData.letterExpiry
        }),
      });

      if (!activateResponse.ok) {
        throw new Error("Failed to activate candidates");
      }

      // Then proceed with auto-select
      const response = await fetch(`http://localhost:8080/api/jobs/${jobId}/auto-select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          offerLetter: autoSelectData.offerLetter,
          desiredSelectNumber: parseInt(autoSelectData.desiredSelectNumber),
          letterExpiry: autoSelectData.letterExpiry
        }),
      });

      if (response.ok) {
        setShowAutoSelect(false);
        alert("Auto-select process started successfully!");
        // Refresh job data to show updated status
        await fetchJobApplicants();
      } else {
        const errorData = await response.text();
        setAutoSelectError(`Failed to start auto-select: ${errorData || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error starting auto-select:", error);
      setAutoSelectError("Error starting auto-select process.");
    } finally {
      setAutoSelectLoading(false);
    }
  };

    // Handle reject applicant
  const handleRejectApplicant = async (applicantId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/jobs/${jobId}/reject/${applicantId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        alert("Applicant rejected successfully!");
        fetchJobApplicants();
      } else {
        alert("Failed to reject applicant.");
      }
    } catch (error) {
      console.error("Error rejecting applicant:", error);
      alert("Error rejecting applicant.");
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleInput) {
      setScheduleError("Schedule date/time is required.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      console.log("Scheduling interview for applicant:", jobId, selectedApplicant, scheduleInput, notesInput);
      
      // Check if this is a reschedule by checking if interview already exists
      const existingInterview = applicantsWithDetails.find(
        applicant => applicant.applicantId === selectedApplicant
      )?.interview;
      
      const res = await fetch("http://localhost:8080/api/interviews/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId,
          profileId: selectedApplicant,
          schedule: scheduleInput + ":00",
          notes: notesInput,
          status: "PENDING"
        }),
        
      });
      
      if (res.ok) {
        // If this was a reschedule (existing interview), update status to PENDING
        if (existingInterview) {
          try {
            const statusUpdateRes = await fetch(`http://localhost:8080/api/interviews/update-status?profileId=${selectedApplicant}&jobId=${jobId}&status=PENDING`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (!statusUpdateRes.ok) {
              console.error("Failed to update interview status after reschedule");
            }
          } catch (error) {
            console.error("Error updating interview status after reschedule:", error);
          }
        }
        
        setShowSchedule(false);
        alert(existingInterview ? "Interview rescheduled!" : "Interview scheduled!");
        
        // Refresh the applicants with details to show updated status
        const fetchApplicantsWithInterviewDetails = async () => {
          if (job?.applicantIds) {
            const applicantsWithDetails = await Promise.all(
              job.applicantIds.map(async (applicantId) => {
                const interview = await fetchInterviewDetails(applicantId);
                return {
                  applicantId,
                  interview,
                };
              })
            );
            setApplicantsWithDetails(applicantsWithDetails);
          }
        };
        await fetchApplicantsWithInterviewDetails();
      } else {
        setScheduleError("Failed to schedule interview.");
      }
    } catch {
      setScheduleError("Error scheduling interview.");
    }
  };

  const handleViewProfile = (applicantId) => {
    router.push(`/user/${applicantId}`);
  };

  const fetchJobApplicants = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in. Please login first.");
        router.push("/login");
        return;
      }

      const res = await jobServiceFetch(`/api/jobs/employer/ajob/${jobId}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError("Job not found.");
        } else if (res.status === 401) {
          setError("Unauthorized. Please login again.");
          router.push("/login");
        } else {
          setError("Failed to fetch job applicants. Please try again.");
        }
        return;
      }

      const jobData = await res.json();
      setJob(jobData);
    } catch (err) {
      console.error("Error fetching job applicants:", err);
      setError("An error occurred while fetching job applicants.");
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchJobApplicants();
  }, [jobId, router, fetchJobApplicants]);

  const fetchInterviewDetails = useCallback(async (applicantId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/interviews/profile/${applicantId}/job/${jobId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (error) {
      console.error("Error fetching interview details:", error);
      return null;
    }
  }, [jobId]);

  const fetchProfileDetails = useCallback(async (profileId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/profile/${profileId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const profileData = await res.json();
        
        // Store profile picture if available
        if (profileData && profileData.pictureBase64) {
          setProfilePictures(prev => ({
            ...prev,
            [profileId]: profileData.pictureBase64
          }));
        }
        
        return profileData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching profile details:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchApplicantsWithInterviewDetails = async () => {
      if (job?.applicantIds) {
        const applicantsWithDetails = await Promise.all(
          job.applicantIds.map(async (applicantId) => {
            const interview = await fetchInterviewDetails(applicantId);
            const profile = await fetchProfileDetails(applicantId);
            return {
              applicantId,
              interview,
              profile,
            };
          })
        );
        setApplicantsWithDetails(applicantsWithDetails);
      }
    };

    fetchApplicantsWithInterviewDetails();
  }, [job, fetchInterviewDetails, fetchProfileDetails]);

  const handleStartInterview = async (applicantId) => {
    try {
      const token = localStorage.getItem("token");
      
      // First, get the interview details
      const interviewRes = await fetch(`http://localhost:8080/api/interviews/profile/${applicantId}/job/${jobId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!interviewRes.ok) {
        alert("Interview not found. Please schedule an interview first.");
        return;
      }
      
      const interviewData = await interviewRes.json();
      
      // Update interview status to ONGOING
      const updateRes = await fetch(`http://localhost:8080/api/interviews/update-status?profileId=${applicantId}&jobId=${jobId}&status=ONGOING`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (updateRes.ok) {
        // Use plain interview ID as room ID and mark this user as host
        const roomId = `${interviewData.id}`;
        router.push(`/videoCall/${roomId}?role=host`);
      } else {
        alert("Failed to update interview status.");
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      alert("Error starting interview.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,theme(colors.teal.100)_0%,theme(colors.teal.50)_35%,theme(colors.white)_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,oklch(0.3_0.05_210)_0%,oklch(0.22_0.025_250)_60%)]">
        <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(circle_at_center,white,transparent)]">
          <div className="absolute top-10 left-1/4 h-64 w-64 bg-teal-300/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 h-72 w-72 bg-indigo-300/30 rounded-full blur-3xl animate-pulse [animation-delay:200ms]" />
        </div>
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <Loader2 className="h-9 w-9 animate-spin text-teal-600 dark:text-teal-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading job applicants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,theme(colors.teal.100)_0%,theme(colors.teal.50)_35%,theme(colors.white)_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,oklch(0.3_0.05_210)_0%,oklch(0.22_0.025_250)_60%)]">
        <div className="max-w-md mx-auto text-center">
          <Card className={`${subtleCard} shadow-sm`}>
            <CardContent className="p-6">
              <XCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Error Loading Job</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
              <Button 
                onClick={() => router.back()}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle select applicant
  const handleSelectApplicant = async (applicantId) => {
    setSelectedApplicantForScore(applicantId);
    setShowSelectScore(true);
    setScoreInput("");
    setScoreError("");
  };

  // Handle select with score submission
  const handleSelectWithScore = async (e) => {
    e.preventDefault();
    setScoreError("");
    
    // Validation
    if (!scoreInput || scoreInput < 0 || scoreInput > 100) {
      setScoreError("Please enter a valid score between 0 and 100.");
      return;
    }

    setScoreLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // First create the JobCandidate
      const candidateResponse = await fetch(`http://localhost:8080/api/job-candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: parseInt(jobId),
          profileId: selectedApplicantForScore,
          status: "PROCESSING",
          score: parseFloat(scoreInput)
        }),
      });

      if (!candidateResponse.ok) {
        const errorData = await candidateResponse.text();
        setScoreError(`Failed to create job candidate: ${errorData || 'Unknown error'}`);
        return;
      }

      // Then select the applicant as before
      const selectResponse = await fetch(`http://localhost:8080/api/jobs/${jobId}/select/${selectedApplicantForScore}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (selectResponse.ok) {
        setShowSelectScore(false);
        alert("Applicant selected successfully and job candidate created!");
        // Refresh job data to update selected applicants
        fetchJobApplicants();
      } else {
        setScoreError("Failed to select applicant.");
      }
    } catch (error) {
      console.error("Error selecting applicant:", error);
      setScoreError("Error selecting applicant.");
    } finally {
      setScoreLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradients matching dashboard */}
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm text-slate-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
              <Briefcase className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
              Job Applicants
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              Manage applications and schedule interviews
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Auto-select Button */}
            <Button
              onClick={handleAutoSelectClick}
              className={`${
                job?.autoSelectStatus === 'OFF' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              } transition-all duration-200 rounded-full`}
              disabled={!job?.applicantIds?.length || job?.autoSelectStatus !== 'OFF'}
            >
              <Zap className="h-4 w-4 mr-2" />
              Auto-Select {job?.autoSelectStatus !== 'OFF' ? `(${job?.autoSelectStatus || 'OFF'})` : ''}
            </Button>
            
            {/* Section Tabs */}
            <div className="flex gap-2 p-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur rounded-full border border-slate-300/60 dark:border-slate-700/60">
              {[
                { key: 'applicants', label: 'Applicants', icon: Users },
                { key: 'selected', label: 'Selected', icon: CheckCircle },
                { key: 'rejected', label: 'Rejected', icon: XCircle },
                ...(job?.autoSelectStatus === 'COMPLETED' ? [{ key: 'hired', label: 'Hired', icon: Award }] : [])
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={section === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSection(key)}
                  className={`rounded-full text-sm transition-all duration-200 ${
                    section === key 
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Job Details Card */}
        {job && (
          <Card className={`${subtleCard} shadow-sm rounded-2xl overflow-hidden`}>
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-teal-50/70 via-transparent to-amber-50/60 dark:from-teal-500/10 dark:to-indigo-500/10 pointer-events-none" />
            <CardHeader className="relative pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Position:</span> {job.position}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Posted: {job.datePosted}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ends: {job.endDate}
                      </div>
                    </div>
                  </CardDescription>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 min-w-0 sm:min-w-[500px]">
                  <div className="text-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl backdrop-blur">
                    <div className="text-lg font-bold text-teal-600 dark:text-teal-400">{job.applicantIds?.length || 0}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Total</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl backdrop-blur">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">{job.selectedApplicantIds?.length || 0}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Selected</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl backdrop-blur">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">{job.rejectedApplicantIds?.length || 0}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Rejected</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl backdrop-blur">
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{job.acceptedByProfileIds?.length || 0}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Hired</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl backdrop-blur">
                    <Badge 
                      variant="outline" 
                      className={`font-medium text-xs ${
                        job.autoSelectStatus === 'OFF' ? 'bg-slate-100/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200' :
                        job.autoSelectStatus === 'ONGOING' ? 'bg-blue-100/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                        job.autoSelectStatus === 'COMPLETED' ? 'bg-green-100/80 dark:bg-green-500/20 text-green-700 dark:text-green-300' :
                        'bg-slate-100/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      Auto-Select: {job.autoSelectStatus || 'OFF'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative space-y-6">
              {/* Salary Range */}
              {(job.minSalary || job.maxSalary) && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50/60 dark:bg-emerald-500/10 rounded-xl">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Salary: {job.minSalary && job.maxSalary ? `$${job.minSalary} - $${job.maxSalary}` : 'Negotiable'}
                  </span>
                </div>
              )}

              {/* Description */}
              {job.description && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    Job Description
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/60 dark:bg-slate-800/60 rounded-xl p-4">
                    {job.description}
                  </p>
                </div>
              )}

              {/* Requirements Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { label: 'Required Project', value: job.requiredProject, icon: Target },
                  { label: 'Required Experience', value: job.requiredExperience, icon: Award },
                  { label: 'Required Skills', value: job.requiredSkills, icon: Star },
                  { label: 'Required Education', value: job.requiredEducation, icon: Activity }
                ].filter(item => item.value).map((requirement, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <requirement.icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      {requirement.label}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed bg-slate-50/60 dark:bg-slate-800/60 rounded-lg p-3">
                      {requirement.value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Applicants Section */}
        {section === 'applicants' && (
          <Card className={`${subtleCard} shadow-sm rounded-2xl overflow-hidden`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    Active Applicants
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {job?.applicantIds?.length ? 
                      `${applicantsWithDetails.filter(({ applicantId }) => {
                        const selectedIds = job?.selectedApplicantIds || [];
                        const rejectedIds = job?.rejectedApplicantIds || [];
                        return !selectedIds.includes(applicantId) && !rejectedIds.includes(applicantId);
                      }).length} candidate(s) awaiting review` : 
                      "No active applications"
                    }
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-teal-50/60 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-400/30">
                  <Activity className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!job?.applicantIds || applicantsWithDetails.filter(({ applicantId }) => {
                const selectedIds = job?.selectedApplicantIds || [];
                const rejectedIds = job?.rejectedApplicantIds || [];
                return !selectedIds.includes(applicantId) && !rejectedIds.includes(applicantId);
              }).length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No Active Applicants</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-500">Applications will appear here when candidates apply for this position.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applicantsWithDetails
                    .filter(({ applicantId }) => {
                      const selectedIds = job?.selectedApplicantIds || [];
                      const rejectedIds = job?.rejectedApplicantIds || [];
                      return !selectedIds.includes(applicantId) && !rejectedIds.includes(applicantId);
                    })
                    .map(({ applicantId, interview, profile }, index) => (
                      <Card 
                        key={applicantId} 
                        className="group hover:shadow-md transition-all duration-200 border-0 shadow-sm bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:-translate-y-0.5"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12 ring-2 ring-white/60 dark:ring-slate-600/60 shadow-sm">
                                <AvatarImage 
                                  src={profilePictures[applicantId] 
                                    ? `data:image/jpeg;base64,${profilePictures[applicantId]}`
                                    : (profile?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${applicantId}`)
                                  } 
                                  alt={profile?.name} 
                                />
                                <AvatarFallback className="bg-gradient-to-br from-teal-400 to-indigo-500 text-white font-semibold">
                                  {profile?.name ? profile.name.charAt(0).toUpperCase() : index + 1}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                                  {profile?.name || `Applicant ${index + 1}`}
                                </h4>
                                {profile?.email && (
                                  <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                                    <Mail className="h-3 w-3" />
                                    {profile.email}
                                  </div>
                                )}
                                {interview && (
                                  <div className="flex items-center gap-1">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        interview.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        interview.status === 'ONGOING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        interview.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                        'bg-slate-50 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      <Clock className="h-3 w-3 mr-1" />
                                      Interview: {interview.status}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewProfile(applicantId)}
                                className="bg-white/60 dark:bg-slate-700/60 border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Profile
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                                onClick={() => handleScheduleClick(applicantId)}
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                {interview ? "Reschedule" : "Schedule"}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-400/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/20"
                                onClick={() => handleSelectApplicant(applicantId)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Select
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-400/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20"
                                onClick={() => handleRejectApplicant(applicantId)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-400/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                                onClick={() => handleStartInterview(applicantId)}
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Interview
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* Schedule Modal */}
        {showSchedule && (
          <Dialog open={showSchedule} onClose={() => setShowSchedule(false)} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen bg-black/50 backdrop-blur-sm">
              <Dialog.Panel className={`${subtleCard} p-6 rounded-2xl shadow-xl w-full max-w-md m-4`}>
                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <Calendar className="h-8 w-8 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Schedule Interview</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Set up a time to meet with the candidate</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={scheduleInput}
                      onChange={e => setScheduleInput(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/20 transition-colors"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes (Optional)</label>
                    <textarea
                      value={notesInput}
                      onChange={e => setNotesInput(e.target.value)}
                      rows={3}
                      placeholder="Additional notes for the interview..."
                      className="w-full p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/20 transition-colors resize-none"
                    />
                  </div>
                  
                  {scheduleError && (
                    <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 rounded-xl">
                      <p className="text-sm text-red-700 dark:text-red-400">{scheduleError}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowSchedule(false)}
                      className="flex-1 bg-white/60 dark:bg-slate-700/60 border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}

        {/* Auto-Select Modal */}
        {showAutoSelect && (
          <Dialog open={showAutoSelect} onClose={() => setShowAutoSelect(false)} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen bg-black/50 backdrop-blur-sm">
              <Dialog.Panel className={`${subtleCard} p-6 rounded-2xl shadow-xl w-full max-w-lg m-4`}>
                <form onSubmit={handleAutoSelectSubmit} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Auto-Select Candidates</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Configure automatic candidate selection process</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        <FileText className="h-4 w-4 inline mr-2" />
                        Offer Letter Content
                      </label>
                      <textarea
                        value={autoSelectData.offerLetter}
                        onChange={e => setAutoSelectData(prev => ({ ...prev, offerLetter: e.target.value }))}
                        rows={4}
                        placeholder="Enter the offer letter content that will be sent to selected candidates..."
                        className="w-full p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600/60 focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 transition-colors resize-none"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Target className="h-4 w-4 inline mr-2" />
                        Number of Candidates to Select
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={autoSelectData.desiredSelectNumber}
                        onChange={e => setAutoSelectData(prev => ({ ...prev, desiredSelectNumber: e.target.value }))}
                        placeholder="e.g., 5"
                        className="w-full p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600/60 focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 transition-colors"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Calendar className="h-4 w-4 inline mr-2" />
                        Offer Letter Expiry Date
                      </label>
                      <input
                        type="date"
                        value={autoSelectData.letterExpiry}
                        onChange={e => setAutoSelectData(prev => ({ ...prev, letterExpiry: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600/60 focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  
                  {autoSelectError && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 rounded-xl">
                      <p className="text-sm text-red-700 dark:text-red-400">{autoSelectError}</p>
                    </div>
                  )}
                  
                  <div className="bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-medium mb-1">How Auto-Select Works:</p>
                        <ul className="text-xs space-y-1 text-amber-700 dark:text-amber-300">
                          <li>• Candidates will be automatically ranked and selected</li>
                          <li>• Offer letters will be sent to top candidates</li>
                          <li>• Process will start immediately after confirmation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit" 
                      disabled={autoSelectLoading}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                    >
                      {autoSelectLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Start Auto-Select
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowAutoSelect(false)}
                      disabled={autoSelectLoading}
                      className="flex-1 bg-white/60 dark:bg-slate-700/60 border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}

        {/* Select with Score Modal */}
        {showSelectScore && (
          <Dialog open={showSelectScore} onClose={() => setShowSelectScore(false)} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen bg-black/50 backdrop-blur-sm">
              <Dialog.Panel className={`${subtleCard} p-6 rounded-2xl shadow-xl w-full max-w-md m-4`}>
                <form onSubmit={handleSelectWithScore} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Select Candidate</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Enter the candidate&apos;s evaluation score</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Star className="h-4 w-4 inline mr-2" />
                        Candidate Score (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={scoreInput}
                        onChange={e => setScoreInput(e.target.value)}
                        placeholder="e.g., 85.5"
                        className="w-full p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600/60 focus:border-green-500 dark:focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:focus:ring-green-400/20 transition-colors"
                        required
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enter a score between 0 and 100 based on the candidate&apos;s evaluation
                      </p>
                    </div>
                  </div>
                  
                  {scoreError && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 rounded-xl">
                      <p className="text-sm text-red-700 dark:text-red-400">{scoreError}</p>
                    </div>
                  )}
                  
                  <div className="bg-green-50/60 dark:bg-green-500/10 border border-green-200 dark:border-green-400/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-green-800 dark:text-green-200">
                        <p className="font-medium mb-1">Selection Process:</p>
                        <ul className="text-xs space-y-1 text-green-700 dark:text-green-300">
                          <li>• Candidate will be added to selected list</li>
                          <li>• Job candidate record will be created with score</li>
                          <li>• Status will be set to PROCESSING</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit" 
                      disabled={scoreLoading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      {scoreLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Selecting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Select Candidate
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowSelectScore(false)}
                      disabled={scoreLoading}
                      className="flex-1 bg-white/60 dark:bg-slate-700/60 border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}

        {/* Rejected Applicants Section */}
        {section === 'rejected' && (
          <Card className={`${subtleCard} shadow-sm rounded-2xl overflow-hidden`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    Rejected Applicants
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {job?.rejectedApplicantIds?.length ? `${job.rejectedApplicantIds.length} candidate(s) not selected` : 'No rejections yet'}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-red-50/60 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-400/30">
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {(!job?.rejectedApplicantIds || job.rejectedApplicantIds.length === 0) ? (
                <div className="text-center py-12">
                  <XCircle className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No Rejected Applicants</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-500">Candidates you&apos;ve declined will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applicantsWithDetails
                    .filter(({ applicantId }) => (job?.rejectedApplicantIds || []).includes(applicantId))
                    .map(({ applicantId, interview, profile }, index) => (
                      <Card key={applicantId} className="border-0 shadow-sm bg-red-50/60 dark:bg-red-500/10 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12 ring-2 ring-red-200/60 dark:ring-red-400/30 shadow-sm opacity-75">
                              <AvatarImage 
                                src={profilePictures[applicantId] 
                                  ? `data:image/jpeg;base64,${profilePictures[applicantId]}`
                                  : (profile?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${applicantId}`)
                                } 
                                alt={profile?.name} 
                              />
                              <AvatarFallback className="bg-gradient-to-br from-red-400 to-red-600 text-white font-semibold">
                                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'R'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                                {profile?.name || `Rejected Applicant ${index + 1}`}
                              </h4>
                              {profile?.email && (
                                <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                                  <Mail className="h-3 w-3" />
                                  {profile.email}
                                </div>
                              )}
                              <Badge variant="outline" className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-400/30 text-xs">
                                Not Selected
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Selected Applicants Section */}
        {section === 'selected' && (
          <Card className={`${subtleCard} shadow-sm rounded-2xl overflow-hidden`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Selected Applicants
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {job?.selectedApplicantIds?.length ? `${job.selectedApplicantIds.length} candidate(s) chosen for ${job.position}` : 'No selections yet'}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50/60 dark:bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-400/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {(!job?.selectedApplicantIds || job.selectedApplicantIds.length === 0) ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No Selected Applicants</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-500">Candidates you&apos;ve chosen will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {job.selectedApplicantIds.map((applicantId, index) => {
                    const profileObj = applicantsWithDetails.find(a => a.applicantId === applicantId);
                    const profile = profileObj?.profile;
                    return (
                      <Card 
                        key={applicantId} 
                        className="border-0 shadow-sm bg-green-50/60 dark:bg-green-500/10 backdrop-blur-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12 ring-2 ring-green-200/60 dark:ring-green-400/30 shadow-sm">
                                <AvatarImage 
                                  src={profilePictures[applicantId] 
                                    ? `data:image/jpeg;base64,${profilePictures[applicantId]}`
                                    : (profile?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${applicantId}`)
                                  } 
                                  alt={profile?.name} 
                                />
                                <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-semibold">
                                  {profile?.name ? profile.name.charAt(0).toUpperCase() : '✓'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                                  {profile?.name || `Selected Applicant ${index + 1}`}
                                </h4>
                                {profile?.email && (
                                  <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                                    <Mail className="h-3 w-3" />
                                    {profile.email}
                                  </div>
                                )}
                                <Badge variant="outline" className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-400/30 text-xs">
                                  <Award className="h-3 w-3 mr-1" />
                                  Selected for {job.position}
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewProfile(applicantId)}
                              className="bg-white/60 dark:bg-slate-700/60 border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Profile
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Hired Applicants Section */}
        {section === 'hired' && job?.autoSelectStatus === 'COMPLETED' && (
          <Card className={`${subtleCard} shadow-sm rounded-2xl overflow-hidden`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Hired Candidates
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {job?.acceptedByProfileIds?.length ? `${job.acceptedByProfileIds.length} candidate(s) accepted the offer` : 'No acceptances yet'}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-amber-50/60 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/30">
                  <Award className="h-3 w-3 mr-1" />
                  Hired
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {(!job?.acceptedByProfileIds || job.acceptedByProfileIds.length === 0) ? (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No Hired Candidates</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-500">Candidates who accept their offers will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {job.acceptedByProfileIds.map((profileId, index) => {
                    const profileObj = applicantsWithDetails.find(a => a.applicantId === profileId);
                    const profile = profileObj?.profile;
                    return (
                      <Card 
                        key={profileId} 
                        className="border-0 shadow-sm bg-amber-50/60 dark:bg-amber-500/10 backdrop-blur-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12 ring-2 ring-amber-200/60 dark:ring-amber-400/30 shadow-sm">
                                <AvatarImage 
                                  src={profilePictures[profileId] 
                                    ? `data:image/jpeg;base64,${profilePictures[profileId]}`
                                    : (profile?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileId}`)
                                  } 
                                  alt={profile?.name} 
                                />
                                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white font-semibold">
                                  {profile?.name ? profile.name.charAt(0).toUpperCase() : '🎉'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                                  {profile?.name || `Hired Candidate ${index + 1}`}
                                </h4>
                                {profile?.email && (
                                  <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                                    <Mail className="h-3 w-3" />
                                    {profile.email}
                                  </div>
                                )}
                                <Badge variant="outline" className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/30 text-xs">
                                  <Award className="h-3 w-3 mr-1" />
                                  Accepted Offer for {job.position}
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewProfile(profileId)}
                              className="bg-white/60 dark:bg-slate-700/60 border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Profile
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
