"use client";
import { useEffect, useState } from "react";
import { jobServiceFetch } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function FindJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

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

      const res = await jobServiceFetch('/api/jobs');
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
        setJobs(jobsWithEmployerInfo.map(job => ({ ...job, isApplied: job.applicantIds?.includes(profile.id) })));
      }
      setLoading(false);
    }
    fetchJobs();
  }, []);

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
    } else {
      alert("Failed to withdraw from the job. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-6">Find Jobs</h1>
        <div className="space-y-4">
          {loading && <div className="text-gray-400">Loading...</div>}
          {!loading && jobs.length === 0 && (
            <div className="text-gray-400">No jobs available.</div>
          )}
          {jobs.map((job) => (
            <Card key={job.jobId} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {job.title} <br />
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
