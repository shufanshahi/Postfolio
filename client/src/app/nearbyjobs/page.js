"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, DollarSign, Calendar, Users, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from '@/components/Navbar';
import LeafletMap from '@/components/LeafletMap';

// Design tokens matching dashboard theme
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

export default function NearbyJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]); // Default: Dhaka, Bangladesh
  const [selectedJob, setSelectedJob] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [applying, setApplying] = useState(false);

  // Parse location string to get coordinates
  const parseLocation = (locationString) => {
    if (!locationString) return null;
    
    try {
      // Handle format like "Lat: 23.9455, Lng: 90.3833"
      const latMatch = locationString.match(/Lat:\s*(-?\d+\.?\d*)/i);
      const lngMatch = locationString.match(/Lng:\s*(-?\d+\.?\d*)/i);
      
      if (latMatch && lngMatch) {
        const lat = parseFloat(latMatch[1]);
        const lng = parseFloat(lngMatch[1]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
      
      // Handle other potential formats
      // You can add more parsing logic here for different location formats
      
    } catch (err) {
      console.error('Error parsing location:', err);
    }
    
    return null;
  };

  useEffect(() => {
    // Get user's current location
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const location = { lat: latitude, lng: longitude };
            setUserLocation(location);
            setMapCenter([latitude, longitude]);
          },
          (error) => {
            console.error("Error getting location:", error);
            // Use default location (Dhaka) if geolocation fails
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      }
    };

    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return null;

        const response = await fetch("http://localhost:8080/api/profile/me", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
          return profile;
        }
        return null;
      } catch (err) {
        console.error("Error fetching user profile:", err);
        return null;
      }
    };

    // Fetch jobs from API
    const fetchJobs = async (profile) => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("Please login to view nearby jobs");
          router.push("/login");
          return;
        }

        const response = await fetch("http://localhost:8080/api/jobs", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }

        const jobsData = await response.json();
        
        // Filter jobs that have valid location data, user hasn't applied to, and are OPEN
        const jobsWithLocation = jobsData.filter(job => {
          const coords = parseLocation(job.location);
          const hasValidLocation = coords !== null;
          
          // Don't show jobs the user has already applied to
          const hasNotApplied = !job.applicantIds?.includes(profile?.id);
          
          // Only show OPEN jobs
          const isOpen = job.status === 'OPEN';
          
          return hasValidLocation && hasNotApplied && isOpen;
        });

        setJobs(jobsWithLocation);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    const initializeData = async () => {
      getCurrentLocation();
      const profile = await fetchUserProfile();
      await fetchJobs(profile);
    };

    initializeData();
  }, [router]);

  // Separate fetchJobs function for refreshing after apply
  const refreshJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:8080/api/jobs", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const jobsData = await response.json();
        const jobsWithLocation = jobsData.filter(job => {
          const coords = parseLocation(job.location);
          const hasValidLocation = coords !== null;
          
          // Don't show jobs the user has already applied to
          const hasNotApplied = !job.applicantIds?.includes(userProfile?.id);
          
          // Only show OPEN jobs
          const isOpen = job.status === 'OPEN';
          
          return hasValidLocation && hasNotApplied && isOpen;
        });
        setJobs(jobsWithLocation);
      }
    } catch (err) {
      console.error("Error refreshing jobs:", err);
    }
  };

  const handleApplyJob = async (jobId) => {
    if (!userProfile?.id) {
      alert("Unable to get user profile. Please refresh the page.");
      return;
    }

    setApplying(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/jobs/${jobId}/apply/${userProfile.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert("Application submitted successfully!");
        // Clear selected job and refresh jobs to update applicant status
        setSelectedJob(null);
        refreshJobs();
      } else {
        const errorText = await response.text();
        alert(`Failed to apply for job: ${errorText}`);
      }
    } catch (err) {
      console.error("Error applying for job:", err);
      alert("Failed to apply for job. Please try again.");
    } finally {
      setApplying(false);
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
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading nearby jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,theme(colors.teal.100)_0%,theme(colors.teal.50)_35%,theme(colors.white)_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,oklch(0.3_0.05_210)_0%,oklch(0.22_0.025_250)_60%)]">
        <div className="text-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Error Loading Jobs</h3>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradients matching dashboard */}
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>
      
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-10 px-6 space-y-10">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
            Nearby Jobs
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Found {jobs.length} open job{jobs.length !== 1 ? 's' : ''} with location data
          </p>
        </div>

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`${subtleCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Available Jobs</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{jobs.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className={`${subtleCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Your Location</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {userLocation ? '📍' : '❓'}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className={`${subtleCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Applicants</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {jobs.reduce((total, job) => total + (job.applicantIds?.length || 0), 0)}
                </p>
              </div>
            </div>
          </Card>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)]">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className={`${subtleCard} h-full`}>
              <CardContent className="p-0 h-full">
                <div className="h-full rounded-2xl overflow-hidden">
                  <LeafletMap
                    center={userLocation ? [userLocation.lat, userLocation.lng] : mapCenter}
                    zoom={userLocation ? 15 : 12}
                    userLocation={userLocation}
                    jobs={jobs}
                    onJobClick={setSelectedJob}
                    parseLocation={parseLocation}
                    height="100%"
                    width="100%"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Details Sidebar */}
          <div className="lg:col-span-1">
            <Card className={`${subtleCard} h-full`}>
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {selectedJob ? (
                    <>
                      <Briefcase className="h-5 w-5 text-teal-600" />
                      Job Details
                    </>
                  ) : (
                    <>
                      <MapPin className="h-5 w-5 text-slate-500" />
                      Select a job on the map
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[calc(100vh-420px)]">
                {selectedJob ? (
                  <div className="space-y-6 text-slate-700 dark:text-slate-300">
                    {/* Header */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {selectedJob.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {selectedJob.position}
                      </p>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {selectedJob.status}
                      </Badge>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`${gradientPanel} p-3 rounded-lg`}>
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Salary</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {selectedJob.minSalary && selectedJob.maxSalary 
                            ? `${selectedJob.minSalary} - ${selectedJob.maxSalary}` 
                            : 'Not specified'}
                        </p>
                      </div>
                      <div className={`${gradientPanel} p-3 rounded-lg`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-indigo-600" />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Applicants</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {selectedJob.applicantIds?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-teal-500" />
                        Description
                      </h4>
                      <p className="text-sm leading-relaxed">{selectedJob.description}</p>
                    </div>

                    {/* Requirements */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Required Skills</h4>
                        <p className="text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">{selectedJob.requiredSkills}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Experience</h4>
                        <p className="text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">{selectedJob.requiredExperience}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Education</h4>
                        <p className="text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">{selectedJob.requiredEducation}</p>
                      </div>
                    </div>

                    {/* Location & Dates */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Location</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{selectedJob.location}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-slate-500 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Posted</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{selectedJob.datePosted}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-red-500 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Application Deadline</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{selectedJob.endDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <Button 
                      onClick={() => handleApplyJob(selectedJob.jobId)}
                      className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                      disabled={selectedJob.status !== 'OPEN' || applying || 
                        (userProfile && selectedJob.applicantIds?.includes(userProfile.id))}
                    >
                      {applying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Applying...
                        </>
                      ) : userProfile && selectedJob.applicantIds?.includes(userProfile.id) ? (
                        'Already Applied'
                      ) : selectedJob.status === 'OPEN' ? (
                        'Apply for Job'
                      ) : (
                        'Job Closed'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="rounded-full bg-slate-100 dark:bg-slate-800 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      No job selected
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Click on any green marker on the map to view job details
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}