'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Users, Calendar, DollarSign, Star, Clock, 
  Search, Loader2, User, BookOpen, Heart, Edit, Trash2
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from '@/components/ui/card';
import {
  Button
} from '@/components/ui/button';
import {
  Avatar, AvatarImage, AvatarFallback
} from '@/components/ui/avatar';
import {
  Badge
} from '@/components/ui/badge';
import {
  Input
} from '@/components/ui/input';
import {
  Alert, AlertDescription
} from '@/components/ui/alert';
import Navbar from '@/components/Navbar';

// Design tokens matching dashboard theme
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

export default function MyMentorshipPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  // Modern status dropdown state
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { id: profileId } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mentorships, setMentorships] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    async function initializePage() {
      if (!profileId) return;
      
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch user profile for authentication check
        const profileRes = await fetch('http://localhost:8080/api/profile/me', {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!profileRes.ok) {
          throw new Error('Failed to fetch profile');
        }
        const profile = await profileRes.json();
        setUserProfile(profile);

        // Fetch mentorships for the specific profile
        await fetchMyMentorships(profileId, token);

      } catch (err) {
        setError(err.message || 'Failed to load mentorship data');
        console.error('My mentorship page initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [profileId, router]);

  const fetchMyMentorships = async (profileId, token) => {
    try {
      const response = await fetch(`http://localhost:8080/api/mentorships/profile/${profileId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMentorships(data);
      } else {
        throw new Error('Failed to fetch your mentorships');
      }
    } catch (err) {
      console.error('Failed to fetch mentorships:', err);
      setError(err.message || 'Failed to fetch your mentorships');
    }
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'inactive':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Filter mentorships based on search query
  const filteredMentorships = mentorships.filter(mentorship => {
    const query = searchQuery.toLowerCase();
    const mentorshipName = mentorship.name?.toLowerCase() || '';
    const specialization = mentorship.specialization?.toLowerCase() || '';
    const status = mentorship.status?.toUpperCase() || '';
    const statusMatch = statusFilter === 'all' || status === statusFilter;
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
              Manage and track your mentorship programs
            </p>
          </div>
          
          {/* Search */}
          <div className="relative flex items-center gap-2">
            <Input
              placeholder="Search your mentorships..."
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
                <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Mentorships</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{mentorships.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className={`${subtleCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {mentorships.filter(m => m.status?.toLowerCase() === 'active').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className={`${subtleCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Star className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Enrolled</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {mentorships.reduce((total, m) => total + (m.enrolledProfileIds?.length || 0), 0)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className={`${subtleCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Inactive</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {mentorships.filter(m => m.status?.toUpperCase() === 'INACTIVE').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter info */}
        <div className="flex items-center gap-4">
          {/* Modern Status Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Status:</span>
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm shadow-sm hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-colors min-w-[120px]"
                onClick={() => setShowStatusDropdown(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={showStatusDropdown ? 'true' : 'false'}
              >
                {statusFilter === 'all' && 'All Statuses'}
                {statusFilter === 'ACTIVE' && 'Active'}
                {statusFilter === 'INACTIVE' && 'Inactive'}
                <svg className="ml-2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showStatusDropdown && (
                <ul
                  className="absolute z-10 mt-2 w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 text-sm"
                  role="listbox"
                >
                  <li
                    className={`px-4 py-2 cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded ${statusFilter === 'all' ? 'font-semibold text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200'}`}
                    onClick={() => { setStatusFilter('all'); setShowStatusDropdown(false); }}
                    role="option"
                    aria-selected={statusFilter === 'all'}
                  >
                    All Statuses
                  </li>
                  <li
                    className={`px-4 py-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded ${statusFilter === 'ACTIVE' ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}
                    onClick={() => { setStatusFilter('ACTIVE'); setShowStatusDropdown(false); }}
                    role="option"
                    aria-selected={statusFilter === 'ACTIVE'}
                  >
                    Active
                  </li>
                  <li
                    className={`px-4 py-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 rounded ${statusFilter === 'INACTIVE' ? 'font-semibold text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-200'}`}
                    onClick={() => { setStatusFilter('INACTIVE'); setShowStatusDropdown(false); }}
                    role="option"
                    aria-selected={statusFilter === 'INACTIVE'}
                  >
                    Inactive
                  </li>
                </ul>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {filteredMentorships.length} mentorship{filteredMentorships.length !== 1 ? 's' : ''} found
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

        {/* Mentorships Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentorships.map((mentorship) => (
            <Card
              key={mentorship.id}
              className={`group overflow-hidden relative rounded-2xl ${subtleCard} shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-teal-50/70 via-transparent to-amber-50/60 dark:from-teal-500/10 dark:to-indigo-500/10" />
              
              <CardHeader className="relative pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white/40 shadow-sm">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mentorship.id}`} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-indigo-500 text-white">
                        <BookOpen className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {mentorship.name}
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
                        {mentorship.specialization}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    className={`text-xs ${getStatusColor(mentorship.status)}`}
                  >
                    {mentorship.status || 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      ${mentorship.price || 0}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">per session</span>
                  </div>
                  
                  {mentorship.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500 fill-current" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {mentorship.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {mentorship.availableTimes && mentorship.availableTimes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Available Times
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {mentorship.availableTimes.slice(0, 2).map((time, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                          {formatDateTime(time)}
                        </Badge>
                      ))}
                      {mentorship.availableTimes.length > 2 && (
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          +{mentorship.availableTimes.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{mentorship.enrolledProfileIds?.length || 0} enrolled</span>
                    </div>
                    {mentorship.repeatStatus && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Recurring</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs ml-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:hover:bg-amber-900/20"
                      onClick={() => router.push(`/mentees/${mentorship.id}`)}
                    >
                      Enrolled
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMentorships.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              {searchQuery ? 'No matching mentorships found' : 'No mentorships created yet'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms or clear the search to see all mentorships.'
                : 'Start sharing your expertise by creating your first mentorship program.'
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => router.push('/mentorship')}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Create Your First Mentorship
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
