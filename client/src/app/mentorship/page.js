'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  Users, Plus, Calendar, DollarSign, Star, Clock, MapPin, 
  ChevronDown, X, Search, Filter, Loader2, User, Award,
  BookOpen, Globe, Heart, MessageCircle, TrendingUp
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
  Label
} from '@/components/ui/label';
import {
  Textarea
} from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Alert, AlertDescription
} from '@/components/ui/alert';
import Navbar from '@/components/Navbar';

// Design tokens matching dashboard theme
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

export default function MentorshipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [mentorships, setMentorships] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [selectedViewDate, setSelectedViewDate] = useState('');
  const [existingEnrollments, setExistingEnrollments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    specialization: '',
    price: '',
    availableTimes: [],
    repeatStatus: false
  });

  // Time slot selection state
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

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

        // Fetch user profile
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

        // Fetch mentorships
        await fetchMentorships();

      } catch (err) {
        setError(err.message || 'Failed to load mentorship data');
        console.error('Mentorship page initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [router]);

  const fetchMentorships = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/mentorships', {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMentorships(data);
      }
    } catch (err) {
      console.error('Failed to fetch mentorships:', err);
    }
  };

  const handleCreateMentorship = async () => {
    if (!createForm.name || !createForm.specialization || !createForm.price) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');

      const mentorshipData = {
        profileId: userProfile.id,
        name: createForm.name,
        specialization: createForm.specialization,
        price: parseFloat(createForm.price),
        availableTimes: timeSlots,
        repeatStatus: createForm.repeatStatus
      };

      const response = await fetch('http://localhost:8080/api/mentorships', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mentorshipData)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setCreateForm({
          name: '',
          specialization: '',
          price: '',
          availableTimes: [],
          repeatStatus: false
        });
        setTimeSlots([]);
        await fetchMentorships();
      } else {
        throw new Error('Failed to create mentorship');
      }
    } catch (err) {
      setError(err.message || 'Failed to create mentorship');
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetails = (mentorship) => {
    setSelectedMentorship(mentorship);
    setSelectedTimeSlot('');
    setSelectedViewDate('');
    setExistingEnrollments([]);
    setShowDetailsModal(true);
    // Fetch existing enrollments for this mentorship
    fetchMentorshipEnrollments(mentorship.id);
  };

  // Fetch existing enrollments for a mentorship
  const fetchMentorshipEnrollments = async (mentorshipId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/enrollments/mentorship/${mentorshipId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const enrollments = await response.json();
        setExistingEnrollments(enrollments);
      } else {
        console.error('Failed to fetch enrollments');
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    }
  };

  // Group time slots by date
  const groupTimeSlotsByDate = (timeSlots) => {
    if (!timeSlots || timeSlots.length === 0) return {};
    
    const grouped = {};
    timeSlots.forEach(slot => {
      const date = new Date(slot);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const dateLabel = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          label: dateLabel,
          slots: []
        };
      }
      grouped[dateKey].slots.push(slot);
    });
    
    // Sort slots within each date
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].slots.sort((a, b) => new Date(a) - new Date(b));
    });
    
    return grouped;
  };

  // Get available dates for the dropdown
  const getAvailableDates = (mentorship) => {
    if (!mentorship?.availableTimes) return [];
    const grouped = groupTimeSlotsByDate(mentorship.availableTimes);
    
    // If repeatStatus is true, we don't need to return specific dates as any date can have slots
    // This function is not used anymore when repeatStatus is true since we use date input
    return Object.keys(grouped).sort().map(dateKey => ({
      value: dateKey,
      label: grouped[dateKey].label
    }));
  };

  // Get time slots for selected date
  const getTimeSlotsForDate = (mentorship, selectedDate) => {
    if (!mentorship?.availableTimes || !selectedDate) return [];
    
    const grouped = groupTimeSlotsByDate(mentorship.availableTimes);
    let slotsForDate = grouped[selectedDate]?.slots || [];
    
    // If repeatStatus is true and no slots found for the selected date, generate repeated slots
    if (mentorship.repeatStatus && slotsForDate.length === 0) {
      slotsForDate = generateRepeatedSlotsForDate(mentorship, selectedDate);
    }
    
    return slotsForDate;
  };

  // Generate repeated time slots for a specific date based on the weekly pattern
  const generateRepeatedSlotsForDate = (mentorship, targetDate) => {
    if (!mentorship?.availableTimes || mentorship.availableTimes.length === 0) return [];
    
    const targetDateObj = new Date(targetDate);
    const targetDayOfWeek = targetDateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Find the latest available time slot to determine the reference week
    const latestSlot = mentorship.availableTimes.reduce((latest, current) => {
      const currentDate = new Date(current);
      const latestDate = new Date(latest);
      return currentDate > latestDate ? current : latest;
    });
    
    const latestSlotDate = new Date(latestSlot);
    
    // Find slots from the reference week that match the target day of week
    const matchingSlots = [];
    
    mentorship.availableTimes.forEach(originalSlot => {
      const originalDate = new Date(originalSlot);
      const originalDayOfWeek = originalDate.getDay();
      
      // If the day of week matches, create a new slot for the target date
      if (originalDayOfWeek === targetDayOfWeek) {
        // Get the time components from the original slot (in local time)
        const hours = originalDate.getHours();
        const minutes = originalDate.getMinutes();
        const seconds = originalDate.getSeconds();
        
        // Create new date with target date but original time
        const newSlot = new Date(targetDateObj);
        newSlot.setHours(hours, minutes, seconds, 0);
        
        // Format as local datetime string (not UTC) to avoid timezone issues
        const year = newSlot.getFullYear();
        const month = String(newSlot.getMonth() + 1).padStart(2, '0');
        const day = String(newSlot.getDate()).padStart(2, '0');
        const hour = String(newSlot.getHours()).padStart(2, '0');
        const minute = String(newSlot.getMinutes()).padStart(2, '0');
        const second = String(newSlot.getSeconds()).padStart(2, '0');
        
        const formattedSlot = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        matchingSlots.push(formattedSlot);
      }
    });
    
    return matchingSlots;
  };

  // Check if a time slot is already booked
  const isTimeSlotBooked = (timeSlot) => {
    return existingEnrollments.some(enrollment => {
      const enrollmentTime = enrollment.time;
      // Compare the exact time slots
      return enrollmentTime === timeSlot;
    });
  };

  // Get available (non-booked) time slots for a date
  const getAvailableTimeSlotsForDate = (mentorship, selectedDate) => {
    const allSlots = getTimeSlotsForDate(mentorship, selectedDate);
    return allSlots.filter(slot => !isTimeSlotBooked(slot));
  };

  // Get booked time slots for a date
  const getBookedTimeSlotsForDate = (mentorship, selectedDate) => {
    const allSlots = getTimeSlotsForDate(mentorship, selectedDate);
    return allSlots.filter(slot => isTimeSlotBooked(slot));
  };

  const handlePurchaseAndEnroll = async () => {
    if (!selectedTimeSlot || !selectedMentorship) {
      setError('Please select a specific time slot');
      return;
    }

    try {
      setPurchasing(true);
      setError('');
      const token = localStorage.getItem('token');

      // Step 1: Transfer credits from user to mentor
      const transferData = {
        fromProfileId: userProfile.id,
        toProfileId: selectedMentorship.profileId,
        amount: selectedMentorship.price,
        description: `Payment for mentorship: ${selectedMentorship.name}`
      };

      const transferResponse = await fetch('http://localhost:8080/api/credits/transfer', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transferData)
      });

      if (!transferResponse.ok) {
        const errorData = await transferResponse.json();
        throw new Error(errorData.message || 'Transfer failed. Please check your balance.');
      }

      // Step 2: Enroll in mentorship
      const enrollMentorshipData = {
        profileId: userProfile.id
      };

      const enrollResponse = await fetch(`http://localhost:8080/api/mentorships/${selectedMentorship.id}/enroll/${userProfile.id}`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(enrollMentorshipData)
      });

      if (!enrollResponse.ok) {
        throw new Error('Failed to enroll in mentorship');
      }

      // Step 3: Create enrollment record
      const enrollmentData = {
        profileId: userProfile.id,
        mentorshipId: selectedMentorship.id,
        status: "APPROVED",
        time: selectedTimeSlot
      };

      const enrollmentResponse = await fetch('http://localhost:8080/api/enrollments', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(enrollmentData)
      });

      if (!enrollmentResponse.ok) {
        throw new Error('Failed to create enrollment record');
      }

      // Success! Close modal and refresh data
      setShowDetailsModal(false);
      setSelectedMentorship(null);
      setSelectedTimeSlot('');
      setSelectedViewDate('');
      await fetchMentorships();
      
      // Show success message
      setError(''); // Clear any previous errors
      alert('Successfully transferred payment and enrolled in mentorship!');

    } catch (err) {
      setError(err.message || 'Failed to complete transfer and enrollment');
    } finally {
      setPurchasing(false);
    }
  };

  const addTimeSlot = () => {
    if (selectedDate && selectedTime) {
      const dateTime = `${selectedDate} ${selectedTime}:00`;
      if (!timeSlots.includes(dateTime)) {
        setTimeSlots([...timeSlots, dateTime]);
        setSelectedDate('');
        setSelectedTime('');
      }
    }
  };

  const removeTimeSlot = (indexToRemove) => {
    setTimeSlots(timeSlots.filter((_, index) => index !== indexToRemove));
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMentorships = mentorships.filter(mentorship => {
    const matchesSearch = mentorship.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentorship.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization = specializationFilter === '' || specializationFilter === 'all' ||
    mentorship.specialization?.toLowerCase().includes(specializationFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mentorship.status === statusFilter;
    return matchesSearch && matchesSpecialization && matchesStatus;
  });

  // Get unique specializations for filter
  const specializations = [...new Set(mentorships.map(m => m.specialization).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,theme(colors.teal.100)_0%,theme(colors.teal.50)_35%,theme(colors.white)_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,oklch(0.3_0.05_210)_0%,oklch(0.22_0.025_250)_60%)]">
        <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(circle_at_center,white,transparent)]">
          <div className="absolute top-10 left-1/4 h-64 w-64 bg-teal-300/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 h-72 w-72 bg-indigo-300/30 rounded-full blur-3xl animate-pulse [animation-delay:200ms]" />
        </div>
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <Loader2 className="h-9 w-9 animate-spin text-teal-600 dark:text-teal-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading mentorship opportunities...</p>
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
              Mentorship Program
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              Connect with industry experts and grow your skills
            </p>
          </div>
          
          {/* Create Mentorship Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center gap-2">
              <Input
                placeholder="Search mentorships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-full border-slate-300/60 bg-white/60 backdrop-blur"
              />
              <Search className="absolute right-3 h-4 w-4 text-slate-400" />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-full bg-teal-600 hover:bg-teal-700 shadow-sm text-sm flex items-center gap-2">
                  <div className="flex flex-col space-y-1">
                    <div className="h-0.5 w-4 bg-white rounded-full"></div>
                    <div className="h-0.5 w-4 bg-white rounded-full"></div>
                    <div className="h-0.5 w-4 bg-white rounded-full"></div>
                  </div>
                  Menu
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Mentorship
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push(`/my-purchase/${userProfile?.id}`)} 
                  className="flex items-center gap-2"
                  disabled={!userProfile?.id}
                >
                  <DollarSign className="h-4 w-4" />
                  My Purchase
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push(`/my-mentorship/${userProfile?.id}`)} 
                  className="flex items-center gap-2"
                  disabled={!userProfile?.id}
                >
                  <BookOpen className="h-4 w-4" />
                  My Mentorship
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Modern Status Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Label htmlFor="statusFilter" className="text-sm font-medium text-slate-700 dark:text-slate-200">Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 rounded-full border-slate-300/60 bg-white/60 dark:bg-slate-800/80 backdrop-blur shadow-sm text-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Active
                  </span>
                </SelectItem>
                <SelectItem value="INACTIVE">
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-slate-400 inline-block" /> Inactive
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
            <SelectTrigger className="w-48 rounded-full border-slate-300/60 bg-white/60 backdrop-blur">
              <SelectValue placeholder="Filter by specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specializations</SelectItem>
              {specializations.map((spec) => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge variant="secondary" className="text-xs">
            {filteredMentorships.length} mentorship{filteredMentorships.length !== 1 ? 's' : ''} available
          </Badge> */}
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
              className={`group overflow-hidden cursor-pointer relative rounded-2xl ${subtleCard} shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-teal-50/70 via-transparent to-amber-50/60 dark:from-teal-500/10 dark:to-indigo-500/10" />
              
              <CardHeader className="relative pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white/40 shadow-sm">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mentorship.profileId}`} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-indigo-500 text-white">
                        <User className="h-6 w-6" />
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
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant={mentorship.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={`${mentorship.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} text-xs`}
                    >
                      {mentorship.status}
                    </Badge>
                    {mentorship.repeatStatus && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        Recurring
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      ${mentorship.price}
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
                      {mentorship.availableTimes.slice(0, 3).map((time, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                          {formatDateTime(time)}
                        </Badge>
                      ))}
                      {mentorship.availableTimes.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          +{mentorship.availableTimes.length - 3} more
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
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {mentorship.rating > 0 ? mentorship.rating.toFixed(1) : 'No ratings'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-xs" onClick={() => handleViewDetails(mentorship)}>
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:hover:bg-indigo-900/20" onClick={() => window.location.href = `http://localhost:3000/user/${mentorship.profileId}` }>
                      Mentor
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
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              No mentorships found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Try adjusting your search or filters, or create a new mentorship.
            </p>
          </div>
        )}
      </div>

      {/* Create Mentorship Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Create New Mentorship</DialogTitle>
            <DialogDescription>
              Share your expertise and help others grow in their careers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Mentorship Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Advanced React Development"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  placeholder="e.g., Frontend Development"
                  value={createForm.specialization}
                  onChange={(e) => setCreateForm({...createForm, specialization: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Session (USD) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="50.00"
                value={createForm.price}
                onChange={(e) => setCreateForm({...createForm, price: e.target.value})}
              />
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-4">
              <Label>Available Time Slots</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    type="button" 
                    onClick={addTimeSlot}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full"
                  >
                    Add Slot
                  </Button>
                </div>
              </div>

              {/* Display added time slots */}
              {timeSlots.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Time Slots ({timeSlots.length})</Label>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded border">
                        <span className="text-sm">{formatDateTime(slot)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeSlot(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="repeatStatus"
                checked={createForm.repeatStatus}
                onChange={(e) => setCreateForm({...createForm, repeatStatus: e.target.checked})}
                className="rounded border-slate-300"
              />
              <Label htmlFor="repeatStatus" className="text-sm">
                This is a recurring mentorship program
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateForm(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMentorship}
              disabled={creating || !createForm.name || !createForm.specialization || !createForm.price}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Mentorship'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mentorship Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedMentorship && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-white/40 shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMentorship.profileId}`} />
                    <AvatarFallback className="bg-gradient-to-br from-teal-500 to-indigo-500 text-white">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{selectedMentorship.name}</div>
                    <div className="text-sm font-normal text-slate-600 dark:text-slate-400">
                      {selectedMentorship.specialization}
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Select your preferred time slot and complete the enrollment.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Mentorship Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className={`${subtleCard} p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-teal-600" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Price</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      ${selectedMentorship.price}
                    </div>
                    <div className="text-sm text-slate-500">per session</div>
                  </Card>

                  <Card className={`${subtleCard} p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-amber-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Rating</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {selectedMentorship.rating > 0 ? selectedMentorship.rating.toFixed(1) : 'New'}
                    </div>
                    <div className="text-sm text-slate-500">
                      {selectedMentorship.rating > 0 ? 'out of 5' : 'mentorship'}
                    </div>
                  </Card>

                  <Card className={`${subtleCard} p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-indigo-600" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Enrolled</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {selectedMentorship.enrolledProfileIds?.length || 0}
                    </div>
                    <div className="text-sm text-slate-500">students</div>
                  </Card>
                </div>

                {/* Available Time Slots */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-teal-600" />
                    <Label className="text-lg font-medium">Select Your Preferred Date & Time</Label>
                    {selectedMentorship.repeatStatus && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        Recurring Program
                      </Badge>
                    )}
                  </div>
                  
                  {selectedMentorship.repeatStatus && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                      <p className="text-sm text-emerald-700 dark:text-emerald-400">
                        <strong>Recurring Mentorship:</strong> This program repeats weekly based on the schedule from the latest available time slots. Select any date to see available time slots that match the weekly schedule.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {/* Date Selection - Any Date */}
                    <div className="space-y-2">
                      <Label>Choose Your Preferred Date</Label>
                      <Input
                        type="date"
                        value={selectedViewDate}
                        onChange={(e) => setSelectedViewDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full"
                      />
                    </div>

                    {/* Time Slots for Selected Date */}
                    {selectedViewDate && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Available time slots for {new Date(selectedViewDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                          {selectedMentorship.repeatStatus && (
                            <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                              (Weekly recurring)
                            </span>
                          )}
                        </Label>
                        
                        {getTimeSlotsForDate(selectedMentorship, selectedViewDate).length > 0 ? (
                          <div className="space-y-4">
                            {/* Available Slots */}
                            {getAvailableTimeSlotsForDate(selectedMentorship, selectedViewDate).length > 0 && (
                              <div>
                                <Label className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 block">
                                  Available Slots
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                                  {getAvailableTimeSlotsForDate(selectedMentorship, selectedViewDate).map((time, index) => (
                                    <Card
                                      key={`available-${index}`}
                                      className={`cursor-pointer transition-all duration-200 ${
                                        selectedTimeSlot === time
                                          ? 'ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                          : 'hover:shadow-md bg-white dark:bg-slate-800'
                                      } border rounded-lg p-3`}
                                      onClick={() => setSelectedTimeSlot(time)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                          selectedTimeSlot === time
                                            ? 'border-teal-500 bg-teal-500'
                                            : 'border-slate-300'
                                        }`}>
                                          {selectedTimeSlot === time && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                          )}
                                        </div>
                                        <div>
                                          <div className="font-medium text-slate-800 dark:text-slate-100">
                                            {new Date(time).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </div>
                                          <div className="text-sm text-emerald-600 dark:text-emerald-400">
                                            Available
                                          </div>
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Booked Slots */}
                            {getBookedTimeSlotsForDate(selectedMentorship, selectedViewDate).length > 0 && (
                              <div>
                                <Label className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 block">
                                  Already Booked
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                                  {getBookedTimeSlotsForDate(selectedMentorship, selectedViewDate).map((time, index) => (
                                    <Card
                                      key={`booked-${index}`}
                                      className="cursor-not-allowed opacity-60 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 rounded-lg p-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full border-2 border-red-300 bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                          <X className="w-2 h-2 text-red-500" />
                                        </div>
                                        <div>
                                          <div className="font-medium text-slate-700 dark:text-slate-300">
                                            {new Date(time).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </div>
                                          <div className="text-sm text-red-600 dark:text-red-400">
                                            Booked
                                          </div>
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* No Available Slots */}
                            {getAvailableTimeSlotsForDate(selectedMentorship, selectedViewDate).length === 0 && (
                              <div className="text-center py-4 border-2 border-dashed border-amber-200 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                                <Clock className="h-6 w-6 mx-auto text-amber-500 mb-2" />
                                <p className="text-amber-700 dark:text-amber-400 font-medium text-sm mb-1">
                                  All slots are booked for this date
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-500">
                                  Please try selecting a different date
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                            <Clock className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">
                              {selectedMentorship.repeatStatus 
                                ? `No recurring slots available for ${new Date(selectedViewDate).toLocaleDateString('en-US', { weekday: 'long' })}s`
                                : "No time slots available for this date"
                              }
                            </p>
                            <p className="text-sm text-slate-400 dark:text-slate-500">
                              {selectedMentorship.repeatStatus 
                                ? "This mentorship doesn't have sessions on this day of the week"
                                : "Please try selecting a different date"
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!selectedViewDate && (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        <Calendar className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                        <p className="text-slate-500">Select a date above to view available time slots</p>
                        <p className="text-sm text-slate-400 mt-2">You can choose any date from today onwards</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Slot Summary */}
                {selectedTimeSlot && (
                  <Card className={`${gradientPanel} p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                          Selected Time Slot
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDateTime(selectedTimeSlot)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                          ${selectedMentorship.price}
                        </div>
                        <div className="text-sm text-slate-500">
                          Total Amount
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Error Display */}
                {error && (
                  <Alert className={`${subtleCard} border-red-200 dark:border-red-800`}>
                    <AlertDescription className="text-red-600 dark:text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailsModal(false)}
                  disabled={purchasing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePurchaseAndEnroll}
                  disabled={purchasing || 
                           !selectedTimeSlot || 
                           isTimeSlotBooked(selectedMentorship, selectedTimeSlot)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isTimeSlotBooked(selectedMentorship, selectedTimeSlot) ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Slot Already Booked
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Buy & Enroll (${selectedMentorship.price})
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
