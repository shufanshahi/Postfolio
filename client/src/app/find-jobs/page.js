"use client";
import { useEffect, useState } from "react";
import { jobServiceFetch } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FindJobs() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [minSalaryFilter, setMinSalaryFilter] = useState("");
  const [maxSalaryFilter, setMaxSalaryFilter] = useState("");

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const profileRes = await fetch('http://localhost:8080/api/profile/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!profileRes.ok) {
        setLoading(false);
        alert("Failed to get user profile. Please try again.");
        return;
      }
      const profile = await profileRes.json();

      // Fetch matched jobs with scores
      const res = await jobServiceFetch('/api/jobs/matched');
      if (res.ok) {
        const jobsData = await res.json();
        const jobsWithEmployerInfo = await Promise.all(
          jobsData.map(async (job) => {
            const employerRes = await fetch(`http://localhost:8080/api/profile/${job.employerId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            const employer = employerRes.ok ? await employerRes.json() : { name: 'Unknown' };
            return { ...job, employerName: employer.name };
          })
        );
        const withAppliedFlag = jobsWithEmployerInfo.map(job => ({ ...job, isApplied: job.applicantIds?.includes(profile.id) }));
        // Ensure sort by score descending (backend already sorts, but keep client-side safety)
        withAppliedFlag.sort((a, b) => (b?.matchingScore?.totalScore || 0) - (a?.matchingScore?.totalScore || 0));
        setJobs(withAppliedFlag);
      }
      setLoading(false);
    }
    fetchJobs();
  }, []);

  // Filter jobs based on search criteria
  useEffect(() => {
    let filtered = jobs;

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Filter by title search
    if (searchTitle.trim()) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    // Filter by salary range
    if (minSalaryFilter) {
      filtered = filtered.filter(job => 
        job.maxSalary >= parseInt(minSalaryFilter)
      );
    }

    if (maxSalaryFilter) {
      filtered = filtered.filter(job => 
        job.minSalary <= parseInt(maxSalaryFilter)
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTitle, statusFilter, minSalaryFilter, maxSalaryFilter]);

  const handleApply = async (jobId) => {
    setLoading(true);
    const profileRes = await fetch('http://localhost:8080/api/profile/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!profileRes.ok) {
      setLoading(false);
      alert("Failed to get user profile. Please try again.");
      return;
    }
    const profile = await profileRes.json();

    const applyRes = await fetch(`http://localhost:8080/api/jobs/${jobId}/apply/${profile.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (applyRes.ok) {
      alert("Application successful!");
      // Refresh jobs to update isApplied status
      const profileRes = await fetch('http://localhost:8080/api/profile/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setJobs(jobs.map(job => 
          job.jobId === jobId 
            ? { ...job, isApplied: true, applicantIds: [...(job.applicantIds || []), profile.id] }
            : job
        ));
      }
    } else {
      alert("Failed to apply for the job. Please try again.");
    }
    setLoading(false);
  };

  const handleWithdraw = async (jobId) => {
    setLoading(true);
    const profileRes = await fetch('http://localhost:8080/api/profile/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!profileRes.ok) {
      setLoading(false);
      alert("Failed to get user profile. Please try again.");
      return;
    }
    const profile = await profileRes.json();

    const withdrawRes = await fetch(`http://localhost:8080/api/jobs/${jobId}/withdraw/${profile.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (withdrawRes.ok) {
      alert("Withdrawal successful!");
      // Refresh jobs to update isApplied status
      const profileRes = await fetch('http://localhost:8080/api/profile/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setJobs(jobs.map(job => 
          job.jobId === jobId 
            ? { ...job, isApplied: false, applicantIds: (job.applicantIds || []).filter(id => id !== profile.id) }
            : job
        ));
      }
    } else {
      alert("Failed to withdraw from the job. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-6">Find Jobs</h1>
        
        {/* Filter Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search by Title */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Search by Title</label>
                <Input
                  type="text"
                  placeholder="Enter job title..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">All Jobs</option>
                  <option value="OPEN">Open Jobs</option>
                  <option value="CLOSED">Closed Jobs</option>
                </select>
              </div>

              {/* Min Salary Filter */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Min Salary</label>
                <Input
                  type="number"
                  placeholder="Minimum salary..."
                  value={minSalaryFilter}
                  onChange={(e) => setMinSalaryFilter(e.target.value)}
                  className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                  min="0"
                />
              </div>

              {/* Max Salary Filter */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Max Salary</label>
                <Input
                  type="number"
                  placeholder="Maximum salary..."
                  value={maxSalaryFilter}
                  onChange={(e) => setMaxSalaryFilter(e.target.value)}
                  className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>

            {/* Results Count and Clear Filters */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-gray-400 text-sm">
                Showing {filteredJobs.length} of {jobs.length} jobs
              </div>
              {(searchTitle || statusFilter !== "ALL" || minSalaryFilter || maxSalaryFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTitle("");
                    setStatusFilter("ALL");
                    setMinSalaryFilter("");
                    setMaxSalaryFilter("");
                  }}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading && <div className="text-gray-400">Loading...</div>}
          {!loading && filteredJobs.length === 0 && jobs.length === 0 && (
            <div className="text-gray-400">No jobs available.</div>
          )}
          {!loading && filteredJobs.length === 0 && jobs.length > 0 && (
            <div className="text-gray-400">No jobs match your current filters.</div>
          )}
          {filteredJobs.map((job) => (
            <Card key={job.jobId} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {job.title}
                  {typeof job?.matchingScore?.totalScore === 'number' && (
                    <span className="ml-2 text-green-400 text-sm">Score: {job.matchingScore.totalScore}</span>
                  )}
                  <br />
                  <span className="text-gray-400 text-sm">Posted by: {job.employerName || 'Loading...'}</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  <span className="font-semibold">Position:</span> {job.position} <br />
                  Posted: {job.datePosted} | Ends: {job.endDate}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-300">
                <div>
                  <span className="font-semibold">Salary Range:</span> {job.minSalary && job.maxSalary ? `${job.minSalary} - ${job.maxSalary}` : 'Not specified'}
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Description:</span> {job.description || 'N/A'}
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Required Project:</span> {job.requiredProject || 'N/A'}
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Required Experience:</span> {job.requiredExperience || 'N/A'}
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Required Skills:</span> {job.requiredSkills || 'N/A'}
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Required Education:</span> {job.requiredEducation || 'N/A'}
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
                {job.status !== "CLOSED" && (
                  job.isApplied ? (
                    <button
                      onClick={() => handleWithdraw(job.jobId)}
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-2"
                    >
                      Withdraw
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApply(job.jobId)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  )
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
