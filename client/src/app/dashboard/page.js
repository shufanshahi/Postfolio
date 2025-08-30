'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  User, Users, FileText, Rss, LogOut, Bell, Search, Video, Briefcase,
  TrendingUp, Calendar, MessageSquare, Settings, ChevronRight, Plus,
  Activity, Target, Award, Clock, BarChart3, Loader2
  } from 'lucide-react'; 
  import { LaptopMinimal } from 'lucide-react';
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
  Separator
} from '@/components/ui/separator';
import {
  Input
} from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Badge
} from '@/components/ui/badge';
import {
  Progress
} from '@/components/ui/progress';
import {
  Alert, AlertDescription
} from '@/components/ui/alert';
import Navbar from '@/components/Navbar';

// Design tokens (fallback if Tailwind classes adjusted later)
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
// Softer, tinted cards matching new palette (reduces stark white feel)
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

export default function FunctionalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    recentActivity: [],
    notifications: 0
  });

  // Fetch user profile and dashboard data
  useEffect(() => {
    async function initializeDashboard() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch user profile
        const profileRes = await apiFetch('/api/profile/me');
        if (!profileRes.ok) {
          throw new Error('Failed to fetch profile');
        }
        const profile = await profileRes.json();
        setUserData(profile);

        // Fetch dashboard statistics
        const statsRes = await apiFetch('/api/dashboard/stats');
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setDashboardData(prev => ({ ...prev, stats: stats.data || [] }));
        }

        // Fetch recent activity
        const activityRes = await apiFetch('/api/dashboard/activity');
        if (activityRes.ok) {
          const activity = await activityRes.json();
          setDashboardData(prev => ({ ...prev, recentActivity: activity.data || [] }));
        }

        // Fetch notifications count
        const notificationRes = await apiFetch('/api/notifications/count');
        if (notificationRes.ok) {
          const notifications = await notificationRes.json();
          setDashboardData(prev => ({ ...prev, notifications: notifications.count || 0 }));
        }

      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
        console.error('Dashboard initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initializeDashboard();
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  const handleNavigation = (path) => {
    router.push(path);
  };

  const handleQuickAction = async (actionType) => {
    switch (actionType) {
      case 'post':
        router.push('/post');
        break;
      case 'cv':
        router.push('/mycv');
        break;
      case 'interview':
        router.push('/myprep');
        break;
      case 'mcq':
        router.push('/myprep');
        break;
      default:
        console.log('Unknown action:', actionType);
    }
  };

  // Default stats if API doesn't return data
  const defaultStats = [
    { label: 'Profile Views', value: '0', change: '0%', icon: <Activity className="h-4 w-4" />, trend: 'up' },
    { label: 'Connections', value: '0', change: '0%', icon: <Users className="h-4 w-4" />, trend: 'up' },
    { label: 'Applications', value: '0', change: '0%', icon: <Target className="h-4 w-4" />, trend: 'up' },
    { label: 'Skill Score', value: '0%', change: '0%', icon: <Award className="h-4 w-4" />, trend: 'up' }
  ];

  const quickActions = [
    {
      label: 'Post Update',
      icon: <Rss className="h-4 w-4" />,
      color: 'bg-sky-300 hover:bg-sky-400 text-sky-900',
      action: () => handleQuickAction('post')
    },
    {
      label: 'Update CV',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-emerald-300 hover:bg-emerald-400 text-emerald-900',
      action: () => handleQuickAction('cv')
    },
    {
      label: 'Mock Interview',
      icon: <Video className="h-4 w-4" />,
      color: 'bg-purple-300 hover:bg-purple-400 text-purple-900',
      action: () => handleQuickAction('interview')
    },
    {
      label: 'Take MCQ',
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'bg-amber-300 hover:bg-amber-400 text-amber-900',
      action: () => handleQuickAction('mcq')
    },
    {
      label: 'News System',
      icon: <Settings className="h-4 w-4" />,
      color: 'bg-red-300 hover:bg-red-400 text-red-900',
      action: () => handleNavigation('/news-system')
    }
  ];

  const getMainCards = () => {
    const cards = [
      {
        title: 'My CV',
        description: 'Complete your professional profile',
        icon: <FileText className="h-6 w-6" />,
        color: 'from-sky-200 to-sky-300',
        iconBg: 'from-sky-300 to-sky-400',
        progress: userData?.profileCompletion || 0,
        action: 'Update Now',
        onClick: () => handleNavigation('/mycv')
      },
      {
        title: 'Connections',
        description: 'Expand your professional network',
        icon: <Users className="h-6 w-6" />,
        color: 'from-sky-300 to-sky-400',
        iconBg: 'from-sky-300 to-sky-400',
        count: userData?.connectionCount || '0',
        action: 'Find People',
        onClick: () => handleNavigation('/connections')
      },
      {
        title: 'My Feed',
        description: 'Latest posts and industry updates',
        icon: <Rss className="h-6 w-6" />,
        color: 'from-sky-300 to-sky-400',
        iconBg: 'from-sky-300 to-sky-400',
        count: userData?.unreadPosts ? `${userData.unreadPosts} new` : '0 new',
        action: 'View Feed',
        onClick: () => handleNavigation('/myfeed')
      },
      {
        title: 'PREP MCQ',
        description: 'Practice and improve your skills',
        icon: <Target className="h-6 w-6" />,
        color: 'from-sky-300 to-sky-400',
        iconBg: 'from-sky-300 to-sky-400',
        progress: userData?.skillScore || 0,
        action: 'Start Quiz',
        onClick: () => handleNavigation('/myprep')
      }
    ];

    if (userData?.role === 'Employer') {
      cards.push({
        title: 'Job Postings',
        description: 'Manage your job listings',
        icon: <Briefcase className="h-6 w-6" />,
        color: 'from-sky-300 to-sky-400',
        iconBg: 'from-sky-300 to-sky-400',
        count: `${userData?.activeJobs || 0} active`,
        action: 'Manage Jobs',
        onClick: () => handleNavigation('/job-postings')
      });
    } else if (userData?.role === 'User') {
      cards.push({
        title: 'Find Jobs',
        description: 'Explore new opportunities',
        icon: <Briefcase className="h-6 w-6" />,
        color: 'from-sky-300 to-sky-400',
        iconBg: 'from-sky-300 to-sky-400',
        count: `${userData?.matchingJobs || 0} matches`,
        action: 'Browse Jobs',
        onClick: () => handleNavigation('/find-jobs')
      });
      cards.push({
        title: 'My Interviews',
        description: 'Track your interview schedule',
        icon: <Video className="h-6 w-6" />,
        color: 'from-sky-300 to-sky-400',
        iconBg: 'from-sky-300 to-sky-400',
        count: `${userData?.upcomingInterviews || 0} upcoming`,
        action: 'View Schedule',
        onClick: () => handleNavigation('/my-interviews')
      });
      // Add Mock Interview card for User
        cards.push({
          title: 'Mock Interview',
          description: 'Practice real interview scenarios',
          icon: <LaptopMinimal className="h-6 w-6" />, // AI/robot-like icon
          color: 'from-sky-300 to-sky-400',
          iconBg: 'from-sky-300 to-sky-400',
          action: 'Start Mock Interview',
          onClick: () => handleNavigation('/mockInterview')
        });
    }

    return cards;
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
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Preparing your personalized workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[conic-gradient(at_10%_30%,theme(colors.teal.50),theme(colors.indigo.50),theme(colors.white))] dark:bg-[linear-gradient(145deg,oklch(0.22_0.025_250),oklch(0.18_0.02_250))]">
        <Alert className="max-w-md ${subtleCard}">
          <AlertDescription className="text-sm">
            {error}. Please refresh or contact support if this continues.
          </AlertDescription>
        </Alert>
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
      <div className="max-w-7xl mx-auto py-10 px-6 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
              Welcome back, {userData?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              Personalized snapshot for your career growth
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm text-slate-700 text-sm">
              Refresh
            </Button>
            <Button className="rounded-full bg-teal-600 hover:bg-teal-700 shadow-sm text-sm">
              New Action
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(dashboardData.stats.length > 0 ? dashboardData.stats : defaultStats).map((stat, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow duration-200 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-stone-100 rounded-lg">
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                      <p className="text-sm text-slate-600">{stat.label}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trend === 'up' ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                  }`}>
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main Feature Cards */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium tracking-wide text-slate-700 dark:text-slate-200 uppercase">Core Panels</h2>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-teal-600 dark:hover:text-teal-400" onClick={() => handleNavigation('/settings')}>
                <Plus className="h-4 w-4 mr-2" /> Customize
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
              {getMainCards().map((card, i) => (
                <Card
                  key={i}
                  className={`group overflow-hidden cursor-pointer relative rounded-2xl ${subtleCard} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}
                  onClick={card.onClick}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-teal-50/70 via-transparent to-amber-50/60 dark:from-teal-500/10 dark:to-indigo-500/10" />
                  <CardContent className="relative p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${card.iconBg} text-white shadow-sm ring-1 ring-white/40`}>{card.icon}</div>
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">{card.title}</h3>
                          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed max-w-[16ch]">{card.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                    </div>

                    {card.progress !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400">
                          <span>Completion</span>
                          <span className="text-slate-700 dark:text-slate-200">{card.progress}%</span>
                        </div>
                        <Progress value={card.progress} className="h-1.5 overflow-hidden rounded-full" />
                      </div>
                    )}

                    {card.count && (
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="font-medium bg-slate-100/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 ring-1 ring-inset ring-white/40">
                          {card.count}
                        </Badge>
                      </div>
                    )}

                    <Button className="w-full mt-2 h-9 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 text-[13px] tracking-wide shadow-sm">
                      {card.action}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className={`rounded-2xl ${subtleCard} shadow-sm`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-base font-semibold">
                  <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-start gap-3 group">
                        <div className={`mt-1.5 h-2 w-2 rounded-full ring-2 ring-white/60 shadow ${activity.type === 'view' ? 'bg-teal-500' : activity.type === 'connection' ? 'bg-emerald-500' : activity.type === 'interview' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 leading-snug">{activity.action}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent activity</p>
                )}
              </CardContent>
            </Card>

            <Card className={`rounded-2xl relative overflow-hidden ${gradientPanel}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,theme(colors.teal.200)/40,transparent_60%)] dark:bg-[radial-gradient(circle_at_20%_20%,oklch(0.3_0.05_210)/40,transparent_60%)]" />
              <CardHeader className="relative">
                <CardTitle className="text-slate-800 dark:text-slate-100 text-base font-semibold">This Week</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-xs">Engagement summary snapshot</CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="grid grid-cols-2 gap-4 text-[13px]">
                  <div className="space-y-1">
                    <p className="text-slate-500 dark:text-slate-400">Profile views</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">+{userData?.weeklyViews || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 dark:text-slate-400">New connections</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">+{userData?.weeklyConnections || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 dark:text-slate-400">Messages sent</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{userData?.weeklyMessages || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 dark:text-slate-400">Interviews</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{userData?.weeklyInterviews || 0}</p>
                  </div>
                </div>
                <Separator className="bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-slate-700/60" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium tracking-wide uppercase text-slate-600 dark:text-slate-400">Total engagement</span>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 rounded-full px-3 py-1 h-6 text-[12px] font-medium">
                    <TrendingUp className="h-3 w-3 mr-1" /> +{userData?.engagementGrowth || 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}