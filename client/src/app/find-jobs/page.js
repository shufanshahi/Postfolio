"use client";
import { useEffect, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
import { jobServiceFetch } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, Filter, MapPin, DollarSign, Calendar, Users, 
  Briefcase, Clock, Award, TrendingUp, Eye, X, 
  CheckCircle, AlertCircle, Loader2, Star
} from "lucide-react";
import Navbar from '@/components/Navbar';

function FindJobs() {
  const { user } = useAuth();
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
                Discover Opportunities
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-teal-500" />
                AI-powered job matching tailored for you
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/60 backdrop-blur border-slate-300/60 text-slate-700">
                {filteredJobs.length} jobs found
              </Badge>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Smart Filters</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Min Salary Filter */}
                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Min Salary</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      placeholder="Minimum..."
                      value={minSalaryFilter}
                      onChange={(e) => setMinSalaryFilter(e.target.value)}
                      className="pl-10 bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                      min="0"
                    />
                  </div>
                </div>

                {/* Max Salary Filter */}
                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Max Salary</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      placeholder="Maximum..."
                      value={maxSalaryFilter}
                      onChange={(e) => setMaxSalaryFilter(e.target.value)}
                      className="pl-10 bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Results Count and Clear Filters */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
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
                    className="bg-white/60 dark:bg-slate-700/60 backdrop-blur border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600/80 rounded-xl"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <div className="space-y-6">
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Discovering opportunities for you...</p>
            </div>
          )}
          
          {!loading && filteredJobs.length === 0 && jobs.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No jobs available at the moment.</p>
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
              className="group overflow-hidden cursor-pointer relative rounded-2xl bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-teal-50/70 via-transparent to-amber-50/60 dark:from-teal-500/10 dark:to-indigo-500/10" />
              
              <CardHeader className="relative pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                        {job.title}
                      </CardTitle>
                      {typeof job?.matchingScore?.totalScore === 'number' && (
                        <Badge className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-sm">
                          <Award className="h-3 w-3 mr-1" />
                          {job.matchingScore.totalScore}% match
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span className="font-medium">{job.position}</span>
                      <span className="text-slate-400">•</span>
                      <span>{job.employerName || 'Loading...'}</span>
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
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
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
                    {job.minSalary && job.maxSalary && (
                      <div className="text-right">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {job.minSalary} - {job.maxSalary}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Salary Range</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Description:</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {job.description || 'No description provided'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Required Skills:</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {job.requiredSkills || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Experience Required:</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {job.requiredExperience || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Education:</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {job.requiredEducation || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-slate-700/60" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Users className="h-4 w-4" />
                      <span>{job.applicantIds?.length || 0} applicants</span>
                    </div>
                    {job.selectedApplicantIds?.length > 0 && (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>{job.selectedApplicantIds.length} selected</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/job-mock-interview/${job.jobId}`}
                      className="bg-white/60 dark:bg-slate-700/60 backdrop-blur border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Mock Interview
                    </Button>
                    
                    {job.status !== "CLOSED" && (
                      job.isApplied ? (
                        <Button
                          onClick={() => handleWithdraw(job.jobId)}
                          variant="outline"
                          size="sm"
                          className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleApply(job.jobId)}
                          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm rounded-xl"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Apply Now
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


export default withAuth(FindJobs);
