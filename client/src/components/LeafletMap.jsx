'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

let L;
let jobMarkerIcon;
let currentLocationIcon;

// Initialize Leaflet only on client side
if (typeof window !== 'undefined') {
  import('leaflet/dist/leaflet.css');
  L = require('leaflet');
  
  // Fix for default markers
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  // Job marker icon
  jobMarkerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Current location marker icon
  currentLocationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

const LeafletMap = ({ 
  center, 
  zoom = 13, 
  userLocation, 
  jobs = [], 
  onJobClick, 
  parseLocation,
  height = '100%',
  width = '100%'
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div 
        style={{ height, width }}
        className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg"
      >
        <div className="text-slate-500 dark:text-slate-400">Loading map...</div>
      </div>
    );
  }

  return (
    <div style={{ height, width }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        key={`${center[0]}-${center[1]}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User's current location marker */}
        {userLocation && currentLocationIcon && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]}
            icon={currentLocationIcon}
          >
            <Popup>
              <div className="text-center p-2">
                <strong className="text-blue-600">Your Location</strong>
                <p className="text-sm text-slate-600 mt-1">You are here</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Job markers */}
        {jobs.map((job) => {
          const coords = parseLocation ? parseLocation(job.location) : null;
          if (!coords || !jobMarkerIcon) return null;

          return (
            <Marker
              key={job.jobId}
              position={[coords.lat, coords.lng]}
              icon={jobMarkerIcon}
              eventHandlers={{
                click: () => onJobClick && onJobClick(job)
              }}
            >
              <Popup>
                <div className="max-w-xs p-2">
                  <h3 className="font-bold text-lg mb-2 text-slate-800">{job.title}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">{job.position}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        {job.minSalary && job.maxSalary 
                          ? `${job.minSalary} - ${job.maxSalary}` 
                          : 'Salary not specified'}
                      </span>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded">
                      {job.status}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;