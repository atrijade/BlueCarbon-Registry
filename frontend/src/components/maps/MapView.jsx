import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Custom Glowing SVG Marker Maker
const createCustomIcon = (status) => {
  let color = '#5cc1cb'; // brand/cyan
  let glow = 'rgba(92, 193, 203, 0.4)';
  if (status === 'pending' || status === 'draft') {
    color = '#f59e0b';
    glow = 'rgba(245, 158, 11, 0.4)';
  } else if (status === 'rejected') {
    color = '#f43f5e';
    glow = 'rgba(244, 63, 94, 0.4)';
  } else if (status === 'verified' || status === 'approved') {
    color = '#10b981';
    glow = 'rgba(16, 185, 129, 0.4)';
  }

  return new L.DivIcon({
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: ${glow}; transform: scale(1); opacity: 0.8;"></div>
        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color}; border: 2px solid #070c0e; box-shadow: 0 0 6px ${color};"></div>
      </div>
    `,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

export default function MapView({ projects = [], height = '400px', center = [19.076, 72.877], zoom = 5 }) {
  const defaultCenter = [21.5, 79.0];

  return (
    <div className="dark-leaflet w-full overflow-hidden rounded-2xl relative" style={{ height }}>
      <MapContainer 
        center={center || defaultCenter} 
        zoom={zoom} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {projects.map((project) => {
          if (!project.latitude || !project.longitude) return null;
          
          const statusColors = {
            draft: '#f59e0b',
            pending: '#f59e0b',
            verified: '#10b981',
            rejected: '#f43f5e'
          };
          
          const pColor = statusColors[project.status] || '#5cc1cb';

          return (
            <React.Fragment key={project.id}>
              {/* Center point marker */}
              <Marker 
                position={[parseFloat(project.latitude), parseFloat(project.longitude)]}
                icon={createCustomIcon(project.status)}
              >
                <Popup>
                  <div className="p-1 flex flex-col gap-1.5 min-w-[180px]">
                    <h4 className="font-bold text-slate-100 text-sm m-0 border-b border-brand-500/10 pb-1">{project.title}</h4>
                    <div className="text-[11px] text-slate-300 flex flex-col gap-0.5">
                      <p className="m-0"><strong className="text-brand-400">Type:</strong> {project.restoration_type || 'Restoration site'}</p>
                      <p className="m-0"><strong className="text-brand-400">Species:</strong> {project.species || 'N/A'}</p>
                      <p className="m-0"><strong className="text-brand-400">Area:</strong> {project.area_hectares} Ha</p>
                      <p className="m-0"><strong className="text-brand-400">Status:</strong> <span className="uppercase text-[9px] font-bold">{project.status}</span></p>
                    </div>
                  </div>
                </Popup>
              </Marker>
              
              {/* Boundary polygon drawing */}
              {project.boundary_polygon && Array.isArray(project.boundary_polygon) && project.boundary_polygon.length > 2 && (
                <Polygon
                  positions={project.boundary_polygon}
                  pathOptions={{
                    color: pColor,
                    fillColor: pColor,
                    fillOpacity: 0.15,
                    weight: 2
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
