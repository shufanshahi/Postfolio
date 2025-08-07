'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    Users,
    FileText,
    Rss,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function Dashboard() {
    const router = useRouter();

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            router.push('/login');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

<<<<<<< HEAD
    const menuItems = [
        {
            title: "Profile",
            description: "Manage your personal information",
            icon: <User className="h-5 w-5 text-green-400" />,
            path: "/profile",
            color: "bg-green-500/10",
            iconColor: "text-green-400"
        },
        {
            title: "Connections",
            description: "View and manage your network",
            icon: <Users className="h-5 w-5 text-blue-400" />,
            path: "/connections",
            color: "bg-blue-500/10",
            iconColor: "text-blue-400"
        },
        {
            title: "My Feed",
            description: "See recent activity and updates",
            icon: <Rss className="h-5 w-5 text-purple-400" />,
            path: "/myfeed",
            color: "bg-purple-500/10",
            iconColor: "text-purple-400"
        },
        {
            title: "My CV",
            description: "Edit and view your curriculum vitae",
            icon: <FileText className="h-5 w-5 text-yellow-400" />,
            path: "/mycv",
            color: "bg-yellow-500/10",
            iconColor: "text-yellow-400"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                        <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="/avatar-placeholder.jpg" />
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                                ME
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            variant="ghost"
                            className="text-gray-300 hover:bg-gray-800 hover:text-white"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {menuItems.map((item, index) => (
                        <Card
                            key={index}
                            className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                            onClick={() => router.push(item.path)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <div className={`p-3 rounded-lg ${item.color}`}>
                                    {item.icon}
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-white mb-1">{item.title}</CardTitle>
                                <CardDescription className="text-gray-400">
                                    {item.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Recent Activity Section */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">Recent Activity</CardTitle>
                        <CardDescription className="text-gray-400">
                            Your latest updates and notifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-gray-300">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-green-500/10 rounded-full">
                                    <User className="h-4 w-4 text-green-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Profile updated</p>
                                    <p className="text-sm text-gray-400">You updated your profile information</p>
                                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                                </div>
                            </div>
                            <Separator className="bg-gray-700" />
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-blue-500/10 rounded-full">
                                    <Users className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-medium">New connection</p>
                                    <p className="text-sm text-gray-400">John Doe accepted your connection request</p>
                                    <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
=======
    const goToProfile = () => {
        router.push('/profile');
    };

    const goToMyFeed = () => {
        router.push('/myfeed');
    };

    const goToMyCv = () => {
        router.push('/mycv');
    };

    const goToMyVideoCall = () => {
        router.push('/videoCall');
    };



    return (
        <div>
            <h1>Dashboard</h1>
            <p>Hello! You're logged in.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={goToProfile}>Profile</button>
                <button onClick={handleLogout}>Logout</button>
                <button onClick={goToMyFeed}>My Feed</button>
                <button onClick={goToMyCv}>My Cv</button>
                <button onClick={goToMyVideoCall}>My Video Call</button>
>>>>>>> origin/main
            </div>
        </div>
    );
}