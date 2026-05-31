import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { projectService } from '../services/api';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import MapPicker from '../components/maps/MapPicker';
import { 
  TreePine, 
  MapPin, 
  Layers, 
  Calendar, 
  Info, 
  ArrowRight,
  Sparkles,
  Camera,
  Trash2,
  FileText
} from 'lucide-react';

export default function CreateProject() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  
  // Check if editing an existing draft
  const editProject = routerLocation.state?.editProject;

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [areaHectares, setAreaHectares] = useState('');
  const [species, setSpecies] = useState('Rhizophora mucronata (Red Mangrove)');
  const [plantationDate, setPlantationDate] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [restorationType, setRestorationType] = useState('mangrove');
  const [boundaryPolygon, setBoundaryPolygon] = useState([]);
  
  // Image Upload State
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageType, setImageType] = useState('field');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Populate form if editing a draft
  useEffect(() => {
    if (editProject) {
      setTitle(editProject.title || '');
      setDescription(editProject.description || '');
      setLocationName(editProject.location_name || '');
      setAreaHectares(editProject.area_hectares || '');
      setSpecies(editProject.species || 'Rhizophora mucronata (Red Mangrove)');
      setPlantationDate(editProject.plantation_date || '');
      setLatitude(editProject.latitude || '');
      setLongitude(editProject.longitude || '');
      setRestorationType(editProject.restoration_type || 'mangrove');
      setBoundaryPolygon(editProject.boundary_polygon || []);
      setImages(editProject.images || []);
    }
  }, [editProject]);

  // Handle map selection
  const handleMapChange = (data) => {
    setLatitude(data.lat.toString());
    setLongitude(data.lng.toString());
    setBoundaryPolygon(data.boundary || []);
  };

  // Mock uploader mapping to specific photo evidence
  const simulateImageUpload = (e) => {
    e.preventDefault();
    setUploadingImage(true);
    
    setTimeout(() => {
      let mockUrl = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80';
      
      if (imageType === 'drone') {
        mockUrl = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80';
      } else if (imageType === 'satellite') {
        mockUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80';
      } else if (imageType === 'document') {
        mockUrl = 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80'; // survey/sheets paper mockup
      }

      setImages(prev => [
        ...prev, 
        { 
          id: Math.random().toString(36).substr(2, 9),
          image_url: mockUrl, 
          image_type: imageType 
        }
      ]);
      setUploadingImage(false);
    }, 1000);
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSave = async (status) => {
    if (!title || !areaHectares) {
      return setError('Project Title and Area (Ha) are required.');
    }

    if (status === 'pending' && (boundaryPolygon.length < 3 || !latitude || !longitude)) {
      return setError('A valid boundary polygon (at least 3 coordinates) is required to submit.');
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        location_name: locationName,
        area_hectares: areaHectares,
        species,
        plantation_date: plantationDate,
        latitude: latitude || null,
        longitude: longitude || null,
        restoration_type: restorationType,
        boundary_polygon: boundaryPolygon,
        status, // 'draft' or 'pending'
        images
      };

      let result;
      if (editProject) {
        // Update existing draft project
        result = await projectService.create({ ...payload, id: editProject.id }); // Under Vite API, put uses id parameter
        // Wait, we defined projectService.update or put?
        // Let's check api.js: we only defined create! Oh, let's update api.js to include update!
        // Wait, let's write api.js update call or modify projectService.create in frontend to support updates.
        // Actually, we can add projectService.update in api.js, let's call axios put in createProject or update.
        // Let's look at api.js: we can use axios.put(`/projects/${editProject.id}`, payload) directly or we can update api.js first.
        // Let's call axios put directly or update api.js.
        // To be safe, we will call Axios directly or invoke the api.js service. Let's make sure we update api.js.
        // Actually, we can update api.js right after or make the axios call.
      }
      
      // Let's modify CreateProject.jsx to use axios directly or call a PUT request using Axios imported.
      // Wait, let's use api.js which we will update, or import axios.
      // Let's import api from '../services/api' and run:
      // result = await api.put(`/projects/${editProject.id}`, payload);
      // This is extremely simple and doesn't require modifying api.js if we use the default api client directly!
      // Yes! 'import api' from '../services/api' and running api.put is beautiful.
    } catch (err) {}
  };

  // Let's write the complete submission handler using the Axios API client
  const submitProjectData = async (statusVal) => {
    if (!title || !areaHectares) {
      return setError('Project Title and Area (Ha) are required.');
    }

    if (statusVal === 'pending' && (boundaryPolygon.length < 3 || !latitude || !longitude)) {
      return setError('A valid boundary polygon (at least 3 coordinates clicked on the map) is required to submit.');
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        location_name: locationName,
        area_hectares: parseFloat(areaHectares),
        species,
        plantation_date: plantationDate || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        restoration_type: restorationType,
        boundary_polygon: boundaryPolygon,
        status: statusVal,
        images
      };

      let res;
      if (editProject) {
        // Import api directly to make the PUT request
        const apiModule = await import('../services/api');
        res = await apiModule.default.put(`/projects/${editProject.id}`, payload);
        res = res.data;
      } else {
        res = await projectService.create(payload);
      }

      setLoading(false);
      if (res.success) {
        navigate('/projects/my');
      } else {
        setError(res.error || 'Failed to register project.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registry node submission error.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
          {editProject ? 'Modify Project Draft' : 'Register Restoration Site'}
        </h1>
        <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">
          {editProject ? 'Editing Draft Record' : 'Registry Step: Enter GIS coordinates, plantation dates and evidence logs'}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Fields: Col 1 & 2 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card title="Ecosystem Attributes" subtitle="Project descriptions & species configurations" hoverable={false}>
            <div className="flex flex-col gap-4">
              <Input
                id="title"
                type="text"
                label="Restoration Project Title"
                placeholder="e.g. Kundapura Mangrove Restoration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                icon={TreePine}
                required
              />

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                  Project Description
                </label>
                <textarea
                  className="w-full rounded-xl py-2.5 px-4 text-sm text-slate-200 glass-input min-h-[100px]"
                  placeholder="Summarize the planting site, community participants, species condition and restoration objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="locationName"
                  type="text"
                  label="Location Name"
                  placeholder="e.g. Kundapura Coast, Karnataka"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  icon={MapPin}
                />

                <Input
                  id="areaHectares"
                  type="number"
                  step="0.01"
                  label="Area (Hectares)"
                  placeholder="e.g. 15.0"
                  value={areaHectares}
                  onChange={(e) => setAreaHectares(e.target.value)}
                  icon={Layers}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                    Restoration Type
                  </label>
                  <select
                    className="w-full rounded-xl py-2.5 px-4 text-sm text-slate-200 glass-input"
                    value={restorationType}
                    onChange={(e) => setRestorationType(e.target.value)}
                  >
                    <option value="mangrove">Mangrove Forest</option>
                    <option value="seagrass">Seagrass Meadow</option>
                    <option value="salt_marsh">Salt Marsh</option>
                  </select>
                </div>

                <Input
                  id="species"
                  type="text"
                  label="Species Planted"
                  placeholder="e.g. Rhizophora mucronata"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  icon={TreePine}
                  required
                />

                <Input
                  id="plantationDate"
                  type="date"
                  label="Plantation Date"
                  value={plantationDate}
                  onChange={(e) => setPlantationDate(e.target.value)}
                  icon={Calendar}
                />
              </div>
            </div>
          </Card>

          {/* GIS Boundary Drawing Map */}
          <Card title="GIS Boundary Marker" subtitle="Click points on map to draw your restoration polygon" hoverable={false}>
            <div className="flex flex-col gap-4">
              <MapPicker 
                onChange={handleMapChange} 
                defaultPosition={editProject?.latitude ? [parseFloat(editProject.latitude), parseFloat(editProject.longitude)] : null} 
                defaultBoundary={editProject?.boundary_polygon || []}
                height="320px" 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-brand-400 font-bold uppercase">Centroid Latitude</span>
                  <span className="text-sm font-semibold text-slate-200 mt-1 font-mono">{latitude || 'Not set'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-brand-400 font-bold uppercase">Centroid Longitude</span>
                  <span className="text-sm font-semibold text-slate-200 mt-1 font-mono">{longitude || 'Not set'}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Evidence Logs & Submit actions: Col 3 */}
        <div className="flex flex-col gap-6">
          <Card title="Evidence Locker" subtitle="Classify and upload monitoring files" hoverable={false}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-400">Classify File Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'field', label: 'Field Photo' },
                    { id: 'drone', label: 'Drone Photo' },
                    { id: 'satellite', label: 'Satellite' },
                    { id: 'document', label: 'Document' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setImageType(t.id)}
                      className={`
                        py-2 text-[9px] uppercase font-bold tracking-wider rounded-lg border transition-all duration-150
                        ${imageType === t.id 
                          ? 'bg-brand-400 text-darkbg-300 border-brand-400' 
                          : 'bg-[#070c0e]/50 border-brand-500/10 text-slate-400 hover:text-slate-200'
                        }
                      `}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Panel */}
              <div className="flex flex-col items-center justify-center p-6 border border-dashed border-brand-500/20 rounded-xl bg-[#070c0e]/40 relative text-center">
                {imageType === 'document' ? (
                  <FileText className="w-8 h-8 text-slate-500 mb-2" />
                ) : (
                  <Camera className="w-8 h-8 text-slate-500 mb-2" />
                )}
                <span className="text-xs text-slate-400 font-semibold mb-1">
                  {imageType === 'document' ? 'Add Supporting Document' : 'Upload Image Evidence'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {imageType === 'field' && 'Before/After/Progress pictures'}
                  {imageType === 'drone' && 'Aerial & Coverage checks'}
                  {imageType === 'satellite' && 'Satellite NDVI logs'}
                  {imageType === 'document' && 'Survey reports, site assessments'}
                </span>
                <button
                  type="button"
                  onClick={simulateImageUpload}
                  disabled={uploadingImage}
                  className="mt-3 text-xs bg-[#0c2227] text-brand-300 border border-brand-400/20 px-3 py-1.5 rounded-lg hover:bg-[#0c2227]/80 transition-colors"
                >
                  {uploadingImage ? 'Uploading Node...' : 'Add Evidence'}
                </button>
              </div>

              {/* Uploaded List */}
              {images.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs font-semibold text-slate-400 border-b border-brand-500/5 pb-1">Uploaded Logs ({images.length})</span>
                  <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {images.map((img) => (
                      <div key={img.id} className="relative group rounded-lg overflow-hidden border border-brand-500/10 h-20 bg-[#070c0e]">
                        <img src={img.image_url} alt="Restoration logs" className="w-full h-full object-cover opacity-80" />
                        <span className="absolute top-1 left-1 bg-[#0c2227]/90 text-[7px] font-bold text-brand-400 uppercase tracking-widest px-1.5 py-0.5 rounded border border-brand-400/10">
                          {img.image_type}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 bg-rose-600/90 p-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Submit Options" hoverable={false}>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 p-3 bg-brand-900/10 border border-brand-500/5 rounded-xl text-[10px] text-slate-400">
                <Info className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <p>NGOs can save drafts at any point. Final submission locks modifications and triggers auditor queue actions.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => submitProjectData('draft')}
                  disabled={loading}
                  className="w-full bg-[#0c2227] text-brand-300 font-bold border border-brand-400/25 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-[#0c2227]/80 transition-colors"
                >
                  Save as Draft
                </button>
                
                <button
                  type="button"
                  onClick={() => submitProjectData('pending')}
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-brand-400 to-brand-600 text-darkbg-300 font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                >
                  Submit Project
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
