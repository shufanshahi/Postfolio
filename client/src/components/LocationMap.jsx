"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMap = ({ isOpen, onClose, onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Default position: Dhaka, Bangladesh
  const defaultPosition = [23.8103, 90.4125];

  useEffect(() => {
    if (isOpen) {
      // Set default location when map opens
      setSelectedLocation({
        lat: defaultPosition[0],
        lng: defaultPosition[1],
        address: "Dhaka, Bangladesh"
      });
    }
  }, [isOpen]);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setSelectedLocation({
      lat,
      lng,
      address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
    });
  };

  const handleConfirmLocation = () => {
    if (selectedLocation && onLocationSelect) {
      onLocationSelect(selectedLocation);
    }
    onClose();
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
        
        <div className="h-96 mb-4 rounded-lg overflow-hidden">
          <MapContainer
            center={defaultPosition}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            onClick={handleMapClick}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                <Popup>
                  Selected Location<br />
                  {selectedLocation.address}
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
