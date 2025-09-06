'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { User, Users, Calendar, Clock, Loader2, ExternalLink, RefreshCw, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Navbar from '@/components/Navbar';

const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

export default function MenteesPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [mentorship, setMentorship] = useState(null);
  const [profileNames, setProfileNames] = useState({});
  const [refundingIds, setRefundingIds] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        // Fetch mentorship info
        const mentorshipRes = await fetch(`http://localhost:8080/api/mentorships/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!mentorshipRes.ok) throw new Error('Failed to fetch mentorship info');
        const mentorshipData = await mentorshipRes.json();
        setMentorship(mentorshipData);
        // Fetch enrollments for this mentorship
        const enrollmentsRes = await fetch(`http://localhost:8080/api/enrollments/mentorship/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!enrollmentsRes.ok) throw new Error('Failed to fetch enrollments');
        const enrollmentsData = await enrollmentsRes.json();
        setEnrollments(enrollmentsData);

        // Fetch profile names for each enrollment
        const namesMap = {};
        await Promise.all(enrollmentsData.map(async (enrollment) => {
          if (enrollment.profileId) {
            try {
              const profileRes = await fetch(`http://localhost:8080/api/profile/${enrollment.profileId}`, {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });
              if (profileRes.ok) {
                const profileData = await profileRes.json();
                namesMap[enrollment.profileId] = profileData.name || `Profile ${enrollment.profileId}`;
              } else {
                namesMap[enrollment.profileId] = `Profile ${enrollment.profileId}`;
              }
            } catch {
              namesMap[enrollment.profileId] = `Profile ${enrollment.profileId}`;
            }
          }
        }));
        setProfileNames(namesMap);
      } catch (err) {
        setError(err.message || 'Failed to load mentees data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusDropdown && !event.target.closest('.status-dropdown')) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusDropdown]);

  const handleRefund = async (enrollment) => {
    if (!confirm(`Are you sure you want to refund $${enrollment.price} to ${profileNames[enrollment.profileId]}?`)) {
      return;
    }

    setRefundingIds(prev => new Set([...prev, enrollment.id]));
    
    try {
      const token = localStorage.getItem('token');
      
      // First, transfer credits back to the mentee
      const transferRes = await fetch('http://localhost:8080/api/credits/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromProfileId: mentorship.profileId,
          toProfileId: enrollment.profileId,
          amount: enrollment.price,
          description: `Refund for ${mentorship.name}`
        }),
      });

      if (!transferRes.ok) {
        throw new Error('Failed to process refund transfer');
      }

      // Then update enrollment status to REFUNDED
      const statusRes = await fetch(`http://localhost:8080/api/enrollments/${enrollment.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'REFUNDED'
        }),
      });

      if (!statusRes.ok) {
        throw new Error('Failed to update enrollment status');
      }

      // Update local state
      setEnrollments(prev => 
        prev.map(e => 
          e.id === enrollment.id 
            ? { ...e, status: 'REFUNDED' }
            : e
        )
      );

      alert('Refund processed successfully!');
    } catch (err) {
      alert(`Failed to process refund: ${err.message}`);
    } finally {
      setRefundingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(enrollment.id);
        return newSet;
      });
    }
  };

  const handleViewProfile = (profileId) => {
    window.open(`http://localhost:3000/user/${profileId}`, '_blank');
  };

  // Filter and sort enrollments
  const filteredAndSortedEnrollments = enrollments
    .filter(enrollment => {
      if (statusFilter === 'all') return true;
      return enrollment.status?.toUpperCase() === statusFilter;
    })
    .sort((a, b) => {
      // Sort by time in descending order (newest first)
      const timeA = new Date(a.time || 0);
      const timeB = new Date(b.time || 0);
      return timeB - timeA;
    });

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
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'completed':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300';
      case 'ongoing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'missed':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
      case 'cancelled':
      case 'inactive':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      case 'refunded':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,theme(colors.teal.100)_0%,theme(colors.teal.50)_35%,theme(colors.white)_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,oklch(0.3_0.05_210)_0%,oklch(0.22_0.025_250)_60%)]">
        <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(circle_at_center,white,transparent)]">
          <div className="absolute top-10 left-1/4 h-64 w-64 bg-teal-300/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 h-72 w-72 bg-indigo-300/30 rounded-full blur-3xl animate-pulse [animation-delay:200ms]" />
        </div>
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <Loader2 className="h-9 w-9 animate-spin text-teal-600 dark:text-teal-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading mentees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none select-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
      </div>
      <Navbar />
      <div className="max-w-4xl mx-auto py-10 px-6 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
            Mentees for: {mentorship?.name || 'Mentorship'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            All enrollments for this mentorship
          </p>
        </div>
        {/* Error Alert */}
        {error && (
          <Alert className={`${subtleCard} border-red-200 dark:border-red-800`}>
            <AlertDescription className="text-red-600 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Filter Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Status:</span>
              <div className="relative status-dropdown">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm shadow-sm hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-colors min-w-[120px]"
                  onClick={() => setShowStatusDropdown(v => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={showStatusDropdown ? 'true' : 'false'}
                >
                  <Filter className="h-3 w-3 text-slate-400" />
                  {statusFilter === 'all' && 'All Statuses'}
                  {statusFilter === 'APPROVED' && 'Approved'}
                  {statusFilter === 'REFUNDED' && 'Refunded'}
                  {statusFilter === 'ONGOING' && 'Ongoing'}
                  {statusFilter === 'MISSED' && 'Missed'}
                  {statusFilter === 'COMPLETED' && 'Completed'}
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
                      className={`px-4 py-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded ${statusFilter === 'APPROVED' ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}
                      onClick={() => { setStatusFilter('APPROVED'); setShowStatusDropdown(false); }}
                      role="option"
                      aria-selected={statusFilter === 'APPROVED'}
                    >
                      Approved
                    </li>
                    <li
                      className={`px-4 py-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded ${statusFilter === 'REFUNDED' ? 'font-semibold text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-200'}`}
                      onClick={() => { setStatusFilter('REFUNDED'); setShowStatusDropdown(false); }}
                      role="option"
                      aria-selected={statusFilter === 'REFUNDED'}
                    >
                      Refunded
                    </li>
                    <li
                      className={`px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded ${statusFilter === 'ONGOING' ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}
                      onClick={() => { setStatusFilter('ONGOING'); setShowStatusDropdown(false); }}
                      role="option"
                      aria-selected={statusFilter === 'ONGOING'}
                    >
                      Ongoing
                    </li>
                    <li
                      className={`px-4 py-2 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded ${statusFilter === 'MISSED' ? 'font-semibold text-orange-700 dark:text-orange-300' : 'text-slate-700 dark:text-slate-200'}`}
                      onClick={() => { setStatusFilter('MISSED'); setShowStatusDropdown(false); }}
                      role="option"
                      aria-selected={statusFilter === 'MISSED'}
                    >
                      Missed
                    </li>
                    <li
                      className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded ${statusFilter === 'COMPLETED' ? 'font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}
                      onClick={() => { setStatusFilter('COMPLETED'); setShowStatusDropdown(false); }}
                      role="option"
                      aria-selected={statusFilter === 'COMPLETED'}
                    >
                      Completed
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {filteredAndSortedEnrollments.length} enrollment{filteredAndSortedEnrollments.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* List View of Enrollments */}
        <Card className={`${subtleCard} p-6`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Enrollment List</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">Status and scheduled time for each mentee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredAndSortedEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-500">
                  {statusFilter === 'all' 
                    ? 'No enrollments found for this mentorship.' 
                    : `No ${statusFilter.toLowerCase()} enrollments found.`
                  }
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredAndSortedEnrollments.map((enrollment) => (
                  <li key={enrollment.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 ring-2 ring-white/40 shadow-sm">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${enrollment.profileId}`} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-indigo-500 text-white">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                          {profileNames[enrollment.profileId] || `Profile ${enrollment.profileId}`}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Price Paid: {enrollment.price}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={`text-xs ${getStatusColor(enrollment.status)}`}>{enrollment.status}</Badge>
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                        <Clock className="h-4 w-4" />
                        {formatDateTime(enrollment.time)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Profile Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-900/20"
                          onClick={() => handleViewProfile(enrollment.profileId)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Profile
                        </Button>

                        {/* Refund Button - only show if not already refunded */}
                        {enrollment.status !== 'REFUNDED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-900/20"
                            onClick={() => handleRefund(enrollment)}
                            disabled={refundingIds.has(enrollment.id)}
                          >
                            {refundingIds.has(enrollment.id) ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Refunding...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Refund
                              </>
                            )}
                          </Button>
                        )}

                        {/* Join Button - only for ongoing sessions */}
                        {enrollment.status === 'ONGOING' && (
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => {
                              const roomId = `${enrollment.id}`;
                              router.push(`/mentorvideocall/${roomId}?role=host`);
                            }}
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
