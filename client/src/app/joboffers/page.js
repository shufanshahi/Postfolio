"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  Star,
  DollarSign,
  FileText,
  Award,
  X,
  Download,
  Mail
} from "lucide-react";

function JobOffers() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [jobCandidates, setJobCandidates] = useState([]);
  const [jobDetails, setJobDetails] = useState({});
  const [employerProfiles, setEmployerProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [showOfferLetter, setShowOfferLetter] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Design tokens matching dashboard and my-interviews
  const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
  const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

  const fetchProfileAndJobOffers = useCallback(async () => {
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

      // Fetch active job candidates (PROCESSING, ACCEPTED, REJECTED) for this profile
      const candidatesRes = await fetch(`http://localhost:8080/api/job-candidates/profile/${profileData.id}/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!candidatesRes.ok) {
        console.warn("Failed to fetch job candidates, using empty array");
        setJobCandidates([]);
      } else {
        const candidatesData = await candidatesRes.json();
        setJobCandidates(candidatesData);
        
        // Fetch job details for each candidate
        const jobDetailsMap = {};
        const employerProfilesMap = {};
        
        for (const candidate of candidatesData) {
          try {
            const jobRes = await fetch(`http://localhost:8080/api/jobs/employer/ajob/${candidate.jobId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (jobRes.ok) {
              const jobData = await jobRes.json();
              jobDetailsMap[candidate.jobId] = jobData;
              
              // Fetch employer profile if employerId exists
              if (jobData.employerId && !employerProfilesMap[jobData.employerId]) {
                try {
                  const employerRes = await fetch(`http://localhost:8080/api/profile/${jobData.employerId}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (employerRes.ok) {
                    const employerData = await employerRes.json();
                    employerProfilesMap[jobData.employerId] = employerData;
                  } else {
                    employerProfilesMap[jobData.employerId] = {
                      name: 'Company not available'
                    };
                  }
                } catch (employerErr) {
                  console.warn(`Failed to fetch employer profile for ${jobData.employerId}:`, employerErr);
                  employerProfilesMap[jobData.employerId] = {
                    name: 'Company not available'
                  };
                }
              }
            } else {
              // Fallback if job details can't be fetched
              jobDetailsMap[candidate.jobId] = {
                title: `Job ${candidate.jobId}`,
                position: 'Position not available',
                company: 'Company not available',
                salary: 'Salary not disclosed'
              };
            }
          } catch (jobErr) {
            console.warn(`Failed to fetch job details for ${candidate.jobId}:`, jobErr);
            jobDetailsMap[candidate.jobId] = {
              title: `Job ${candidate.jobId}`,
              position: 'Position not available',
              company: 'Company not available',
              salary: 'Salary not disclosed'
            };
          }
        }
        setJobDetails(jobDetailsMap);
        setEmployerProfiles(employerProfilesMap);
      }
    } catch (err) {
      console.error("Error fetching job offers:", err);
      setError("An error occurred while fetching job offers.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfileAndJobOffers();
  }, [fetchProfileAndJobOffers]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      PROCESSING: { 
        color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-1 ring-blue-400/50", 
        text: "Processing",
        icon: <Activity className="h-3 w-3" />
      },
      ACCEPTED: { 
        color: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white ring-1 ring-emerald-400/50", 
        text: "Accepted",
        icon: <CheckCircle className="h-3 w-3" />
      },
      REJECTED: { 
        color: "bg-gradient-to-r from-red-500 to-red-600 text-white ring-1 ring-red-400/50", 
        text: "Rejected",
        icon: <XCircle className="h-3 w-3" />
      },
      ON: { 
        color: "bg-gradient-to-r from-amber-400 to-amber-500 text-white ring-1 ring-amber-300/50", 
        text: "Active",
        icon: <Clock className="h-3 w-3" />
      },
      OFF: { 
        color: "bg-gradient-to-r from-gray-400 to-gray-500 text-white ring-1 ring-gray-300/50", 
        text: "Inactive",
        icon: <XCircle className="h-3 w-3" />
      }
    };

    const config = statusConfig[status] || statusConfig.PROCESSING;
    return (
      <Badge className={`${config.color} rounded-full px-3 py-1.5 text-xs font-medium shadow-sm flex items-center gap-1.5`}>
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  const getCompanyName = (jobId) => {
    const job = jobDetails[jobId];
    if (!job) return 'Company not available';
    
    // If job has employerId, get employer's name from employerProfiles
    if (job.employerId && employerProfiles[job.employerId]) {
      return employerProfiles[job.employerId].name || 'Company not available';
    }
    
    // Fallback to job's company field if no employerId or employer profile
    return job.company || 'Company not available';
  };

  const handleViewJob = (jobId) => {
    // Redirect to job details page
    router.push(`/find-jobs/${jobId}`);
  };

  const handleViewOfferLetter = (candidate) => {
    const jobData = jobDetails[candidate.jobId];
    const employerData = jobData?.employerId ? employerProfiles[jobData.employerId] : null;
    
    setSelectedOffer({
      candidate,
      jobData,
      employerData,
      companyName: getCompanyName(candidate.jobId)
    });
    setShowOfferLetter(true);
  };

  const handleAcceptOffer = async (candidateId, jobId) => {
    try {
      const token = localStorage.getItem("token");
      
      // Update candidate status to ACCEPTED
      const response = await fetch(`http://localhost:8080/api/job-candidates/job/${jobId}/profile/${profile.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ACCEPTED'
        })
      });

      if (response.ok) {
        // Refresh the data
        fetchProfileAndJobOffers();
        alert('Offer accepted successfully!');
      } else {
        alert('Failed to accept offer. Please try again.');
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      alert("Error accepting offer.");
    }
  };

  // Filter candidates based on selected status
  const filteredCandidates = filterStatus === 'All' 
    ? jobCandidates 
    : jobCandidates.filter(candidate => candidate.status === filterStatus);

  const filterOptions = [
    { value: 'All', label: 'All Offers', count: jobCandidates.length },
    { value: 'PROCESSING', label: 'Processing', count: jobCandidates.filter(c => c.status === 'PROCESSING').length },
    { value: 'ACCEPTED', label: 'Accepted', count: jobCandidates.filter(c => c.status === 'ACCEPTED').length },
    { value: 'REJECTED', label: 'Rejected', count: jobCandidates.filter(c => c.status === 'REJECTED').length }
  ];

  // Offer Letter Modal Component
  const OfferLetterModal = () => (
    <Dialog open={showOfferLetter} onOpenChange={setShowOfferLetter}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl">
          {/* Header */}
          {/* <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg text-white shadow-sm">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Official Job Offer Letter
                </DialogTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedOffer?.companyName} • {selectedOffer?.jobData?.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full border-teal-300/60 bg-white/80 backdrop-blur hover:bg-white text-teal-700">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowOfferLetter(false)}
                className="rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-600 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div> */}

          {/* Letter Content */}
          {selectedOffer && (
            <div className="p-8 bg-white dark:bg-slate-900">
              {/* Company Header */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
                <Avatar className="h-16 w-16 ring-2 ring-teal-200 dark:ring-teal-700">
                  <AvatarImage 
                    src={selectedOffer.employerData?.profileImage || '/default-company-logo.png'} 
                    alt="Company Logo" 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-lg font-bold">
                    {selectedOffer.companyName?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {selectedOffer.companyName}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedOffer.employerData?.email || 'company@example.com'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {/* {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} */}
                  </p>
                </div>
              </div>

              {/* Recipient */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Dear {profile?.name} ,
                </h3>
              </div>

              {/* Job Offer Details */}
              {/* <div className="mb-8 p-6 bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-teal-200 dark:border-slate-600">
                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-600" />
                  Job Offer: {selectedOffer.jobData?.title}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Position:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {selectedOffer.jobData?.position}
                    </span>
                  </div>
                  {selectedOffer.jobData?.salary && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Salary:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {selectedOffer.jobData.salary}
                      </span>
                    </div>
                  )}
                  {selectedOffer.candidate?.score && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Your Score:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {selectedOffer.candidate.score}
                      </span>
                    </div>
                  )}
                  {selectedOffer.candidate?.expireDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Expires:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {new Date(selectedOffer.candidate.expireDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div> */}

              {/* Offer Letter Body */}
              <div className="mb-8">
                {/* Letter Introduction */}
                {/* <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-lg border border-blue-200 dark:border-slate-500">
                  <p className="text-slate-700 dark:text-slate-300 font-medium text-center">
                    📧 <strong>Official Job Offer Letter</strong>
                  </p>
                </div> */}

                <div className="prose prose-slate dark:prose-invert max-w-none">
                  {selectedOffer.jobData?.offerLetter ? (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-600 shadow-inner">
                      {/* Letter Header */}
                      <div className="text-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-600">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                           OFFER LETTER
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {/* {selectedOffer.companyName} • {new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })} */}
                        </p>
                      </div>

                      {/* Main Letter Content */}
                      <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed text-justify font-serif text-base">
                        {selectedOffer.jobData.offerLetter}
                      </div>

                      {/* Letter Footer */}
                      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">Position Details:</p>
                            <p className="text-slate-600 dark:text-slate-400">• Title: {selectedOffer.jobData?.title}</p>
                            <p className="text-slate-600 dark:text-slate-400">• Position: {selectedOffer.jobData?.position}</p>
                            {selectedOffer.jobData?.salary && (
                              <p className="text-slate-600 dark:text-slate-400">• Compensation: {selectedOffer.jobData.salary}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">Important Dates:</p>
                            {/* <p className="text-slate-600 dark:text-slate-400">• Offer Date: {new Date().toLocaleDateString()}</p> */}
                            {selectedOffer.candidate?.expireDate && (
                              <p className="text-slate-600 dark:text-slate-400">• Response Deadline: {new Date(selectedOffer.candidate.expireDate).toLocaleDateString()}</p>
                            )}
                            {/* {selectedOffer.candidate?.score && (
                              <p className="text-slate-600 dark:text-slate-400">• Assessment Score: {selectedOffer.candidate.score}</p>
                            )} */}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-600 shadow-inner">
                      {/* Letter Header */}
                      <div className="text-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-600">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                          EMPLOYMENT OFFER LETTER
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedOffer.companyName} • {new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>

                      {/* Default Letter Content */}
                      <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify font-serif space-y-4">
                        <p className="text-base">
                          We are pleased to extend an offer of employment for the position of <strong>{selectedOffer.jobData?.position}</strong> at <strong>{selectedOffer.companyName}</strong>.
                        </p>
                        <p className="text-base">
                          After careful consideration of your qualifications, experience, and interview performance, we believe you would be an excellent addition to our team. Your skills and expertise align perfectly with our requirements for this role.
                        </p>
                        <p className="text-base">
                          This position offers competitive compensation, comprehensive benefits, and excellent opportunities for professional growth and development within our organization.
                        </p>
                        <p className="text-base">
                          Please review the terms and conditions of this offer carefully. Should you accept this position, we request that you respond by the deadline specified above.
                        </p>
                        <p className="text-base">
                          We are excited about the possibility of you joining our team and look forward to the valuable contributions you will make to our organization&apos;s continued success.
                        </p>
                      </div>

                      {/* Default Letter Footer */}
                      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">Position Details:</p>
                            <p className="text-slate-600 dark:text-slate-400">• Title: {selectedOffer.jobData?.title}</p>
                            <p className="text-slate-600 dark:text-slate-400">• Position: {selectedOffer.jobData?.position}</p>
                            {selectedOffer.jobData?.salary && (
                              <p className="text-slate-600 dark:text-slate-400">• Compensation: {selectedOffer.jobData.salary}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">Important Dates:</p>
                            <p className="text-slate-600 dark:text-slate-400">• Offer Date: {new Date().toLocaleDateString()}</p>
                            {selectedOffer.candidate?.expireDate && (
                              <p className="text-slate-600 dark:text-slate-400">• Response Deadline: {new Date(selectedOffer.candidate.expireDate).toLocaleDateString()}</p>
                            )}
                            {selectedOffer.candidate?.score && (
                              <p className="text-slate-600 dark:text-slate-400">• Assessment Score: {selectedOffer.candidate.score}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature */}
              {/* <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 p-6 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-end">
                    <div className="space-y-3">
                      <p className="text-slate-800 dark:text-slate-100 font-medium text-base">
                        Sincerely,
                      </p>
                      <div className="space-y-1">
                        <div className="h-12 w-48 border-b border-slate-400 dark:border-slate-500 relative">
                          <span className="absolute -bottom-6 left-0 text-xs text-slate-500 dark:text-slate-400 italic">
                            Authorized Signature
                          </span>
                        </div>
                      </div>
                      <div className="mt-8">
                        <p className="text-slate-800 dark:text-slate-100 font-bold text-lg">
                          {selectedOffer.companyName}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                          Human Resources Department
                        </p>
                        <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                          This is an official offer letter
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="h-4 w-4" />
                        <span>{selectedOffer.employerData?.email || 'hr@company.com'}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Document ID: #{selectedOffer.candidate?.id || '000'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Generated: {new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-600 rounded border">
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                          🔒 Confidential Document
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Action Buttons */}
              {selectedOffer.candidate?.status === 'PROCESSING' && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => {
                        handleAcceptOffer(selectedOffer.candidate.id, selectedOffer.candidate.jobId);
                        setShowOfferLetter(false);
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-full px-8 py-2 shadow-lg"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Offer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowOfferLetter(false)}
                      className="rounded-full px-8 py-2"
                    >
                      Review Later
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,theme(colors.teal.100)_0%,theme(colors.teal.50)_35%,theme(colors.white)_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,oklch(0.3_0.05_210)_0%,oklch(0.22_0.025_250)_60%)]">
        <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(circle_at_center,white,transparent)]">
          <div className="absolute top-10 left-1/4 h-64 w-64 bg-teal-300/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 h-72 w-72 bg-indigo-300/30 rounded-full blur-3xl animate-pulse [animation-delay:200ms]" />
        </div>
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <Loader2 className="h-9 w-9 animate-spin text-teal-600 dark:text-teal-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading your job offers...</p>
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
              onClick={() => router.push('/my-interviews')}
              className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm text-slate-700 text-sm mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Interviews
            </Button>
            <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
              Job Offers & Opportunities
            </h1>
            {profile && (
              <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active job applications for: <span className="font-semibold text-slate-800 dark:text-slate-100">{profile.firstName} {profile.lastName}</span>
              </p>
            )}
          </div>
          
          {/* Filter Button */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm text-slate-700 text-sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {filterStatus} ({filteredCandidates.length})
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
            <Button 
              onClick={fetchProfileAndJobOffers}
              className="rounded-full bg-teal-600 hover:bg-teal-700 shadow-sm text-sm"
            >
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
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-sm ring-1 ring-white/40">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {jobCandidates.filter(c => c.status === 'PROCESSING').length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">Processing</div>
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
                      {jobCandidates.filter(c => c.status === 'ACCEPTED').length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">Accepted</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`${subtleCard} hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 rounded-2xl overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white shadow-sm ring-1 ring-white/40">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {jobCandidates.filter(c => c.status === 'REJECTED').length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">Rejected</div>
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
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {jobCandidates.length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total Offers</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Offers List */}
        <Card className={`${subtleCard} rounded-2xl shadow-sm`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800 dark:text-slate-100 text-xl font-semibold">
                  {filterStatus === 'All' ? 'All Job Offers' : `${filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase()} Offers`}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  {filteredCandidates.length ?
                    `${filteredCandidates.length} offer(s) found` :
                    "No offers match your filter"
                  }
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-white/60 border-slate-200/60 text-slate-700">
                {filteredCandidates.length} results
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-sm mx-auto">
                  <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl mb-4 inline-block">
                    <Briefcase className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">
                    {filterStatus === 'All' ? 'No job offers yet' : `No ${filterStatus.toLowerCase()} offers`}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {filterStatus === 'All' 
                      ? 'Apply to more jobs to get offer opportunities!' 
                      : `Try selecting a different filter to see other offers.`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    className="group overflow-hidden cursor-pointer relative rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-300/60 dark:hover:border-teal-400/40 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white shadow-sm ring-1 ring-white/40">
                            <Award className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-base mb-1">
                              {jobDetails[candidate.jobId]?.title || `Job Offer ${candidate.jobId}`}
                            </h3>
                            <div className="flex items-center gap-4 mb-2">
                              <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {jobDetails[candidate.jobId]?.position || 'Position not available'}
                              </p>
                              <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {getCompanyName(candidate.jobId)}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm mb-3">
                              {jobDetails[candidate.jobId]?.salary && (
                                <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                  {jobDetails[candidate.jobId].salary}
                                </p>
                              )}
                              {candidate.score && (
                                <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Star className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                  Score: {candidate.score}
                                </p>
                              )}
                              {candidate.expireDate && (
                                <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 text-red-600 dark:text-red-400" />
                                  Expires: {new Date(candidate.expireDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            {jobDetails[candidate.jobId]?.description && (
                              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg line-clamp-2">
                                {jobDetails[candidate.jobId].description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 ml-4">
                          {getStatusBadge(candidate.status)}
                          <div className="flex space-x-2">
                            {candidate.status === 'PROCESSING' && (
                              <Button
                                size="sm"
                                onClick={() => handleAcceptOffer(candidate.id, candidate.jobId)}
                                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-full px-4 py-2 text-sm shadow-sm ring-1 ring-emerald-500/50"
                              >
                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                Accept Offer
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOfferLetter(candidate)}
                              className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white text-slate-700 text-sm shadow-sm"
                            >
                              <FileText className="h-4 w-4 mr-1.5" />
                              Check Offer Letter
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
      
      {/* Offer Letter Modal */}
      <OfferLetterModal />
    </div>
  );
}

export default withAuth(JobOffers);
