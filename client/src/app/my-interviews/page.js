"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
import { apiFetch } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Video,
  User,
  Building,
  ArrowLeft,
  Loader2,
  Map,
  Plus
} from "lucide-react";

function MyInterviews() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roadmapStatus, setRoadmapStatus] = useState({}); // Track roadmap status for each interview
  const [creatingRoadmap, setCreatingRoadmap] = useState(null); // Track which roadmap is being created

  const fetchProfileAndInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in. Please login first.");
        router.push("/login");
        return;
      }

      // Get user profile
      const profileRes = await apiFetch('/api/profile/me');
      if (!profileRes.ok) {
        setError("Failed to get user profile. Please try again.");
        return;
      }

      const profileData = await profileRes.json();
      setProfile(profileData);

      // Fetch real interviews for this profile
      const interviewsRes = await fetch(`http://localhost:8080/api/interviews/profile/${profileData.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!interviewsRes.ok) {
        console.warn("Failed to fetch interviews, using empty array");
        setInterviews([]);
      } else {
        const interviewsData = await interviewsRes.json();
        setInterviews(interviewsData);

        // Check roadmap status for each interview
        await checkRoadmapStatus(interviewsData, profileData.id, token);
      }
    } catch (err) {
      console.error("Error fetching interviews:", err);
      setError("An error occurred while fetching interviews.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfileAndInterviews();
  }, [fetchProfileAndInterviews]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-600", text: "Pending" },
      COMPLETED: { color: "bg-green-600", text: "Completed" },
      REJECTED: { color: "bg-red-600", text: "Rejected" },
      ONGOING: { color: "bg-blue-600", text: "Ongoing" }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'phone':
        return <Clock className="h-4 w-4" />;
      case 'in-person':
        return <Building className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const handleJoinInterview = async (interview) => {
    try {
      const token = localStorage.getItem("token");

      // Get the interview details using profileId and jobId
      const interviewRes = await fetch(`http://localhost:8080/api/interviews/profile/${interview.profileId}/job/${interview.jobId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!interviewRes.ok) {
        alert("Failed to get interview details.");
        return;
      }

      const interviewData = await interviewRes.json();

      // Use interview ID as room ID and join as participant (not host)
      const roomId = `${interviewData.id}`;
      router.push(`/videoCall/${roomId}?role=participant`);
    } catch (error) {
      console.error("Error joining interview:", error);
      alert("Error joining interview.");
    }
  };

  const handleViewDetails = (interviewId) => {
    // Could redirect to a detailed interview page
    console.log("View details for interview:", interviewId);
  };

  const checkRoadmapStatus = async (interviewsData, profileId, token) => {
    const statusMap = {};

    for (const interview of interviewsData) {
      try {
        const roadmapRes = await fetch(
          `http://localhost:8080/api/roadmaps/check/${interview.jobId}/${profileId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (roadmapRes.ok) {
          const data = await roadmapRes.json();
          statusMap[`${interview.jobId}-${profileId}`] = data.exists;
        }
      } catch (error) {
        console.error("Error checking roadmap status:", error);
        statusMap[`${interview.jobId}-${profileId}`] = false;
      }
    }

    setRoadmapStatus(statusMap);
  };

  const handleCreateRoadmap = async (interview) => {
    const roadmapKey = `${interview.jobId}-${interview.profileId}`;
    setCreatingRoadmap(roadmapKey);

    try {
      const token = localStorage.getItem("token");
      const roadmapData = {
        jobId: interview.jobId,
        profileId: interview.profileId,
        interviewDate: interview.schedule,
        title: `Interview Preparation Roadmap - Job ${interview.jobId}`,
        description: `Structured learning path for the upcoming interview`
      };

      const response = await fetch('http://localhost:8080/api/roadmaps', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roadmapData)
      });

      if (response.ok) {
        const createdRoadmap = await response.json();
        // Update roadmap status
        setRoadmapStatus(prev => ({
          ...prev,
          [roadmapKey]: true
        }));

        // Redirect to roadmap view
        router.push(`/roadmap/${createdRoadmap.id}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to create roadmap: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating roadmap:", error);
      alert("Error creating roadmap. Please try again.");
    } finally {
      setCreatingRoadmap(null);
    }
  };

  const handleViewRoadmap = async (interview) => {
    try {
      const token = localStorage.getItem("token");
      const roadmapRes = await fetch(
        `http://localhost:8080/api/roadmaps/job/${interview.jobId}/profile/${interview.profileId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (roadmapRes.ok) {
        const roadmap = await roadmapRes.json();
        router.push(`/roadmap/${roadmap.id}`);
      } else {
        alert("Failed to load roadmap. Please try again.");
      }
    } catch (error) {
      console.error("Error loading roadmap:", error);
      alert("Error loading roadmap. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="ml-2 text-white">Loading interviews...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-red-400 text-center mb-4">{error}</div>
          <div className="text-center">
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="mb-4 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-white">My Interviews</h1>
            {profile && (
              <p className="text-gray-400 mt-2">
                Interview schedule for: <span className="text-white font-semibold">{profile.firstName} {profile.lastName}</span>
                <span className="text-gray-500 ml-2">(Profile ID: {profile.id})</span>
              </p>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {interviews.filter(i => i.status === 'PENDING').length}
                </div>
                <div className="text-gray-400 text-sm">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {interviews.filter(i => i.status === 'ONGOING').length}
                </div>
                <div className="text-gray-400 text-sm">Ongoing</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {interviews.filter(i => i.status === 'COMPLETED').length}
                </div>
                <div className="text-gray-400 text-sm">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {interviews.length}
                </div>
                <div className="text-gray-400 text-sm">Total</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interviews List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Upcoming & Recent Interviews</CardTitle>
            <CardDescription className="text-gray-400">
              {interviews.length ?
                `${interviews.length} interview(s) found` :
                "No interviews scheduled"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p>No interviews scheduled yet.</p>
                <p className="text-sm">Check back later or apply to more jobs!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gray-600 rounded-full">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Interview for Job ID: {interview.jobId}</h3>
                        <p className="text-gray-400 text-sm">
                          <User className="h-3 w-3 inline mr-1" />
                          Profile ID: {interview.profileId}
                        </p>
                        {interview.notes && (
                          <p className="text-gray-400 text-sm">
                            Notes: {interview.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-gray-300 text-sm">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(interview.schedule).toLocaleDateString()}
                          </p>
                          <p className="text-gray-300 text-sm">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(interview.schedule).toLocaleTimeString()}
                          </p>
                        </div>
                        {interview.interviewerFeedback && (
                          <p className="text-green-400 text-sm mt-1">
                            Feedback: {interview.interviewerFeedback}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(interview.status)}
                      <div className="flex space-x-2">
                        {interview.status === 'ONGOING' && (
                          <Button
                            size="sm"
                            onClick={() => handleJoinInterview(interview)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        )}

                        {/* Roadmap Button */}
                        {roadmapStatus[`${interview.jobId}-${interview.profileId}`] ? (
                          <Button
                            size="sm"
                            onClick={() => handleViewRoadmap(interview)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Map className="h-4 w-4 mr-1" />
                            View Roadmap
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCreateRoadmap(interview)}
                            disabled={creatingRoadmap === `${interview.jobId}-${interview.profileId}`}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                          >
                            {creatingRoadmap === `${interview.jobId}-${interview.profileId}` ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4 mr-1" />
                            )}
                            {creatingRoadmap === `${interview.jobId}-${interview.profileId}`
                              ? 'Creating...'
                              : 'Create Roadmap'
                            }
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(interview.id)}
                          className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default withAuth(MyInterviews);
