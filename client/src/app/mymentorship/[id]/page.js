'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from '@/components/ui/card';
import {
  Button
} from '@/components/ui/button';
import {
  Badge
} from '@/components/ui/badge';
import {
  Avatar, AvatarImage, AvatarFallback
} from '@/components/ui/avatar';
import {
  Alert, AlertDescription
} from '@/components/ui/alert';
import {
  Input
} from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  User, Users, Clock, Star, Calendar, DollarSign, Search, Filter,
  BookOpen, Award, TrendingUp, Heart, Eye, Video, MessageSquare,
  CheckCircle, AlertCircle, Loader2, ArrowRight, RefreshCw
} from 'lucide-react';
import Navbar from '@/components/Navbar';

// Design tokens matching dashboard theme
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

export default function MyMentorshipPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchEnrollments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/enrollments/profile/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const enrollmentData = await response.json();
      console.log('Fetched enrollments:', enrollmentData);
      setEnrollments(enrollmentData);
    } catch (err) {
      setError(err.message || 'Failed to fetch enrollments');
      console.error('Fetch enrollments error:', err);
    }
  }, [profileId]);

  // Fetch data on component mount
  useEffect(() => {
    async function initializePage() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        // Get user profile
        const profileRes = await apiFetch('/api/profile/me');
        if (!profileRes.ok) {
          throw new Error('Failed to fetch profile');
        }
        const profile = await profileRes.json();
        setUserProfile(profile);

        // Fetch enrollments for the profile
        await fetchEnrollments();

      } catch (err) {
        setError(err.message || 'Failed to load mentorships');
        console.error('Page initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [router, profileId, fetchEnrollments]);

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not scheduled';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (enrollment) => {
    const now = new Date();
    const enrollmentTime = new Date(enrollment.time);
    
    if (enrollmentTime < now) {
      return { label: 'Completed', variant: 'default', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
    } else {
      return { label: 'Upcoming', variant: 'secondary', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    // Debug: log the enrollment structure
    console.log('Enrollment object:', enrollment);
    
    // Handle case where mentorship data might be nested differently
    const mentorshipData = enrollment.mentorship || enrollment;
    const mentorshipName = mentorshipData?.name || mentorshipData?.mentorshipName || '';
    const mentorshipSpecialization = mentorshipData?.specialization || '';
    
    const matchesSearch = mentorshipName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mentorshipSpecialization.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    // Handle time comparison more safely
    const enrollmentTime = enrollment.time ? new Date(enrollment.time) : null;
    if (!enrollmentTime) return matchesSearch; // If no time, show in results
    
    const now = new Date();
    const isUpcoming = enrollmentTime >= now;
    const isCompleted = enrollmentTime < now;
    
    if (statusFilter === 'upcoming') return matchesSearch && isUpcoming;
    if (statusFilter === 'completed') return matchesSearch && isCompleted;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="pointer-events-none select-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
          <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
        </div>
        
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading your mentorships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Gradients */}
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>
      
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-10 px-6 space-y-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
              My Mentorships
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-teal-500" />
              Track your learning journey and upcoming sessions
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white/60 backdrop-blur border-slate-300/60 text-slate-700">
              {filteredEnrollments.length} enrollments
            </Badge>
            <Button
              onClick={fetchEnrollments}
              variant="outline"
              className="bg-white/60 dark:bg-slate-700/60 backdrop-blur border-slate-300/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600/80 rounded-xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <Card className={`rounded-2xl ${gradientPanel}`}>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Filter Mentorships</h3>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex items-center gap-2">
                  <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search mentorships..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-white/70 dark:bg-slate-700/70 backdrop-blur border-slate-200/60 dark:border-slate-600/60 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Badge variant="secondary" className="text-xs">
                  {filteredEnrollments.length} mentorship{filteredEnrollments.length !== 1 ? 's' : ''} found
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className={`${subtleCard} border-red-200 dark:border-red-800 rounded-2xl`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-600 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}


        {/* Mentorships Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enrollment) => {
            const statusBadge = getStatusBadge(enrollment);
            // Handle different data structures
            const mentorshipData = enrollment.mentorship || enrollment;
            const mentorshipName = mentorshipData?.name || mentorshipData?.mentorshipName || 'Mentorship Session';
            const mentorshipSpecialization = mentorshipData?.specialization || 'General Mentoring';
            const mentorshipPrice = mentorshipData?.price || enrollment.amount || 0;
            const mentorshipRating = mentorshipData?.rating || 0;
            const profileId = mentorshipData?.profileId || enrollment.mentorId || enrollment.profileId;
            
            return (
              <Card
                key={enrollment.id}
                className={`group overflow-hidden cursor-pointer relative rounded-2xl ${subtleCard} shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-teal-50/70 via-transparent to-amber-50/60 dark:from-teal-500/10 dark:to-indigo-500/10" />
                
                <CardHeader className="relative pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-white/40 shadow-sm">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileId}`} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-indigo-500 text-white">
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {mentorshipName}
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
                          {mentorshipSpecialization}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={statusBadge.className}>
                      {statusBadge.label === 'Completed' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {statusBadge.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="relative space-y-4">
                  {/* Schedule Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Scheduled Time
                      </span>
                    </div>
                    <div className="ml-6">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {formatDateTime(enrollment.time)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {enrollment.time ? new Date(enrollment.time) >= new Date() ? 'Upcoming session' : 'Session completed' : 'Time not set'}
                      </div>
                    </div>
                  </div>

                  {/* Price Info */}
                  {mentorshipPrice > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          ${mentorshipPrice}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">paid</span>
                      </div>
                      
                      {mentorshipRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-current" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {mentorshipRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enrollment Details */}
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Enrollment ID: #{enrollment.id}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Enrolled: {enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{mentorshipData?.enrolledProfileIds?.length || 0} enrolled</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>Active</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {enrollment.time && new Date(enrollment.time) >= new Date() ? (
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-xs">
                          <Video className="h-3 w-3 mr-1" />
                          Join Session
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Give Feedback
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredEnrollments.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No mentorships found' : 'No enrolled mentorships yet'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Start your learning journey by enrolling in mentorship programs.'
              }
            </p>
            {(!searchQuery && statusFilter === 'all') && (
              <Button 
                onClick={() => router.push('/mentorship')}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm rounded-xl"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Explore Mentorships
              </Button>
            )}
          </div>
        )}

        {/* Summary Statistics */}
        {enrollments.length > 0 && (
          <Card className={`rounded-2xl ${gradientPanel}`}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {enrollments.length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Enrollments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {enrollments.filter(e => e.time && new Date(e.time) >= new Date()).length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Upcoming Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {enrollments.filter(e => e.time && new Date(e.time) < new Date()).length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Completed Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    ${enrollments.reduce((sum, e) => {
                      const price = e.mentorship?.price || e.amount || 0;
                      return sum + price;
                    }, 0)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Investment</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
