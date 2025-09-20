"use client";
import { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, DollarSign, Calendar, Users, Briefcase, Clock, 
  Award, GraduationCap, FileText, CheckCircle, XCircle,
  ArrowLeft, Share2, BookmarkPlus, Loader2, ExternalLink
} from "lucide-react";
import Navbar from '@/components/Navbar';
import { useNotifications } from '@/hooks/useNotifications';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const JobLocationMap = dynamic(() => import('@/components/JobLocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  )
});

function JobDetails() {
  const { jobid } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [isApplied, setIsApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  // Parse location string to get coordinates
  const parseLocation = (locationString) => {
    if (!locationString) return null;
    
    // Handle format like "Lat: 23.9408, Lng: 90.3788"
    const latMatch = locationString.match(/Lat:\s*([+-]?\d*\.?\d+)/);
    const lngMatch = locationString.match(/Lng:\s*([+-]?\d*\.?\d+)/);
    
    if (latMatch && lngMatch) {
      return {
        lat: parseFloat(latMatch[1]),
        lng: parseFloat(lngMatch[1])
      };
    }
    return null;
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        // Fetch job details
        const response = await fetch(`http://localhost:8080/api/jobs/employer/ajob/${jobid}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch job details: ${response.status}`);
        }

        const jobData = await response.json();
        setJob(jobData);
        
        // Parse location coordinates
        const coords = parseLocation(jobData.location);
        setCoordinates(coords);

        // Check if user has applied to this job
        const profileRes = await fetch('http://localhost:8080/api/profile/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (profileRes.ok) {
          const profile = await profileRes.json();
          // Check if user's profile ID is in the applicant IDs
          setIsApplied(jobData.applicantIds?.includes(profile.id) || false);
        }
        
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (jobid) {
      fetchJobDetails();
    }
  }, [jobid]);

  const handleRetry = () => {
    setError(null);
    setJob(null);
    setCoordinates(null);
    // Re-trigger the useEffect
    window.location.reload();
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const token = localStorage.getItem("token");
      const profileRes = await fetch('http://localhost:8080/api/profile/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!profileRes.ok) {
        showError("Profile Error", "Failed to get user profile. Please try again.");
        return;
      }
      
      const profile = await profileRes.json();

      const applyRes = await fetch(`http://localhost:8080/api/jobs/${jobid}/apply/${profile.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (applyRes.ok) {
        showSuccess("Application Successful!", `You have successfully applied for the ${job.title} position.`);
        setIsApplied(true);
        // Update job data to include the new applicant
        setJob(prev => ({
          ...prev,
          applicantIds: [...(prev.applicantIds || []), profile.id]
        }));
      } else {
        showError("Application Failed", "Failed to apply for the job. Please try again.");
      }
    } catch (err) {
      console.error("Error applying for job:", err);
      showError("Application Error", "An unexpected error occurred. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const handleWithdraw = async () => {
    setApplying(true);
    try {
      const token = localStorage.getItem("token");
      const profileRes = await fetch('http://localhost:8080/api/profile/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!profileRes.ok) {
        showError("Profile Error", "Failed to get user profile. Please try again.");
        return;
      }
      
      const profile = await profileRes.json();

      const withdrawRes = await fetch(`http://localhost:8080/api/jobs/${jobid}/withdraw/${profile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (withdrawRes.ok) {
        showSuccess("Withdrawal Successful!", `You have successfully withdrawn your application for the ${job.title} position.`);
        setIsApplied(false);
        // Update job data to remove the applicant
        setJob(prev => ({
          ...prev,
          applicantIds: (prev.applicantIds || []).filter(id => id !== profile.id)
        }));
      } else {
        showError("Withdrawal Failed", "Failed to withdraw from the job. Please try again.");
      }
    } catch (err) {
      console.error("Error withdrawing from job:", err);
      showError("Withdrawal Error", "An unexpected error occurred. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSalary = (min, max) => {
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    } else if (min) {
      return `$${min.toLocaleString()}+`;
    } else if (max) {
      return `Up to $${max.toLocaleString()}`;
    }
    return 'Not specified';
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CLOSED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return <CheckCircle className="h-4 w-4" />;
      case 'CLOSED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* Background gradients matching dashboard */}
        <div className="pointer-events-none select-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
          <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
        </div>
        <Navbar />
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <Loader2 className="h-9 w-9 animate-spin text-teal-600 dark:text-teal-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background gradients matching dashboard */}
        <div className="pointer-events-none select-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
          <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
        </div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className={`w-full max-w-md ${subtleCard} shadow-sm`}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                    Error Loading Job
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                  <Button onClick={handleRetry} variant="outline" className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background gradients matching dashboard */}
        <div className="pointer-events-none select-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
          <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
        </div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className={`w-full max-w-md ${subtleCard} shadow-sm`}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                    Job Not Found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    The job you&apos;re looking for doesn&apos;t exist or has been removed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

// Design tokens matching dashboard
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradients matching dashboard */}
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>

      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10 relative">
        {/* Header with back button */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="mb-6 rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200 mb-2">
                      {job.title}
                    </CardTitle>
                    <CardDescription className="text-xl text-slate-600 dark:text-slate-400 mb-4">
                      {job.position}
                    </CardDescription>
                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge 
                        className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(job.status)}`}
                      >
                        {getStatusIcon(job.status)}
                        <span className="ml-1">{job.status}</span>
                      </Badge>
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="text-sm">Posted {formatDate(job.datePosted)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm">
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Job Details */}
            <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800 dark:text-slate-100">
                  <FileText className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800 dark:text-slate-100">
                  <CheckCircle className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {job.requiredSkills && (
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-2 text-teal-600 dark:text-teal-400" />
                      Required Skills
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">{job.requiredSkills}</p>
                  </div>
                )}
                
                {job.requiredExperience && (
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-teal-600 dark:text-teal-400" />
                      Required Experience
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">{job.requiredExperience}</p>
                  </div>
                )}
                
                {job.requiredEducation && (
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-teal-600 dark:text-teal-400" />
                      Required Education
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">{job.requiredEducation}</p>
                  </div>
                )}
                
                {job.requiredProject && (
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-teal-600 dark:text-teal-400" />
                      Required Projects
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">{job.requiredProject}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Button */}
            <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
              <CardContent className="pt-6">
                {job.status === 'OPEN' ? (
                  <>
                    {isApplied ? (
                      <Button 
                        onClick={handleWithdraw}
                        className="w-full mb-4 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
                        size="lg"
                        disabled={applying}
                      >
                        {applying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Withdrawing...
                          </>
                        ) : (
                          <>
                            Withdraw Application
                            <XCircle className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleApply}
                        className="w-full mb-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm"
                        size="lg"
                        disabled={applying}
                      >
                        {applying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            Apply Now
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <Button 
                    className="w-full mb-4 bg-slate-500 text-white cursor-not-allowed rounded-xl"
                    size="lg"
                    disabled={true}
                  >
                    Application Closed
                    <XCircle className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {job.endDate && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                    Application deadline: {formatDate(job.endDate)}
                  </p>
                )}
                {isApplied && job.status === 'OPEN' && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 text-center flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      You have applied for this job
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Summary */}
            <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-slate-100">Job Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-slate-600 dark:text-slate-400">
                    <DollarSign className="h-4 w-4 mr-2 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm">Salary</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {formatSalary(job.minSalary, job.maxSalary)}
                  </span>
                </div>
                
                <Separator className="bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-slate-700/60" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-slate-600 dark:text-slate-400">
                    <Clock className="h-4 w-4 mr-2 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm">Posted</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {formatDate(job.datePosted)}
                  </span>
                </div>
                
                {job.endDate && (
                  <>
                    <Separator className="bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-slate-700/60" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <Calendar className="h-4 w-4 mr-2 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm">Deadline</span>
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {formatDate(job.endDate)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Location Map */}
            {coordinates && (
              <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800 dark:text-slate-100">
                    <MapPin className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                    Job Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <JobLocationMap coordinates={coordinates} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {job.location}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(JobDetails);