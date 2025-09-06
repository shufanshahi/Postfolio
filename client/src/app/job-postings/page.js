"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
import { apiFetch, jobServiceFetch } from '@/lib/api';
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Plus, Search, Filter, MapPin, DollarSign, Calendar, Users, 
  Briefcase, Clock, Award, TrendingUp, Eye, X, MoreVertical,
  CheckCircle, AlertCircle, Loader2, Star, Edit, Trash2,
  UserCheck, Target, Building
} from "lucide-react";
import LocationMap from "@/components/LocationMap";
import Navbar from '@/components/Navbar';

function JobPostings() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [showNewJob, setShowNewJob] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState({
    title: "",
    position: "",
    description: "",
    minSalary: "",
    maxSalary: "",
    requiredProject: "",
    requiredExperience: "",
    requiredSkills: "",
    requiredEducation: "",
    endDate: "",
    location: "",
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

  // Filter jobs based on search title and status
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

    setFilteredJobs(filtered);
  }, [jobs, searchTitle, statusFilter]);

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

  const handleLocationSelect = (locationData) => {
    setForm({
      ...form,
      location: locationData.address
    });
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
      setForm({ title: "", position: "", description: "", minSalary: "", maxSalary: "", requiredProject: "", requiredExperience: "", requiredSkills: "", requiredEducation: "", endDate: "", location: "" });
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Gradients */}
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>

      <Navbar />

      <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
                Job Management
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
                <Building className="h-4 w-4 text-teal-500" />
                Create and manage your job opportunities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/60 backdrop-blur border-slate-300/60 text-slate-700">
                {filteredJobs.length} jobs posted
              </Badge>
              <Button
                onClick={() => setShowNewJob((v) => !v)}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showNewJob ? "Cancel" : "New Post"}
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Filter Posts</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search by Title */}
                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Search by Title</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Enter job title..."
                      value={searchTitle}
                      onChange={(e) => setSearchTitle(e.target.value)}
                      className="pl-10 bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-3 bg-white/70 dark:bg-slate-700/70 backdrop-blur text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600/60 rounded-xl focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none transition-colors"
                  >
                    <option value="ALL">All Jobs</option>
                    <option value="OPEN">Open Jobs</option>
                    <option value="CLOSED">Closed Jobs</option>
                  </select>
                </div>

                {/* Results Count and Clear Filters */}
                <div className="flex items-end justify-between">
                  <div className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Showing {filteredJobs.length} of {jobs.length} jobs
                  </div>
                  {(searchTitle || statusFilter !== "ALL") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTitle("");
                        setStatusFilter("ALL");
                      }}
                      className="bg-white/60 dark:bg-slate-700/60 backdrop-blur border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600/80 rounded-xl"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Job Form */}
        {showNewJob && (
          <Card className="bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-sm">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100">Create New Job Posting</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Fill in the details to attract the right candidates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNewJob} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Job Title</label>
                    <Input
                      name="title"
                      value={form.title}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Senior Software Engineer"
                      className="bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Position</label>
                    <Input
                      name="position"
                      value={form.position}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Full-time, Contract"
                      className="bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Job Description</label>
                  <Textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    required
                    placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                    className="bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Min Salary</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        name="minSalary"
                        type="number"
                        value={form.minSalary}
                        onChange={handleInputChange}
                        required
                        placeholder="50000"
                        className="pl-10 bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Max Salary</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        name="maxSalary"
                        type="number"
                        value={form.maxSalary}
                        onChange={handleInputChange}
                        required
                        placeholder="80000"
                        className="pl-10 bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Required Project Experience</label>
                    <Textarea
                      name="requiredProject"
                      value={form.requiredProject}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. 3+ years of web development projects..."
                      className="bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Required Experience</label>
                    <Textarea
                      name="requiredExperience"
                      value={form.requiredExperience}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. 5+ years in software development..."
                      className="bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Required Skills</label>
                    <Textarea
                      name="requiredSkills"
                      value={form.requiredSkills}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. React, Node.js, Python, AWS..."
                      className="bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Required Education</label>
                    <Textarea
                      name="requiredEducation"
                      value={form.requiredEducation}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Bachelor's in Computer Science or equivalent..."
                      className="bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Application Deadline</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="date"
                        name="endDate"
                        value={form.endDate}
                        onChange={handleInputChange}
                        required
                        className="pl-10 bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Location</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          name="location"
                          value={form.location}
                          onChange={handleInputChange}
                          placeholder="Click 'Select on Map' to choose location"
                          className="pl-10 bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                          readOnly
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => setShowLocationMap(true)}
                        variant="outline"
                        className="bg-white/60 dark:bg-slate-700/60 backdrop-blur border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600/80 rounded-xl"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Select on Map
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-slate-700/60" />

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewJob(false)}
                    className="bg-white/60 dark:bg-slate-700/60 backdrop-blur border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600/80 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm rounded-xl"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Post Job
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Jobs List */}
        <div className="space-y-6">
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Loading your job postings...</p>
            </div>
          )}
          
          {!loading && filteredJobs.length === 0 && jobs.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No jobs posted yet. Create your first job posting!</p>
            </div>
          )}
          
          {!loading && filteredJobs.length === 0 && jobs.length > 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No jobs match your current filters.</p>
            </div>
          )}

          {filteredJobs.map((job) => (
            <Card 
              key={job.jobId} 
              className="group overflow-hidden relative rounded-2xl bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-teal-50/70 via-transparent to-amber-50/60 dark:from-teal-500/10 dark:to-indigo-500/10" />
              
              <CardHeader className="relative pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                        {job.title}
                      </CardTitle>
                      <Badge 
                        variant={job.status === 'OPEN' ? 'default' : 'secondary'}
                        className={job.status === 'OPEN' 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" 
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300"
                        }
                      >
                        {job.status === 'OPEN' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                        {job.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span className="font-medium">{job.position}</span>
                      <span className="text-slate-400">•</span>
                      <span>Posted by: {profileInfo?.name || 'Loading...'}</span>
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Posted: {job.datePosted}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Ends: {job.endDate}
                      </div>
                      {job.minSalary && job.maxSalary && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {job.minSalary} - {job.maxSalary}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white/90 dark:bg-slate-800/90 backdrop-blur border-slate-200/60 dark:border-slate-700/60 rounded-xl">
                      <DropdownMenuItem 
                        onClick={() => handleViewApplicants(job.jobId)}
                        className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        View Applicants
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleTogglePostStatus(job.jobId, job.status)}
                        className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg"
                      >
                        {job.status === "CLOSED" ? <CheckCircle className="h-4 w-4 mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                        {job.status === "CLOSED" ? "Open Post" : "Close Post"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeletePost(job.jobId)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Required Project:</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{job.requiredProject}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Required Experience:</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{job.requiredExperience}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Required Skills:</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{job.requiredSkills}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Required Education:</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{job.requiredEducation}</p>
                  </div>
                </div>

                {job.location && (
                  <div className="text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location:
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">{job.location}</p>
                  </div>
                )}

                <Separator className="bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-slate-700/60" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Users className="h-4 w-4" />
                      <span>{job.applicantIds?.length || 0} applicants</span>
                    </div>
                    {job.selectedApplicantIds?.length > 0 && (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Target className="h-4 w-4" />
                        <span>{job.selectedApplicantIds.length} selected</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleViewApplicants(job.jobId)}
                    variant="outline"
                    size="sm"
                    className="bg-white/60 dark:bg-slate-700/60 backdrop-blur border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600/80 rounded-xl"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    View Applicants
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <LocationMap
        isOpen={showLocationMap}
        onClose={() => setShowLocationMap(false)}
        onLocationSelect={handleLocationSelect}
      />
    </div>
  );
}


export default withAuth(JobPostings);
