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
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading job details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Error Loading Job
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                  <Button onClick={handleRetry} variant="outline">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Job Not Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {job.title}
                    </CardTitle>
                    <CardDescription className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                      {job.position}
                    </CardDescription>
                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge 
                        className={`px-3 py-1 text-sm font-medium ${getStatusColor(job.status)}`}
                      >
                        {getStatusIcon(job.status)}
                        <span className="ml-1">{job.status}</span>
                      </Badge>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="text-sm">Posted {formatDate(job.datePosted)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Job Details */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <FileText className="h-5 w-5 mr-2" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {job.requiredSkills && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      Required Skills
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{job.requiredSkills}</p>
                  </div>
                )}
                
                {job.requiredExperience && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Required Experience
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{job.requiredExperience}</p>
                  </div>
                )}
                
                {job.requiredEducation && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Required Education
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{job.requiredEducation}</p>
                  </div>
                )}
                
                {job.requiredProject && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Required Projects
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{job.requiredProject}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Button */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
              <CardContent className="pt-6">
                <Button 
                  className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  disabled={job.status !== 'OPEN'}
                >
                  {job.status === 'OPEN' ? 'Apply Now' : 'Application Closed'}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                {job.endDate && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Application deadline: {formatDate(job.endDate)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Job Summary */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Job Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span className="text-sm">Salary</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatSalary(job.minSalary, job.maxSalary)}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">Posted</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatDate(job.datePosted)}
                  </span>
                </div>
                
                {job.endDate && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">Deadline</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatDate(job.endDate)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Location Map */}
            {coordinates && (
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                    <MapPin className="h-5 w-5 mr-2" />
                    Job Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <JobLocationMap coordinates={coordinates} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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