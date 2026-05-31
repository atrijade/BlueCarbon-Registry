import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Custom Glowing Marker for Vertices
const vertexIcon = new L.DivIcon({
  html: `
    <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #5cc1cb; border: 1.5px solid #fff; box-shadow: 0 0 6px #5cc1cb;"></div>
  `,
  className: 'custom-vertex-marker',
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

function MapInteraction({ points, setPoints, onChange }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const roundedLat = parseFloat(lat.toFixed(6));
      const roundedLng = parseFloat(lng.toFixed(6));
      
      const newPoints = [...points, [roundedLat, roundedLng]];
      setPoints(newPoints);
      
      // Calculate centroid of the polygon for the database latitude/longitude fields
      const averageLat = parseFloat((newPoints.reduce((sum, p) => sum + p[0], 0) / newPoints.length).toFixed(6));
      const averageLng = parseFloat((newPoints.reduce((sum, p) => sum + p[1], 0) / newPoints.length).toFixed(6));
      
      if (onChange) {
        onChange({
          lat: averageLat,
          lng: averageLng,
          boundary: newPoints
        });
      }
    }
  });

  return (
    <>
      {points.map((pt, i) => (
        <Marker key={i} position={pt} icon={vertexIcon} />
      ))}
      {points.length > 2 && (
        <Polygon positions={points} pathOptions={{ color: '#5cc1cb', fillColor: '#5cc1cb', fillOpacity: 0.25 }} />
      )}
    </>
  );
}

export default function MapPicker({ onChange, defaultPosition = null, defaultBoundary = [], height = '300px' }) {
  const initialCenter = defaultPosition || [20.5937, 78.9629]; // Default center (general visual area)
  const [points, setPoints] = useState(defaultBoundary || []);

  const handleClear = () => {
    setPoints([]);
    if (onChange) {
      onChange({
        lat: '',
        lng: '',
        boundary: []
      });
    }
  };

  return (
    <div className="dark-leaflet w-full overflow-hidden rounded-2xl relative" style={{ height }}>
      <MapContainer 
        center={initialCenter} 
        zoom={5} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInteraction points={points} setPoints={setPoints} onChange={onChange} />
      </MapContainer>

      {/* Info Badge & Clear Controls overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] flex gap-2">
        <div className="bg-[#0c2227]/90 border border-brand-500/20 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] text-brand-300 font-semibold uppercase tracking-wider shadow-lg">
          {points.length === 0 && 'Click map to define polygon boundary'}
          {points.length === 1 && 'Dropped 1st vertex. Add more to build shape'}
          {points.length === 2 && 'Added 2nd vertex. Need 3 to draw boundary'}
          {points.length > 2 && `Boundary set: ${points.length} coordinates saved`}
        </div>
        {points.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="bg-rose-500/90 hover:bg-rose-600 text-white font-bold uppercase tracking-wider text-[9px] px-2.5 py-1 rounded-lg shadow-lg transition-colors border border-rose-400/20"
          >
            Clear Boundary
          </button>
        )}
      </div>
    </div>
  );
}
