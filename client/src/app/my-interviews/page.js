"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  Video,
  User,
  Building,
  ArrowLeft,
  Loader2,
  Filter,
  ChevronDown,
  Activity,
  CheckCircle,
  XCircle,
  Play,
  Briefcase,
  MapPin,
  Map,
  Plus
} from "lucide-react";

function MyInterviews() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [jobDetails, setJobDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');

  // Design tokens matching dashboard
  const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
  const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';
  const [roadmapStatus, setRoadmapStatus] = useState({}); // Track roadmap status for each interview
  const [creatingRoadmap, setCreatingRoadmap] = useState(null); // Track which roadmap is being created

  const fetchProfileAndInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in. Please login first.");
        router.push("/login");
        return;
      }

      // Get user profile
      const profileRes = await apiFetch('/api/profile/me');
      if (!profileRes.ok) {
        setError("Failed to get user profile. Please try again.");
        return;
      }

      const profileData = await profileRes.json();
      setProfile(profileData);

      // Fetch real interviews for this profile
      const interviewsRes = await fetch(`http://localhost:8080/api/interviews/profile/${profileData.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!interviewsRes.ok) {
        console.warn("Failed to fetch interviews, using empty array");
        setInterviews([]);
      } else {
        const interviewsData = await interviewsRes.json();
        setInterviews(interviewsData);
        
        // Fetch job details for each interview
        const jobDetailsMap = {};
        for (const interview of interviewsData) {
          try {
            const jobRes = await fetch(`http://localhost:8080/api/jobs/employer/ajob/${interview.jobId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (jobRes.ok) {
              const jobData = await jobRes.json();
              jobDetailsMap[interview.jobId] = jobData;
            } else {
              // Fallback if job details can't be fetched
              jobDetailsMap[interview.jobId] = {
                title: `Job ${interview.jobId}`,
                position: 'Position not available',
                company: 'Company not available'
              };
            }
          } catch (jobErr) {
            console.warn(`Failed to fetch job details for ${interview.jobId}:`, jobErr);
            jobDetailsMap[interview.jobId] = {
              title: `Job ${interview.jobId}`,
              position: 'Position not available',
              company: 'Company not available'
            };
          }
        }
        setJobDetails(jobDetailsMap);

        // Check roadmap status for each interview
        await checkRoadmapStatus(interviewsData, profileData.id, token);
      }
    } catch (err) {
      console.error("Error fetching interviews:", err);
      setError("An error occurred while fetching interviews.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfileAndInterviews();
  }, [fetchProfileAndInterviews]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { 
        color: "bg-gradient-to-r from-amber-400 to-amber-500 text-white ring-1 ring-amber-300/50", 
        text: "Pending",
        icon: <Clock className="h-3 w-3" />
      },
      COMPLETED: { 
        color: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white ring-1 ring-emerald-400/50", 
        text: "Completed",
        icon: <CheckCircle className="h-3 w-3" />
      },
      REJECTED: { 
        color: "bg-gradient-to-r from-red-500 to-red-600 text-white ring-1 ring-red-400/50", 
        text: "Rejected",
        icon: <XCircle className="h-3 w-3" />
      },
      ONGOING: { 
        color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-1 ring-blue-400/50", 
        text: "Ongoing",
        icon: <Activity className="h-3 w-3" />
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Badge className={`${config.color} rounded-full px-3 py-1.5 text-xs font-medium shadow-sm flex items-center gap-1.5`}>
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'phone':
        return <Clock className="h-4 w-4" />;
      case 'in-person':
        return <Building className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const handleJoinInterview = async (interview) => {
    try {
      const token = localStorage.getItem("token");

      // Get the interview details using profileId and jobId
      const interviewRes = await fetch(`http://localhost:8080/api/interviews/profile/${interview.profileId}/job/${interview.jobId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!interviewRes.ok) {
        alert("Failed to get interview details.");
        return;
      }

      const interviewData = await interviewRes.json();

      // Use interview ID as room ID and join as participant (not host)
      const roomId = `${interviewData.id}`;
      router.push(`/videoCall/${roomId}?role=participant`);
    } catch (error) {
      console.error("Error joining interview:", error);
      alert("Error joining interview.");
    }
  };

  const handleViewDetails = (interviewId) => {
    // Could redirect to a detailed interview page
    console.log("View details for interview:", interviewId);
  };

  // Filter interviews based on selected status
  const filteredInterviews = filterStatus === 'All' 
    ? interviews 
    : interviews.filter(interview => interview.status === filterStatus);

  const filterOptions = [
    { value: 'All', label: 'All Interviews', count: interviews.length },
    { value: 'PENDING', label: 'Pending', count: interviews.filter(i => i.status === 'PENDING').length },
    { value: 'ONGOING', label: 'Ongoing', count: interviews.filter(i => i.status === 'ONGOING').length },
    { value: 'COMPLETED', label: 'Completed', count: interviews.filter(i => i.status === 'COMPLETED').length },
    { value: 'REJECTED', label: 'Rejected', count: interviews.filter(i => i.status === 'REJECTED').length }
  ];
  const checkRoadmapStatus = async (interviewsData, profileId, token) => {
    const statusMap = {};

    for (const interview of interviewsData) {
      try {
        const roadmapRes = await fetch(
          `http://localhost:8080/api/roadmaps/check/${interview.jobId}/${profileId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (roadmapRes.ok) {
          const data = await roadmapRes.json();
          statusMap[`${interview.jobId}-${profileId}`] = data.exists;
        }
      } catch (error) {
        console.error("Error checking roadmap status:", error);
        statusMap[`${interview.jobId}-${profileId}`] = false;
      }
    }

    setRoadmapStatus(statusMap);
  };

  const handleCreateRoadmap = async (interview) => {
    const roadmapKey = `${interview.jobId}-${interview.profileId}`;
    setCreatingRoadmap(roadmapKey);

    try {
      const token = localStorage.getItem("token");
      const roadmapData = {
        jobId: interview.jobId,
        profileId: interview.profileId,
        interviewDate: interview.schedule,
        title: `Interview Preparation Roadmap - Job ${interview.jobId}`,
        description: `Structured learning path for the upcoming interview`
      };

      const response = await fetch('http://localhost:8080/api/roadmaps', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roadmapData)
      });

      if (response.ok) {
        const createdRoadmap = await response.json();
        // Update roadmap status
        setRoadmapStatus(prev => ({
          ...prev,
          [roadmapKey]: true
        }));

        // Redirect to roadmap view
        router.push(`/roadmap/${createdRoadmap.id}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to create roadmap: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating roadmap:", error);
      alert("Error creating roadmap. Please try again.");
    } finally {
      setCreatingRoadmap(null);
    }
  };

  const handleViewRoadmap = async (interview) => {
    try {
      const token = localStorage.getItem("token");
      const roadmapRes = await fetch(
        `http://localhost:8080/api/roadmaps/job/${interview.jobId}/profile/${interview.profileId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (roadmapRes.ok) {
        const roadmap = await roadmapRes.json();
        router.push(`/roadmap/${roadmap.id}`);
      } else {
        alert("Failed to load roadmap. Please try again.");
      }
    } catch (error) {
      console.error("Error loading roadmap:", error);
      alert("Error loading roadmap. Please try again.");
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
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading your interview schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_30%_20%,theme(colors.teal.100)_0%,theme(colors.teal.50)_35%,theme(colors.white)_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,oklch(0.3_0.05_210)_0%,oklch(0.22_0.025_250)_60%)]">
        <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(circle_at_center,white,transparent)]">
          <div className="absolute top-10 left-1/4 h-64 w-64 bg-teal-300/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 h-72 w-72 bg-indigo-300/30 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
          <Card className={`${subtleCard} p-8 text-center max-w-md`}>
            <div className="text-red-500 dark:text-red-400 mb-4 text-sm">{error}</div>
            <Button 
              onClick={() => router.back()}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>
      
      <div className="max-w-7xl mx-auto py-10 px-6 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm text-slate-700 text-sm mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
              My Interviews
            </h1>
            {/* {profile && (
              <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                Interview schedule for:<span className="font-semibold text-slate-800 dark:text-slate-100">{profile.firstName} {profile.lastName}</span>
                <span className="text-slate-500 ml-2">{profile.name}</span>
              </p>
            )} */}
          </div>
          
          {/* Filter Button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/joboffers')}
              className="rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-sm text-sm"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Offer Letters
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm text-slate-700 text-sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {filterStatus} ({filteredInterviews.length})
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 rounded-xl border-slate-200/60 bg-white/90 backdrop-blur-md">
                {filterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setFilterStatus(option.value)}
                    className="flex items-center justify-between rounded-lg text-sm"
                  >
                    <span>{option.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {option.count}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="rounded-full bg-teal-600 hover:bg-teal-700 shadow-sm text-sm">
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${subtleCard} hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 rounded-2xl overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl text-white shadow-sm ring-1 ring-white/40">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {interviews.filter(i => i.status === 'PENDING').length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">Pending</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`${subtleCard} hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 rounded-2xl overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-sm ring-1 ring-white/40">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {interviews.filter(i => i.status === 'ONGOING').length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">Ongoing</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`${subtleCard} hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 rounded-2xl overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white shadow-sm ring-1 ring-white/40">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {interviews.filter(i => i.status === 'COMPLETED').length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">Completed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`${subtleCard} hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 rounded-2xl overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl text-white shadow-sm ring-1 ring-white/40">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {interviews.length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interviews List */}
        <Card className={`${subtleCard} rounded-2xl shadow-sm`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800 dark:text-slate-100 text-xl font-semibold">
                  {filterStatus === 'All' ? 'All Interviews' : `${filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase()} Interviews`}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  {filteredInterviews.length ?
                    `${filteredInterviews.length} interview(s) found` :
                    "No interviews match your filter"
                  }
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-white/60 border-slate-200/60 text-slate-700">
                {filteredInterviews.length} results
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {filteredInterviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-sm mx-auto">
                  <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl mb-4 inline-block">
                    <Calendar className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">
                    {filterStatus === 'All' ? 'No interviews scheduled' : `No ${filterStatus.toLowerCase()} interviews`}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {filterStatus === 'All' 
                      ? 'Check back later or apply to more jobs to get interview opportunities!' 
                      : `Try selecting a different filter to see other interviews.`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInterviews.map((interview) => (
                  <Card
                    key={interview.id}
                    className="group overflow-hidden cursor-pointer relative rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-300/60 dark:hover:border-teal-400/40 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl text-white shadow-sm ring-1 ring-white/40">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-base mb-1">
                              {jobDetails[interview.jobId]?.title || `Interview for Job ID: ${interview.jobId}`}
                            </h3>
                            <div className="flex items-center gap-4 mb-2">
                              <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {jobDetails[interview.jobId]?.position || 'Position not available'}
                              </p>
                              {jobDetails[interview.jobId]?.company && (
                                <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {jobDetails[interview.jobId].company}
                                </p>
                              )}
                            </div>
                            {/* {jobDetails[interview.jobId]?.location && (
                              <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-1 mb-2">
                                <MapPin className="h-3 w-3" />
                                {jobDetails[interview.jobId].location}
                              </p>
                            )} */}
                            {interview.notes && (
                              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <strong>Notes:</strong> {interview.notes}
                              </p>
                            )}
                            <div className="flex items-center gap-6 text-sm">
                              <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                                {new Date(interview.schedule).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                                {new Date(interview.schedule).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                            {interview.interviewerFeedback && (
                              <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg border border-emerald-200/60 dark:border-emerald-700/60">
                                <p className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">
                                  <strong>Feedback:</strong> {interview.interviewerFeedback}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 ml-4">
                          {getStatusBadge(interview.status)}
                          <div className="flex space-x-2">
                            {interview.status === 'ONGOING' && (
                              <Button
                                size="sm"
                                onClick={() => handleJoinInterview(interview)}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full px-4 py-2 text-sm shadow-sm ring-1 ring-blue-500/50"
                              >
                                <Video className="h-4 w-4 mr-1.5" />
                                Join Interview
                              </Button>
                            )}
                            {/* Roadmap Button */}
                        {roadmapStatus[`${interview.jobId}-${interview.profileId}`] ? (
                          <Button
                            size="sm"
                            onClick={() => handleViewRoadmap(interview)}
                            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg"
                          >
                            <Map className="h-4 w-4 mr-1" />
                            View Roadmap
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCreateRoadmap(interview)}
                            disabled={creatingRoadmap === `${interview.jobId}-${interview.profileId}`}
                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white disabled:opacity-50 shadow-lg"
                          >
                            {creatingRoadmap === `${interview.jobId}-${interview.profileId}` ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4 mr-1" />
                            )}
                            {creatingRoadmap === `${interview.jobId}-${interview.profileId}`
                              ? 'Creating...'
                              : 'Create Roadmap'
                            }
                          </Button>
                        )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(interview.id)}
                              className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white text-slate-700 text-sm shadow-sm"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default withAuth(MyInterviews);
