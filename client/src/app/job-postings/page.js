"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch, jobServiceFetch } from '@/lib/api';
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function JobPostings() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [showNewJob, setShowNewJob] = useState(false);
  const [form, setForm] = useState({
      title: "",
      position: "",
      description: "",
      requiredProject: "",
      requiredExperience: "",
      requiredSkills: "",
      requiredEducation: "",
      endDate: "",
    });
  const [loading, setLoading] = useState(false);
  const [profileInfo, setProfileInfo] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      alert("You are not logged in. Please login first.");
      router.push("/login");
      return;
    }
    // Get user profile to extract employerId
    const profileRes = await apiFetch('/api/profile/me');
    if (!profileRes.ok) {
      setLoading(false);
      alert("Failed to get user profile. Please try again.");
      return;
    }
    const profile = await profileRes.json();
    const res = await jobServiceFetch(`/api/jobs/employer/${profile.id}`);
    if (res.ok) {
      setJobs(await res.json());
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchJobs();
  }, [router, fetchJobs]);

  useEffect(() => {
    const fetchProfile = async () => {
      const profileRes = await apiFetch('/api/profile/me');

      if (!profileRes.ok) {
        setLoading(false);
        alert("Failed to get user profile. Please try again.");
        return;
      }

      const profile = await profileRes.json();
      setProfileInfo(profile);
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleViewApplicants = (jobId) => {
    // Navigate to applicants page or show applicants modal
    router.push(`/job-applicants/${jobId}`);
  };

  const handleNewJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      alert("You are not logged in. Please login first.");
      router.push("/login");
      return;
    }
    
    // Get user profile to extract userId
    const profileRes = await apiFetch('/api/profile/me');
    
    if (!profileRes.ok) {
      setLoading(false);
      alert("Failed to get user profile. Please try again.");
      return;
    }
    
    const profile = await profileRes.json();
    
    const res = await jobServiceFetch('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        datePosted: new Date().toISOString().slice(0, 10),
        employerId: profile.id,
      }),
    });
    if (res.ok) {
      setShowNewJob(false);
  setForm({ title: "", position: "", description: "", requiredProject: "", requiredExperience: "", requiredSkills: "", requiredEducation: "", endDate: "" });
      fetchJobs();
    }
    setLoading(false);
  };

  const handleDeletePost = async (jobId) => {
    setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8080/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      alert("Job post deleted successfully!");
      fetchJobs();
    } else {
      alert("Failed to delete the job post. Please try again.");
    }
    setLoading(false);
  };

  const handleTogglePostStatus = async (jobId, currentStatus) => {
    setLoading(true);
          const token = localStorage.getItem("token");

    const newStatus = currentStatus === "CLOSED" ? "OPEN" : "CLOSED";
    const res = await fetch(`http://localhost:8080/api/jobs/${jobId}/status?status=${newStatus}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      alert(`Job post status changed to ${newStatus} successfully!`);
      fetchJobs();
    } else {
      alert("Failed to change the job post status. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Job Postings</h1>
          <Button onClick={() => setShowNewJob((v) => !v)}>
            {showNewJob ? "Cancel" : "New Post"}
          </Button>
        </div>
        {showNewJob && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Create New Job</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNewJob} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-1">Title</label>
                    <Input
                      name="title"
                      value={form.title}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Position</label>
                    <Input
                      name="position"
                      value={form.position}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Description</label>
                    <Textarea
                      name="description"
                      value={form.description}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Required Project</label>
                    <Textarea
                      name="requiredProject"
                      value={form.requiredProject}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Required Experience</label>
                    <Textarea
                      name="requiredExperience"
                      value={form.requiredExperience}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Required Skills</label>
                    <Textarea
                      name="requiredSkills"
                      value={form.requiredSkills}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Required Education</label>
                    <Textarea
                      name="requiredEducation"
                      value={form.requiredEducation}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">End Date</label>
                    <Input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-700 text-white"
                    />
                  </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Posting..." : "Post Job"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
        <div className="space-y-4">
          {loading && <div className="text-gray-400">Loading...</div>}
          {!loading && jobs.length === 0 && (
            <div className="text-gray-400">No jobs posted yet.</div>
          )}
          {jobs.map((job) => (
            <Card key={job.jobId} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-white">
                    {job.title} <br />
                    <span className="text-gray-400 text-sm">Posted by: {profileInfo?.name || 'Loading...'}</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                      <span className="font-semibold">Position:</span> {job.position} <br />
                    Posted: {job.datePosted} | Ends: {job.endDate}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                      <span className="sr-only">Open menu</span>
                      <div className="flex flex-col items-center justify-center space-y-0.5">
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-700 border-gray-600">
                    <DropdownMenuItem 
                      onClick={() => handleViewApplicants(job.jobId)}
                      className="text-gray-300 hover:text-white hover:bg-gray-600"
                    >
                      View Applicants
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleTogglePostStatus(job.jobId, job.status)}
                      className="text-gray-300 hover:text-white hover:bg-gray-600"
                    >
                      {job.status === "CLOSED" ? "Open Post" : "Close Post"}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeletePost(job.jobId)}
                      className="text-gray-300 hover:text-white hover:bg-gray-600"
                    >
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="text-gray-300">
                <div>
                  <span className="font-semibold">Required Project:</span> {job.requiredProject}
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Required Experience:</span> {job.requiredExperience}
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Required Skills:</span> {job.requiredSkills}
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Required Education:</span> {job.requiredEducation}
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Status:</span> {job.status}
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Applicants:</span> {job.applicantIds?.length || 0}
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Selected:</span> {job.selectedApplicantIds?.length || 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
