'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, GraduationCap, Briefcase, User, Loader2, Save, Upload } from 'lucide-react';
import EducationManagement from "@/components/EducationManagement";
import WorkManagement from "@/components/WorkManagement";
import Navbar from '@/components/Navbar';

function ProfileManagementPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profileId, setProfileId] = useState(null);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState("profile");
    const [isUpdating, setIsUpdating] = useState(false);
    const [formData, setFormData] = useState({
        bio: '',
        birthDate: '',
        phoneNumber: '',
        address: '',
        sscResult: '',
        hscResult: '',
        universityResult: '',
        positionOrInstitue: '',
        profilePicture: null
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8080/api/profile/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch profile');

                const data = await response.json();
                setProfileId(data.id);
                setProfile(data);

                // Set form data with existing profile information
                setFormData({
                    bio: data.bio || '',
                    birthDate: data.birthDate ? data.birthDate.substring(0, 10) : '',
                    phoneNumber: data.phoneNumber || '',
                    address: data.address || '',
                    sscResult: data.sscResult || '',
                    hscResult: data.hscResult || '',
                    universityResult: data.universityResult || '',
                    positionOrInstitue: data.positionOrInstitue || '',
                    profilePicture: null
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, profilePicture: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();

            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formDataToSend.append(key, value);
                }
            });

            const response = await fetch('http://localhost:8080/api/profile', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            if (!response.ok) throw new Error('Failed to update profile');

            const updatedProfile = await response.json();
            setProfile(updatedProfile);
            setSuccess('Profile updated successfully!');

            // Update form data to reflect the saved changes
            setFormData({
                ...formData,
                profilePicture: null // Reset file input
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-teal-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <div className="flex items-center justify-center h-screen">
                    <div className="space-y-4 text-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-teal-200/20 animate-pulse"></div>
                        </div>
                        <p className="text-teal-600 dark:text-teal-400 font-medium text-lg">Loading your profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-teal-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                    <Alert variant="destructive" className="mb-6 bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-700 text-red-700 dark:text-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-teal-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
                <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
            </div>

            <Navbar/>

  

            {/* Main Content */}
            <div className="relative w-full px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-6xl mx-auto">
                    {/* Success/Error Messages */}
                    {success && (
                        <Alert className="mb-6 bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-700 text-green-700 dark:text-green-200">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive" className="mb-6 bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-700 text-red-700 dark:text-red-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60">
                            <TabsTrigger
                                value="profile"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-teal-700 dark:text-slate-300 transition-all"
                            >
                                <User className="h-4 w-4 mr-2" />
                                Profile Info
                            </TabsTrigger>
                            <TabsTrigger
                                value="education"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-teal-700 dark:text-slate-300 transition-all"
                            >
                                <GraduationCap className="h-4 w-4 mr-2" />
                                Education
                            </TabsTrigger>
                            <TabsTrigger
                                value="work"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-teal-700 dark:text-slate-300 transition-all"
                            >
                                <Briefcase className="h-4 w-4 mr-2" />
                                Work Experience
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="mt-6">
                            <Card className="bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors">
                                <CardHeader>
                                    <CardTitle className="text-teal-800 dark:text-white flex items-center gap-2">
                                        <User className="h-5 w-5 text-teal-500" />
                                        Profile Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Profile Picture Section */}
                                            <div className="md:col-span-2 flex flex-col items-center space-y-4">
                                                <Avatar className="w-24 h-24 border-4 border-teal-200 dark:border-teal-600">
                                                    {profile?.pictureBase64 ? (
                                                        <AvatarImage
                                                            src={`data:image/jpeg;base64,${profile.pictureBase64}`}
                                                            alt="Profile"
                                                        />
                                                    ) : (
                                                        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-indigo-500 text-white text-xl font-semibold">
                                                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div className="space-y-2">
                                                    <Label htmlFor="profilePicture" className="text-teal-700 dark:text-slate-300 font-medium">
                                                        Profile Picture
                                                    </Label>
                                                    <div className="flex items-center space-x-2">
                                                        <Input
                                                            id="profilePicture"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileChange}
                                                            className="file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-slate-700 dark:file:text-slate-200"
                                                        />
                                                        <Upload className="h-4 w-4 text-teal-500" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bio */}
                                            <div className="md:col-span-2 space-y-2">
                                                <Label htmlFor="bio" className="text-teal-700 dark:text-slate-300 font-medium">
                                                    Bio
                                                </Label>
                                                <Textarea
                                                    id="bio"
                                                    name="bio"
                                                    value={formData.bio}
                                                    onChange={handleInputChange}
                                                    placeholder="Tell us about yourself..."
                                                    className="min-h-[100px] border-teal-200 dark:border-slate-600 focus:border-teal-500 dark:focus:border-teal-400"
                                                />
                                            </div>

                                            {/* Birth Date */}
                                            <div className="space-y-2">
                                                <Label htmlFor="birthDate" className="text-teal-700 dark:text-slate-300 font-medium">
                                                    Birth Date
                                                </Label>
                                                <Input
                                                    id="birthDate"
                                                    type="date"
                                                    name="birthDate"
                                                    value={formData.birthDate}
                                                    onChange={handleInputChange}
                                                    className="border-teal-200 dark:border-slate-600 focus:border-teal-500 dark:focus:border-teal-400"
                                                />
                                            </div>

                                            {/* Phone Number */}
                                            <div className="space-y-2">
                                                <Label htmlFor="phoneNumber" className="text-teal-700 dark:text-slate-300 font-medium">
                                                    Phone Number
                                                </Label>
                                                <Input
                                                    id="phoneNumber"
                                                    type="tel"
                                                    name="phoneNumber"
                                                    value={formData.phoneNumber}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your phone number"
                                                    className="border-teal-200 dark:border-slate-600 focus:border-teal-500 dark:focus:border-teal-400"
                                                />
                                            </div>

                                            {/* Address */}
                                            <div className="md:col-span-2 space-y-2">
                                                <Label htmlFor="address" className="text-teal-700 dark:text-slate-300 font-medium">
                                                    Address
                                                </Label>
                                                <Input
                                                    id="address"
                                                    type="text"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your address"
                                                    className="border-teal-200 dark:border-slate-600 focus:border-teal-500 dark:focus:border-teal-400"
                                                />
                                            </div>

                                        </div>    



                                        <div className="flex justify-end pt-4">
                                            <Button
                                                type="submit"
                                                disabled={isUpdating}
                                                className="bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-white px-8 py-2 font-medium transition-all duration-200"
                                            >
                                                {isUpdating ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="education" className="mt-6">
                            <Card className="bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors">
                                <CardHeader>
                                    <CardTitle className="text-teal-800 dark:text-white flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-teal-500" />
                                        Education Management
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <EducationManagement userId={profileId} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="work" className="mt-6">
                            <Card className="bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors">
                                <CardHeader>
                                    <CardTitle className="text-teal-800 dark:text-white flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-teal-500" />
                                        Work Experience Management
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <WorkManagement userId={profileId} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

export default withAuth(ProfileManagementPage);
