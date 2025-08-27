'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { 
  User, Users, FileText, Rss, LogOut, Bell, Search, Video, Briefcase,
  TrendingUp, Calendar, MessageSquare, Settings, ChevronRight, Plus,
  Activity, Target, Award, Clock, BarChart3, Loader2
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
    }

    return cards;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            {error}. Please try refreshing the page or contact support if the problem persists.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100">
      {/* Top Navigation */}
      <Navbar/>
     
         

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">
              Welcome back, {userData?.name?.split(' ')[0] || 'there'}! 👋
            </h2>
            <p className="text-slate-600 mt-1">Here's what's happening with your career today.</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feature Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-800">Your Dashboard</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-stone-300 text-slate-600 hover:bg-stone-50"
                onClick={() => handleNavigation('/settings')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {getMainCards().map((card, i) => (
                <Card 
                  key={i} 
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md overflow-hidden cursor-pointer bg-white/80"
                  onClick={card.onClick}
                >
                  <div className={`h-2 bg-gradient-to-r ${card.color}`} />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${card.iconBg} text-white shadow-sm`}>
                        {card.icon}
                      </div>
                      <ChevronRight className="h-5 w-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg">{card.title}</h3>
                        <p className="text-slate-600 text-sm">{card.description}</p>
                      </div>
                      
                      {card.progress !== undefined && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Completion</span>
                            <span className="font-medium text-slate-800">{card.progress}%</span>
                          </div>
                          <Progress value={card.progress} className="h-2" />
                        </div>
                      )}
                      
                      {card.count && (
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="font-medium bg-stone-100 text-stone-700">
                            {card.count}
                          </Badge>
                        </div>
                      )}
                      
                      <Button className="w-full mt-4 bg-slate-700 hover:bg-slate-800 text-white transition-colors">
                        {card.action}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Recent Activity */}
            <Card className="border-0 shadow-md bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'view' ? 'bg-sky-400' :
                        activity.type === 'connection' ? 'bg-emerald-400' :
                        activity.type === 'interview' ? 'bg-purple-400' : 'bg-amber-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{activity.action}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-sky-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-slate-800">This Week</CardTitle>
                <CardDescription className="text-slate-600">Your activity summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Profile views</span>
                  <span className="font-semibold text-slate-800">+{userData?.weeklyViews || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">New connections</span>
                  <span className="font-semibold text-slate-800">+{userData?.weeklyConnections || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Messages sent</span>
                  <span className="font-semibold text-slate-800">{userData?.weeklyMessages || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-800">Total engagement</span>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{userData?.engagementGrowth || 0}%
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