"use client";
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({
        lat,
        lng,
        address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
      });
    },
  });
  return null;
};

const LocationMap = ({ isOpen, onClose, onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]); // Default: Dhaka, Bangladesh
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mapRef = useRef(null);

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLocation = {
          lat: latitude,
          lng: longitude,
          address: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        };
        
        setCurrentLocation(userLocation);
        setSelectedLocation(userLocation);
        setMapCenter([latitude, longitude]);
        setIsLoadingLocation(false);
        
        // Fly to user location if map is available
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 15);
        }
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      // Try to get user's current location when map opens
      getCurrentLocation();
    } else {
      // Reset states when modal closes
      setSelectedLocation(null);
      setCurrentLocation(null);
      setLocationError(null);
      setMapCenter([23.8103, 90.4125]);
    }
  }, [isOpen]);

  const handleMapClick = (locationData) => {
    setSelectedLocation(locationData);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation && onLocationSelect) {
      onLocationSelect(selectedLocation);
    }
    onClose();
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setSelectedLocation(currentLocation);
      if (mapRef.current) {
        mapRef.current.flyTo([currentLocation.lat, currentLocation.lng], 15);
      }
    } else {
      getCurrentLocation();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Select Job Location</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Location Controls */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLoadingLocation}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-500 flex items-center gap-2"
          >
            {isLoadingLocation ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Getting Location...
              </>
            ) : (
              <>
                📍 Use Current Location
              </>
            )}
          </button>
          
          {locationError && (
            <div className="px-3 py-2 bg-red-600 text-white rounded text-sm">
              {locationError}
            </div>
          )}
        </div>
        
        <div className="h-96 mb-4 rounded-lg overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
            key={`${mapCenter[0]}-${mapCenter[1]}`} // Force re-render when center changes
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleMapClick} />
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                <Popup>
                  Selected Location<br />
                  {selectedLocation.address}
                </Popup>
              </Marker>
            )}
            {currentLocation && currentLocation !== selectedLocation && (
              <Marker 
                position={[currentLocation.lat, currentLocation.lng]}
                opacity={0.6}
              >
                <Popup>
                  Your Current Location<br />
                  {currentLocation.address}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {selectedLocation && (
          <div className="mb-4 p-3 bg-gray-700 rounded text-white">
            <p><strong>Selected Location:</strong> {selectedLocation.address}</p>
            <p><strong>Coordinates:</strong> {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</p>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmLocation}
            disabled={!selectedLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-500"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;
