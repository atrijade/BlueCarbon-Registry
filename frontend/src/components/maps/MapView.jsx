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
            under_review: '#f59e0b',
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

        {/* Render Community Overlay Markers if supplied */}
        {projects.length === 1 && projects[0] && (
          <>
            {/* 1. Community Suggestions (Yellow) */}
            {projects[0].communityOverlay?.sites?.map((site) => (
              <Marker
                key={`site-${site.id}`}
                position={[parseFloat(site.latitude), parseFloat(site.longitude)]}
                icon={new L.DivIcon({
                  html: `<div style="width: 12px; height: 12px; border-radius: 50%; background-color: #f59e0b; border: 1.5px solid #fff; box-shadow: 0 0 6px #f59e0b;"></div>`,
                  className: 'comm-site-marker',
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                })}
              >
                <Popup>
                  <div className="p-1 flex flex-col gap-1 min-w-[160px]">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Community Site Suggestion</span>
                    <span className="font-bold text-slate-100 text-xs mt-0.5">{site.location_name}</span>
                    <p className="text-[11px] text-slate-300 m-0 mt-1"><strong>Issue:</strong> {site.issue}</p>
                    <p className="text-[11px] text-slate-350 m-0"><strong>Action:</strong> {site.suggested_action}</p>
                    <span className="text-[9px] text-slate-500 mt-1">Reported by: {site.reporter_name}</span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* 2. Community Observation logs (Blue) */}
            {projects[0].communityOverlay?.observations?.map((obs) => (
              <Marker
                key={`obs-${obs.id}`}
                position={[parseFloat(obs.latitude), parseFloat(obs.longitude)]}
                icon={new L.DivIcon({
                  html: `<div style="width: 12px; height: 12px; border-radius: 50%; background-color: #3b82f6; border: 1.5px solid #fff; box-shadow: 0 0 6px #3b82f6;"></div>`,
                  className: 'comm-obs-marker',
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                })}
              >
                <Popup>
                  <div className="p-1 flex flex-col gap-1 min-w-[160px]">
                    <span className="text-[10px] font-bold text-blue-400 uppercase">Panchayat Observation Log</span>
                    <p className="text-[11px] text-slate-200 m-0 mt-1 italic">"{obs.comments}"</p>
                    <span className="text-[9px] text-slate-500 mt-1">Reported by: {obs.reporter_name} • {new Date(obs.created_at).toLocaleDateString()}</span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* 3. Community Complaints (Red) */}
            {projects[0].communityOverlay?.complaints?.map((comp) => (
              <Marker
                key={`comp-${comp.id}`}
                position={[parseFloat(comp.latitude), parseFloat(comp.longitude)]}
                icon={new L.DivIcon({
                  html: `
                    <div style="position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
                      <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background-color: rgba(244, 63, 94, 0.3); transform: scale(1.1); box-shadow: 0 0 4px rgba(244, 63, 94, 0.4);"></div>
                      <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #f43f5e; border: 1px solid #fff;"></div>
                    </div>
                  `,
                  className: 'comm-comp-marker',
                  iconSize: [18, 18],
                  iconAnchor: [9, 9]
                })}
              >
                <Popup>
                  <div className="p-1 flex flex-col gap-1 min-w-[160px]">
                    <span className="text-[10px] font-bold text-rose-400 uppercase">Community Incident Complaint</span>
                    <span className="font-bold text-slate-100 text-xs mt-0.5 capitalize">{comp.issue_type.replace('_', ' ')}</span>
                    <p className="text-[11px] text-slate-350 m-0 mt-1"><strong>Severity:</strong> <span className="uppercase text-rose-300 font-bold">{comp.severity}</span></p>
                    <p className="text-[11px] text-slate-200 m-0">{comp.description}</p>
                    <span className="text-[9px] text-slate-500 mt-1">Filer: {comp.reporter_name}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}
