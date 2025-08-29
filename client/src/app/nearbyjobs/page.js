"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom job marker icon
const jobMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Current location marker icon
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function NearbyJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]); // Default: Dhaka, Bangladesh
  const [selectedJob, setSelectedJob] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [applying, setApplying] = useState(false);

  // Parse location string to get coordinates
  const parseLocation = (locationString) => {
    if (!locationString) return null;
    
    try {
      // Handle format like "Lat: 23.9455, Lng: 90.3833"
      const latMatch = locationString.match(/Lat:\s*(-?\d+\.?\d*)/i);
      const lngMatch = locationString.match(/Lng:\s*(-?\d+\.?\d*)/i);
      
      if (latMatch && lngMatch) {
        const lat = parseFloat(latMatch[1]);
        const lng = parseFloat(lngMatch[1]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
      
      // Handle other potential formats
      // You can add more parsing logic here for different location formats
      
    } catch (err) {
      console.error('Error parsing location:', err);
    }
    
    return null;
  };

  useEffect(() => {
    // Get user's current location
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const location = { lat: latitude, lng: longitude };
            setUserLocation(location);
            setMapCenter([latitude, longitude]);
          },
          (error) => {
            console.error("Error getting location:", error);
            // Use default location (Dhaka) if geolocation fails
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      }
    };

    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return null;

        const response = await fetch("http://localhost:8080/api/profile/me", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
          return profile;
        }
        return null;
      } catch (err) {
        console.error("Error fetching user profile:", err);
        return null;
      }
    };

    // Fetch jobs from API
    const fetchJobs = async (profile) => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("Please login to view nearby jobs");
          router.push("/login");
          return;
        }

        const response = await fetch("http://localhost:8080/api/jobs", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }

        const jobsData = await response.json();
        
        // Filter jobs that have valid location data and user hasn't applied to
        const jobsWithLocation = jobsData.filter(job => {
          const coords = parseLocation(job.location);
          const hasValidLocation = coords !== null;
          
          // Don't show jobs the user has already applied to
          const hasNotApplied = !job.applicantIds?.includes(profile?.id);
          
          return hasValidLocation && hasNotApplied;
        });

        setJobs(jobsWithLocation);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    const initializeData = async () => {
      getCurrentLocation();
      const profile = await fetchUserProfile();
      await fetchJobs(profile);
    };

    initializeData();
  }, [router]);

  // Separate fetchJobs function for refreshing after apply
  const refreshJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:8080/api/jobs", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const jobsData = await response.json();
        const jobsWithLocation = jobsData.filter(job => {
          const coords = parseLocation(job.location);
          const hasValidLocation = coords !== null;
          
          // Don't show jobs the user has already applied to
          const hasNotApplied = !job.applicantIds?.includes(userProfile?.id);
          
          return hasValidLocation && hasNotApplied;
        });
        setJobs(jobsWithLocation);
      }
    } catch (err) {
      console.error("Error refreshing jobs:", err);
    }
  };

  const handleApplyJob = async (jobId) => {
    if (!userProfile?.id) {
      alert("Unable to get user profile. Please refresh the page.");
      return;
    }

    setApplying(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/jobs/${jobId}/apply/${userProfile.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert("Application submitted successfully!");
        // Refresh jobs to update applicant status
        refreshJobs();
      } else {
        const errorText = await response.text();
        alert(`Failed to apply for job: ${errorText}`);
      }
    } catch (err) {
      console.error("Error applying for job:", err);
      alert("Failed to apply for job. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading nearby jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Nearby Jobs</h1>
          <p className="text-gray-400">
            Found {jobs.length} jobs with location data on the map
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700 h-full">
              <CardContent className="p-0 h-full">
                <div className="h-full rounded-lg overflow-hidden">
                  <MapContainer
                    center={userLocation ? [userLocation.lat, userLocation.lng] : mapCenter}
                    zoom={userLocation ? 15 : 12}
                    style={{ height: '100%', width: '100%' }}
                    key={userLocation ? `${userLocation.lat}-${userLocation.lng}` : 'default'}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* User's current location */}
                    {userLocation && (
                      <Marker 
                        position={[userLocation.lat, userLocation.lng]}
                        icon={currentLocationIcon}
                      >
                        <Popup>
                          <div className="text-center">
                            <strong>Your Location</strong>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Job markers */}
                    {jobs.map((job) => {
                      const coords = parseLocation(job.location);
                      if (!coords) return null;

                      return (
                        <Marker
                          key={job.jobId}
                          position={[coords.lat, coords.lng]}
                          icon={jobMarkerIcon}
                          eventHandlers={{
                            click: () => setSelectedJob(job)
                          }}
                        >
                          <Popup>
                            <div className="max-w-xs">
                              <h3 className="font-bold text-lg mb-2">{job.title}</h3>
                              <p className="text-gray-600 mb-1">
                                <strong>Position:</strong> {job.position}
                              </p>
                              <p className="text-gray-600 mb-1">
                                <strong>Salary:</strong> {job.minSalary && job.maxSalary 
                                  ? `${job.minSalary} - ${job.maxSalary}` 
                                  : 'Not specified'}
                              </p>
                              <p className="text-gray-600 mb-3">
                                <strong>Status:</strong> {job.status}
                              </p>
                              <Button 
                                size="sm" 
                                onClick={() => handleApplyJob(job.jobId)}
                                className="w-full"
                              >
                                View Details
                              </Button>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Details Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700 h-full">
              <CardHeader>
                <CardTitle className="text-white">
                  {selectedJob ? 'Job Details' : 'Select a job on the map'}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[calc(100vh-300px)]">
                {selectedJob ? (
                  <div className="space-y-4 text-gray-300">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {selectedJob.title}
                      </h3>
                      <p className="text-gray-400">{selectedJob.position}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-1">Description</h4>
                      <p className="text-sm">{selectedJob.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-1">Salary Range</h4>
                      <p className="text-sm">
                        {selectedJob.minSalary && selectedJob.maxSalary 
                          ? `${selectedJob.minSalary} - ${selectedJob.maxSalary}` 
                          : 'Not specified'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-1">Required Skills</h4>
                      <p className="text-sm">{selectedJob.requiredSkills}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-1">Required Experience</h4>
                      <p className="text-sm">{selectedJob.requiredExperience}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-1">Required Education</h4>
                      <p className="text-sm">{selectedJob.requiredEducation}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-1">Location</h4>
                      <p className="text-sm">{selectedJob.location}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-1">Posted Date</h4>
                      <p className="text-sm">{selectedJob.datePosted}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-1">End Date</h4>
                      <p className="text-sm">{selectedJob.endDate}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-1">Status</h4>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        selectedJob.status === 'OPEN' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {selectedJob.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-1">Applicants</h4>
                      <p className="text-sm">
                        {selectedJob.applicantIds?.length || 0} people have applied
                      </p>
                    </div>

                    <Button 
                      onClick={() => handleApplyJob(selectedJob.jobId)}
                      className="w-full mt-4"
                      disabled={selectedJob.status !== 'OPEN' || applying || 
                        (userProfile && selectedJob.applicantIds?.includes(userProfile.id))}
                    >
                      {applying ? 'Applying...' : 
                       userProfile && selectedJob.applicantIds?.includes(userProfile.id) ? 'Already Applied' :
                       selectedJob.status === 'OPEN' ? 'Apply for Job' : 'Job Closed'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    <p>Click on any red marker on the map to view job details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}