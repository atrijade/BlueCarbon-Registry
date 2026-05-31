import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Glowing Selector Marker
const pickerIcon = new L.DivIcon({
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: rgba(92, 193, 203, 0.4); animation: ping 1.5s infinite;"></div>
      <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #5cc1cb; border: 2.5px solid #fff; box-shadow: 0 0 10px #5cc1cb;"></div>
    </div>
  `,
  className: 'custom-picker-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Internal event handler to capture clicks
function LocationMarker({ position, setPosition, onChange }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const roundedLat = parseFloat(lat.toFixed(6));
      const roundedLng = parseFloat(lng.toFixed(6));
      setPosition([roundedLat, roundedLng]);
      if (onChange) {
        onChange({ lat: roundedLat, lng: roundedLng });
      }
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={pickerIcon} />
  );
}

export default function MapPicker({ onChange, defaultPosition = null, height = '300px' }) {
  // Center coastal region of India (Mumbai/Goa/Kerala/Sundarbans visual range)
  const initialCenter = defaultPosition || [19.076, 72.877]; 
  const [position, setPosition] = useState(defaultPosition);

  return (
    <div className="dark-leaflet w-full overflow-hidden rounded-2xl relative" style={{ height }}>
      <MapContainer 
        center={initialCenter} 
        zoom={6} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} onChange={onChange} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[1000] bg-[#0c2227]/90 border border-brand-500/20 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] text-brand-300 font-semibold uppercase tracking-wider">
        {position ? `Lat: ${position[0]}, Lng: ${position[1]}` : 'Click map to drop marker'}
      </div>
    </div>
  );
}
