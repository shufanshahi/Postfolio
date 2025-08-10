"use client";
import { useEffect, useState } from "react";
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
      const res = await fetch("http://localhost:8080/api/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setJobs(await res.json());
      }
      setLoading(false);
    }
    fetchJobs();
  }, []);

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
                <CardTitle className="text-white">{job.title}</CardTitle>
                <CardDescription className="text-gray-400">
                  <span className="font-semibold">Position:</span> {job.position} <br />
                  Posted: {job.datePosted} | Ends: {job.endDate}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-300">
                <div>
                  <span className="font-semibold">Requirements:</span> {job.requirements}
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
