"use client";
import { useEffect, useState, useCallback } from "react";
import { Dialog } from "@headlessui/react";
import { useParams, useRouter } from "next/navigation";
import { jobServiceFetch } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function JobApplicants() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId;
  
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
  const handleScheduleClick = (applicantId) => {
    setSelectedApplicant(applicantId);
    setShowSchedule(true);
    setScheduleInput("");
    setNotesInput("");
    setScheduleError("");
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
        return await res.json();
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
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-white text-center">Loading job applicants...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-red-400 text-center mb-4">{error}</div>
          <div className="text-center">
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="mb-4 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              ← Back to Job Postings
            </Button>
            <h1 className="text-3xl font-bold text-white">Job Applicants</h1>
            {job && (
              <p className="text-gray-400 mt-2">
                Showing applicants for: <span className="text-white font-semibold">{job.title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Job Details Card */}
        {job && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">{job.title}</CardTitle>
              <CardDescription className="text-gray-400">
                <span className="font-semibold">Position:</span> {job.position} <br />
                Posted: {job.datePosted} | Ends: {job.endDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-300">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Status:</span> {job.status}
                </div>
                <div>
                  <span className="font-semibold">Total Applicants:</span> {job.applicantIds?.length || 0}
                </div>
                <div>
                  <span className="font-semibold">Selected:</span> {job.selectedApplicantIds?.length || 0}
                </div>
                <div>
                  <span className="font-semibold">Salary Range:</span> {job.minSalary && job.maxSalary ? `${job.minSalary} - ${job.maxSalary}` : 'Not specified'}
                </div>
              </div>
              {job.description && (
                <div className="mt-4">
                  <span className="font-semibold">Description:</span>
                  <p className="mt-1 text-gray-400">{job.description}</p>
                </div>
              )}
              <div className="mt-4">
                <span className="font-semibold">Required Project:</span>
                <p className="mt-1 text-gray-400">{job.requiredProject}</p>
              </div>
              <div className="mt-4">
                <span className="font-semibold">Required Experience:</span>
                <p className="mt-1 text-gray-400">{job.requiredExperience}</p>
              </div>
              <div className="mt-4">
                <span className="font-semibold">Required Skills:</span>
                <p className="mt-1 text-gray-400">{job.requiredSkills}</p>
              </div>
              <div className="mt-4">
                <span className="font-semibold">Required Education:</span>
                <p className="mt-1 text-gray-400">{job.requiredEducation}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applicants Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Applicants</CardTitle>
            <CardDescription className="text-gray-400">
              {job?.applicantIds?.length ? 
                `${job.applicantIds.length} applicant(s) found` : 
                "No applicants yet"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!job?.applicantIds || job.applicantIds.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                No one has applied for this job yet.
              </div>
            ) : (
              <div className="space-y-3">
                {applicantsWithDetails.map(({ applicantId, interview, profile }, index) => (
                  <div 
                    key={applicantId} 
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {profile ? `${profile.name} ` : ``}
                        </p>
                        {profile?.email && (
                          <p className="text-gray-400 text-sm">{profile.email}</p>
                        )}
                        {interview && (
                          <p className="text-gray-400 text-sm">Interview Status: {interview.status}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewProfile(applicantId)}
                        className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500"
                      >
                        View Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-blue-700 border-blue-600 text-white hover:bg-blue-600"
                        onClick={() => handleScheduleClick(applicantId)}
                      >
                        {interview ? "Reschedule" : "Schedule"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-green-700 border-green-600 text-white hover:bg-green-600"
                      >
                        Select
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-yellow-600 border-yellow-500 text-white hover:bg-yellow-700"
                        onClick={() => handleStartInterview(applicantId)}
                      >
                        Start Interview
                      </Button>
                    </div>
                  </div>
                ))}
      {/* Schedule Modal */}
      {showSchedule && (
        <Dialog open={showSchedule} onClose={() => setShowSchedule(false)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <Dialog.Panel className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
              <form onSubmit={handleScheduleSubmit}>
                <h2 className="text-white mb-2 text-lg font-bold">Schedule Interview</h2>
                <label className="block text-gray-300 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleInput}
                  onChange={e => setScheduleInput(e.target.value)}
                  className="mb-2 p-1 rounded w-full bg-gray-800 text-white border border-gray-600"
                  required
                />
                <label className="block text-gray-300 mb-1">Notes</label>
                <textarea
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  className="mb-2 p-1 rounded w-full bg-gray-800 text-white border border-gray-600"
                />
                {scheduleError && <div className="text-red-400 mb-2">{scheduleError}</div>}
                <div className="flex gap-2">
                  <Button type="submit" className="bg-green-700">Submit</Button>
                  <Button type="button" onClick={() => setShowSchedule(false)}>Cancel</Button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Applicants Section (if any) */}
        {job?.selectedApplicantIds && job.selectedApplicantIds.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Selected Applicants</CardTitle>
              <CardDescription className="text-gray-400">
                {job.selectedApplicantIds.length} applicant(s) selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {job.selectedApplicantIds.map((applicantId, index) => (
                  <div 
                    key={applicantId} 
                    className="flex items-center justify-between p-4 bg-green-900 rounded-lg border border-green-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                        ✓
                      </div>
                      <div>
                        <p className="text-white font-medium">Selected Applicant ID: {applicantId}</p>
                        <p className="text-green-400 text-sm">Selected for {job.position}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewProfile(applicantId)}
                      className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500"
                    >
                      View Profile
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
