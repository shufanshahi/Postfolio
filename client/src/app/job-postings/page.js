"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function JobPostings() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [showNewJob, setShowNewJob] = useState(false);
  const [form, setForm] = useState({
      title: "",
      position: "",
      description: "",
      requirements: "",
      endDate: "",
    });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      alert("You are not logged in. Please login first.");
      router.push("/login");
      return;
    }
    const res = await fetch("http://localhost:8080/api/jobs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setJobs(await res.json());
    }
    console.log("Jobs fetched successfully:", jobs);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    const res = await fetch("http://localhost:8080/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        datePosted: new Date().toISOString().slice(0, 10),
        employerId: localStorage.getItem("userId"),
      }),
    });
    if (res.ok) {
      setShowNewJob(false);
      setForm({ title: "", position: "", description: "", requirements: "", endDate: "" });
      fetchJobs();
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
                    <label className="block text-gray-300 mb-1">Requirements</label>
                    <Textarea
                      name="requirements"
                      value={form.requirements}
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
