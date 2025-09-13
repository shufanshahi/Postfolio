'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { 
  Loader2, 
  Search, 
  Clock, 
  User, 
  Calendar, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Book,
  Star,
  Users,
  Video
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Design tokens matching dashboard theme
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

export default function MyMentorshipPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('all');
  const [averageRatings, setAverageRatings] = useState({});
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [profilePictures, setProfilePictures] = useState({});

  // Fetch enrollment data and mentorship details
  useEffect(() => {
    async function fetchEnrollmentData() {
      if (!id) return;
      
      try {
        setLoading(true);
        setError('');

        // Fetch enrollments for the profile
        const enrollmentResponse = await fetch(`http://localhost:8080/api/enrollments/profile/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!enrollmentResponse.ok) {
          throw new Error('Failed to fetch enrollment data');
        }

        const enrollmentData = await enrollmentResponse.json();
        
        // Fetch mentorship details for each enrollment
        const enrichedEnrollments = await Promise.all(
          enrollmentData.map(async (enrollment) => {
            try {
              const mentorshipResponse = await fetch(`http://localhost:8080/api/mentorships/${enrollment.mentorshipId}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });

              if (mentorshipResponse.ok) {
                const mentorshipData = await mentorshipResponse.json();
                return {
                  ...enrollment,
                  mentorship: mentorshipData
                };
              } else {
                return {
                  ...enrollment,
                  mentorship: null
                };
              }
            } catch (mentorshipError) {
              console.error('Error fetching mentorship:', mentorshipError);
              return {
                ...enrollment,
                mentorship: null
              };
            }
          })
        );

        setEnrollments(enrichedEnrollments);
        
        // Fetch average ratings for each mentorship
        await fetchAverageRatings(enrichedEnrollments);
        
        // Fetch profile pictures for each mentorship
        await fetchProfilePictures(enrichedEnrollments);
      } catch (err) {
        console.error('Error fetching enrollment data:', err);
        setError(err.message || 'Failed to load enrollment data');
      } finally {
        setLoading(false);
      }
    }

    fetchEnrollmentData();
  }, [id]);

  // Fetch average ratings for mentorships
  const fetchAverageRatings = async (enrollments) => {
    try {
      const ratingsMap = {};
      const mentorshipIds = [...new Set(enrollments.map(e => e.mentorshipId))];
      
      await Promise.all(
        mentorshipIds.map(async (mentorshipId) => {
          try {
            const response = await fetch(`http://localhost:8080/api/enrollments/mentorship/${mentorshipId}`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (response.ok) {
              const enrollmentData = await response.json();
              const ratings = enrollmentData
                .map(e => e.rating)
                .filter(rating => rating != null && rating > 0);
              
              if (ratings.length > 0) {
                const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
                ratingsMap[mentorshipId] = {
                  average: Math.round(avgRating * 10) / 10,
                  count: ratings.length
                };
              }
            }
          } catch (error) {
            console.error(`Error fetching ratings for mentorship ${mentorshipId}:`, error);
          }
        })
      );
      
      setAverageRatings(ratingsMap);
    } catch (error) {
      console.error('Error fetching average ratings:', error);
    }
  };

  // Fetch profile pictures for mentorships
  const fetchProfilePictures = async (enrollments) => {
    try {
      const picturesMap = {};
      const profileIds = [...new Set(enrollments
        .map(e => e.mentorship?.profileId)
        .filter(Boolean)
      )];
      
      await Promise.all(
        profileIds.map(async (profileId) => {
          try {
            const response = await fetch(`http://localhost:8080/api/profile/${profileId}`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (response.ok) {
              const profileData = await response.json();
              if (profileData.pictureBase64) {
                picturesMap[profileId] = profileData.pictureBase64;
              }
            }
          } catch (error) {
            console.error(`Error fetching profile picture for profileId ${profileId}:`, error);
          }
        })
      );
      
      setProfilePictures(picturesMap);
    } catch (error) {
      console.error('Error fetching profile pictures:', error);
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async () => {
    if (!selectedEnrollment || userRating === 0) return;
    
    try {
      setSubmittingRating(true);
      const response = await fetch(`http://localhost:8080/api/enrollments/${selectedEnrollment.id}/rating`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rating: userRating })
      });
      
      if (response.ok) {
        const updatedEnrollment = await response.json();
        
        // Update the enrollment in state
        setEnrollments(prev => 
          prev.map(e => e.id === updatedEnrollment.id ? { ...e, ...updatedEnrollment } : e)
        );
        
        // Refresh average ratings
        await fetchAverageRatings(enrollments);
        
        // Close modal
        setShowRatingModal(false);
        setSelectedEnrollment(null);
        setUserRating(0);
      } else {
        throw new Error('Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Open rating modal
  const openRatingModal = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setUserRating(enrollment.rating || 0);
    setShowRatingModal(true);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not specified';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'enrolled':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'enrolled':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'completed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'cancelled':
      case 'inactive':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Filter enrollments based on search query
  const filteredEnrollments = enrollments.filter(enrollment => {
    const mentorshipName = enrollment.mentorship?.name?.toLowerCase() || '';
    const specialization = enrollment.mentorship?.specialization?.toLowerCase() || '';
    const status = enrollment.status?.toUpperCase() || '';
    const query = searchQuery.toLowerCase();
    const statusMatch = enrollmentStatusFilter === 'all' || status === enrollmentStatusFilter;
    return (
      (mentorshipName.includes(query) || specialization.includes(query) || status.toLowerCase().includes(query))
      && statusMatch
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,theme(colors.teal.100)_0%,theme(colors.teal.50)_35%,theme(colors.white)_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,oklch(0.3_0.05_210)_0%,oklch(0.22_0.025_250)_60%)]">
        <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(circle_at_center,white,transparent)]">
          <div className="absolute top-10 left-1/4 h-64 w-64 bg-teal-300/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 h-72 w-72 bg-indigo-300/30 rounded-full blur-3xl animate-pulse [animation-delay:200ms]" />
        </div>
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <Loader2 className="h-9 w-9 animate-spin text-teal-600 dark:text-teal-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading your mentorships...</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
              My Mentorships
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              Track your mentorship enrollments and progress
            </p>
          </div>
          
          {/* Search */}
          <div className="relative flex items-center gap-2">
            <Input
              placeholder="Search by name, specialization, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 rounded-full border-slate-300/60 bg-white/60 backdrop-blur"
            />
            <Search className="absolute right-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={`${subtleCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                <Book className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Enrollments</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{enrollments.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className={`${subtleCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {enrollments.filter(e => e.status?.toLowerCase() === 'active' || e.status?.toLowerCase() === 'enrolled').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className={`${subtleCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {enrollments.filter(e => e.status?.toLowerCase() === 'completed').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className={`${subtleCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">MISSED</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {enrollments.filter(e => e.status?.toLowerCase() === 'missed').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter info */}
        <div className="flex items-center gap-4">
          {/* Modern Enrollment Status Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="enrollmentStatusFilter" className="text-sm font-medium text-slate-700 dark:text-slate-200">Status:</label>
            <Select value={enrollmentStatusFilter} onValueChange={setEnrollmentStatusFilter}>
              <SelectTrigger className="w-40 rounded-full border-slate-300/60 bg-white/60 dark:bg-slate-800/80 backdrop-blur shadow-sm text-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="APPROVED">
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="h-3 w-3" /> Approved
                  </span>
                </SelectItem>
                <SelectItem value="REFUNDED">
                  <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400">
                    <XCircle className="h-3 w-3" /> Refunded
                  </span>
                </SelectItem>
                <SelectItem value="ONGOING">
                  <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-400">
                    <Clock className="h-3 w-3" /> Ongoing
                  </span>
                </SelectItem>
                <SelectItem value="MISSED">
                  <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400">
                    <AlertCircle className="h-3 w-3" /> Missed
                  </span>
                </SelectItem>
                <SelectItem value="COMPLETED">
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <Star className="h-3 w-3" /> Completed
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="text-xs">
            {filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? 's' : ''} found
          </Badge>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className={`${subtleCard} border-red-200 dark:border-red-800`}>
            <AlertDescription className="text-red-600 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Enrollments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enrollment) => (
            <Card
              key={enrollment.id}
              className={`group overflow-hidden relative rounded-2xl ${subtleCard} shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-teal-50/70 via-transparent to-amber-50/60 dark:from-teal-500/10 dark:to-indigo-500/10" />
              
              <CardHeader className="relative pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white/40 shadow-sm">
                      <AvatarImage 
                        src={enrollment.mentorship?.profileId && profilePictures[enrollment.mentorship.profileId] 
                          ? `data:image/jpeg;base64,${profilePictures[enrollment.mentorship.profileId]}`
                          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${enrollment.mentorshipId}`
                        } 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-indigo-500 text-white">
                        <Book className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {enrollment.mentorship?.name || 'Mentorship Not Found'}
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
                        {enrollment.mentorship?.specialization || 'Unknown Specialization'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(enrollment.status)}`}>
                    {getStatusIcon(enrollment.status)}
                    {enrollment.status || 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-4">
                <div className="space-y-3">
                  {/* Enrollment Time */}
                  {enrollment.time && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Scheduled Time</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDateTime(enrollment.time)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mentorship Price */}
                  {enrollment.mentorship?.price && (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 text-amber-600 dark:text-amber-400 text-sm font-bold">$</div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Session Price</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ${enrollment.mentorship.price}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Enrollment Date */}
                  {enrollment.enrollmentDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Enrolled On</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDateTime(enrollment.enrollmentDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rating Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Rating</p>
                        <div className="flex items-center gap-2">
                          {/* User's Rating */}
                          {enrollment.rating ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-600 dark:text-slate-400">Your rating:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= enrollment.rating
                                        ? 'text-amber-400 fill-current'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-400">Not rated</span>
                          )}
                          
                          {/* Average Rating */}
                          {averageRatings[enrollment.mentorshipId] && (
                            <div className="flex items-center gap-1 ml-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">•</span>
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                Avg: {averageRatings[enrollment.mentorshipId].average}/5
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                ({averageRatings[enrollment.mentorshipId].count} review{averageRatings[enrollment.mentorshipId].count !== 1 ? 's' : ''})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Rate Button - Only show if enrollment can be rated */}
                    
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:hover:bg-amber-900/20"
                        onClick={() => openRatingModal(enrollment)}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        {enrollment.rating ? 'Update' : 'Rate'}
                      </Button>
                
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    {/* <div className="text-xs text-slate-500 dark:text-slate-400">
                      Enrollment ID: {enrollment.id}
                    </div> */}
                    
                    <div className="flex items-center gap-2">
                      {enrollment.status?.toLowerCase() === 'ongoing' && (
                        <Button 
                          size="sm" 
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                          onClick={() => {
                            const roomId = `${enrollment.id}`;
                            router.push(`/mentorvideocall/${roomId}?role=participant`);
                          }}
                        >
                          <Video className="h-3 w-3" />
                          Join
                        </Button>
                      )}
                      
                      {enrollment.mentorship && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:hover:bg-indigo-900/20"
                          onClick={() => router.push(`/user/${enrollment.mentorship.profileId}`)}
                        >
                          Mentor
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEnrollments.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Book className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              {searchQuery ? 'No matching enrollments found' : 'No mentorships enrolled yet'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms or clear the search to see all enrollments.'
                : 'Start your learning journey by enrolling in a mentorship program.'
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => router.push('/mentorship')}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Browse Mentorships
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in duration-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Rate Your Experience
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                How was your mentorship session with &ldquo;{selectedEnrollment.mentorship?.name}&rdquo;?
              </p>
              
              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className="transition-colors hover:scale-110 transform duration-200"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= userRating
                          ? 'text-amber-400 fill-current'
                          : 'text-slate-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              {userRating > 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  You selected {userRating} star{userRating !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRatingModal(false);
                  setSelectedEnrollment(null);
                  setUserRating(0);
                }}
                disabled={submittingRating}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                onClick={handleRatingSubmit}
                disabled={userRating === 0 || submittingRating}
              >
                {submittingRating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Rating'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
