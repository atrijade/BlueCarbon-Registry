import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Image as ImageIcon, 
  Info, 
  ArrowRight,
  Sparkles,
  Camera,
  Trash2
} from 'lucide-react';

export default function CreateProject() {
  const navigate = useNavigate();
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [areaHectares, setAreaHectares] = useState('');
  const [species, setSpecies] = useState('Rhizophora mucronata (Red Mangrove)');
  const [plantationDate, setPlantationDate] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  // Image Upload State
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageType, setImageType] = useState('field');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle map selection
  const handleMapChange = (coords) => {
    setLatitude(coords.lat.toString());
    setLongitude(coords.lng.toString());
  };

  // Mock upload action using high-quality Unsplash ecosystem images
  const simulateImageUpload = (e) => {
    e.preventDefault();
    setUploadingImage(true);
    
    // Simulate API delay
    setTimeout(() => {
      let mockUrl = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'; // default roots
      
      if (imageType === 'drone') {
        mockUrl = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80'; // aerial coast
      } else if (imageType === 'satellite') {
        mockUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'; // earth sat
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
    }, 1200);
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !areaHectares || !latitude || !longitude) {
      return setError('Title, Area (Ha), and Coordinates are required.');
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
        latitude,
        longitude,
        images // List of { image_url, image_type }
      };

      const result = await projectService.create(payload);
      setLoading(false);

      if (result.success) {
        navigate('/projects/my');
      } else {
        setError(result.error || 'Failed to submit restoration project.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to node server.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
          Submit Restoration Node
        </h1>
        <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">
          Registry Step: Enter GIS coordinates, plantation dates and evidence logs
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Fields: Col 1 & 2 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card title="Project Characteristics" subtitle="Core ecosystem descriptors" hoverable={false}>
            <div className="flex flex-col gap-4">
              <Input
                id="title"
                type="text"
                label="Restoration Title"
                placeholder="e.g. Sundarbans Block B - Mangrove Afforestation"
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
                  label="Location / Region Name"
                  placeholder="e.g. West Bengal, India"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  icon={MapPin}
                />

                <Input
                  id="areaHectares"
                  type="number"
                  step="0.01"
                  label="Area (Hectares)"
                  placeholder="e.g. 15.4"
                  value={areaHectares}
                  onChange={(e) => setAreaHectares(e.target.value)}
                  icon={Layers}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                    Primary Species
                  </label>
                  <select
                    className="w-full rounded-xl py-2.5 px-4 text-sm text-slate-200 glass-input"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                  >
                    <option value="Rhizophora mucronata (Red Mangrove)">Rhizophora mucronata (Red Mangrove)</option>
                    <option value="Avicennia marina (Grey Mangrove)">Avicennia marina (Grey Mangrove)</option>
                    <option value="Zostera marina (Eelgrass Seagrass)">Zostera marina (Eelgrass Seagrass)</option>
                    <option value="Spartina alterniflora (Smooth Cordgrass Saltmarsh)">Spartina alterniflora (Smooth Cordgrass Saltmarsh)</option>
                    <option value="Mixed Species Ecosystem">Mixed Species Ecosystem</option>
                  </select>
                </div>

                <Input
                  id="plantationDate"
                  type="date"
                  label="Plantation / Restoration Date"
                  value={plantationDate}
                  onChange={(e) => setPlantationDate(e.target.value)}
                  icon={Calendar}
                />
              </div>
            </div>
          </Card>

          {/* Coordinate GIS picker */}
          <Card title="GIS Mapping Coordinates" subtitle="Drop a pin at the center of the restoration boundary" hoverable={false}>
            <div className="flex flex-col gap-4">
              <MapPicker onChange={handleMapChange} height="300px" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  label="Latitude"
                  placeholder="e.g. 21.9497"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />

                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  label="Longitude"
                  placeholder="e.g. 89.1833"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Evidence & Submit: Col 3 */}
        <div className="flex flex-col gap-6">
          <Card title="Evidence Locker" subtitle="Upload field, drone or satellite photos" hoverable={false}>
            <div className="flex flex-col gap-4">
              {/* Type Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-400">Evidence Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['field', 'drone', 'satellite'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setImageType(t)}
                      className={`
                        py-2 text-[10px] uppercase font-bold tracking-wider rounded-lg border transition-all duration-150
                        ${imageType === t 
                          ? 'bg-brand-400 text-darkbg-300 border-brand-400' 
                          : 'bg-[#070c0e]/50 border-brand-500/10 text-slate-400 hover:text-slate-200'
                        }
                      `}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Trigger */}
              <div className="flex flex-col items-center justify-center p-6 border border-dashed border-brand-500/20 rounded-xl bg-[#070c0e]/40 relative">
                <Camera className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs text-slate-400 font-semibold mb-1">Upload Photo Evidence</span>
                <span className="text-[10px] text-slate-500">Supports PNG, JPG up to 10MB</span>
                <button
                  type="button"
                  onClick={simulateImageUpload}
                  disabled={uploadingImage}
                  className="mt-3 text-xs bg-[#0c2227] text-brand-300 border border-brand-400/20 px-3 py-1.5 rounded-lg hover:bg-[#0c2227]/80 transition-colors"
                >
                  {uploadingImage ? 'Uploading Node...' : 'Simulate Upload'}
                </button>
              </div>

              {/* Image List */}
              {images.length > 0 ? (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs font-semibold text-slate-400 border-b border-brand-500/5 pb-1">Uploaded Logs ({images.length})</span>
                  <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {images.map((img) => (
                      <div key={img.id} className="relative group rounded-lg overflow-hidden border border-brand-500/10 h-24 bg-[#070c0e]">
                        <img src={img.image_url} alt="Restoration logs" className="w-full h-full object-cover opacity-80" />
                        <span className="absolute top-1 left-1 bg-[#0c2227]/90 text-[8px] font-bold text-brand-400 uppercase tracking-widest px-1.5 py-0.5 rounded border border-brand-400/10">
                          {img.image_type}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 bg-rose-600/90 p-1.5 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 p-3 bg-brand-900/10 border border-brand-500/5 rounded-xl text-[11px] text-slate-400 mt-2">
                  <Info className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <p>Adding drone, field or satellite photos accelerates verification times and builds platform trust.</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Registry Submission" hoverable={false}>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2.5 text-[11px] text-slate-400">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p>
                  Submitting will record this restoration coordinates onto the registry. A verified state allows automatic tokenization of Carbon Assets.
                </p>
              </div>

              <Button type="submit" loading={loading} className="w-full py-3">
                Register Node <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
