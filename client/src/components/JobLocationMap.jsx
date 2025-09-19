"use client";
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React Leaflet - Enhanced version
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create a custom icon to ensure it loads
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const JobLocationMap = ({ coordinates }) => {
  const mapRef = useRef(null);

  if (!coordinates || !coordinates.lat || !coordinates.lng) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="mb-2">📍</div>
          <p className="text-sm">Location not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapContainer
        center={[coordinates.lat, coordinates.lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coordinates.lat, coordinates.lng]} icon={customIcon}>
          <Popup>
            <div className="text-center">
              <strong>Job Location</strong><br />
              {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default JobLocationMap;