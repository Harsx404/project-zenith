"use client";

import { useState } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { MapPin, Satellite, Settings, Trash2, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { CelestialObject } from "@/lib/types/celestial";

type SavedLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type UserPreferences = {
  unitSystem: "metric" | "imperial";
  theme: "dark" | "space";
};

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState<"locations" | "objects" | "preferences">("locations");

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col max-w-5xl mx-auto w-full gap-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-white tracking-[0.2em] mb-2">MANAGE</h1>
        <p className="text-white/50 tracking-widest font-light uppercase text-sm">Control your targeting parameters</p>
      </div>

      <div className="flex border-b border-white/10 gap-8">
        <button 
          onClick={() => setActiveTab("locations")}
          className={`pb-4 text-sm font-heading tracking-widest transition-colors ${activeTab === "locations" ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white/70"}`}
        >
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> LOCATIONS</div>
        </button>
        <button 
          onClick={() => setActiveTab("objects")}
          className={`pb-4 text-sm font-heading tracking-widest transition-colors ${activeTab === "objects" ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white/70"}`}
        >
          <div className="flex items-center gap-2"><Satellite className="w-4 h-4" /> TRACKED OBJECTS</div>
        </button>
        <button 
          onClick={() => setActiveTab("preferences")}
          className={`pb-4 text-sm font-heading tracking-widest transition-colors ${activeTab === "preferences" ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white/70"}`}
        >
          <div className="flex items-center gap-2"><Settings className="w-4 h-4" /> PREFERENCES</div>
        </button>
      </div>

      <div className="flex-1">
        {activeTab === "locations" && <ManageLocations />}
        {activeTab === "objects" && <ManageObjects />}
        {activeTab === "preferences" && <ManagePreferences />}
      </div>
    </div>
  );
}

function ManageLocations() {
  const [locations, setLocations] = useLocalStorage<SavedLocation[]>("zenith:saved_locations", []);
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);
    if (!newName || isNaN(lat) || isNaN(lng)) return;
    
    setLocations([...locations, {
      id: Math.random().toString(36).substring(7),
      name: newName,
      lat,
      lng
    }]);
    setNewName("");
    setNewLat("");
    setNewLng("");
  };

  const handleRemove = (id: string) => {
    setLocations(locations.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel p-6 border border-white/10 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-xs uppercase tracking-widest text-white/50">Location Name</label>
          <input 
            type="text" 
            value={newName} 
            onChange={e => setNewName(e.target.value)}
            className="w-full bg-black/50 border border-white/10 p-3 text-white focus:outline-none focus:border-white/40"
            placeholder="e.g. Home Base"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-xs uppercase tracking-widest text-white/50">Latitude</label>
          <input 
            type="number" 
            value={newLat} 
            onChange={e => setNewLat(e.target.value)}
            className="w-full bg-black/50 border border-white/10 p-3 text-white focus:outline-none focus:border-white/40"
            placeholder="-90 to 90"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-xs uppercase tracking-widest text-white/50">Longitude</label>
          <input 
            type="number" 
            value={newLng} 
            onChange={e => setNewLng(e.target.value)}
            className="w-full bg-black/50 border border-white/10 p-3 text-white focus:outline-none focus:border-white/40"
            placeholder="-180 to 180"
          />
        </div>
        <button 
          onClick={handleAdd}
          className="p-3 bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-colors flex items-center justify-center min-w-[120px] font-heading tracking-widest text-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> ADD
        </button>
      </div>

      <div className="space-y-4">
        {locations.length === 0 && (
          <p className="text-white/30 text-center py-12 border border-white/5 border-dashed font-light">NO SAVED LOCATIONS</p>
        )}
        {locations.map(loc => (
          <div key={loc.id} className="glass-panel p-5 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between group">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{loc.name}</h3>
              <p className="font-mono text-sm text-white/50">
                {loc.lat.toFixed(4)}°, {loc.lng.toFixed(4)}°
              </p>
            </div>
            <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
              <Link href={`/dashboard?lat=${loc.lat}&lng=${loc.lng}`} className="p-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors" title="Scan Location">
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button onClick={() => handleRemove(loc.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors" title="Delete Location">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManageObjects() {
  const [tracked, setTracked] = useLocalStorage<CelestialObject[]>("zenith:tracked_objects", []);

  const handleRemove = (id: string) => {
    setTracked(tracked.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {tracked.length === 0 && (
        <div className="text-center py-20 border border-white/5 border-dashed">
          <Satellite className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/30 font-light tracking-widest uppercase">No Objects Tracked</p>
          <p className="text-white/20 text-sm mt-2">Bookmark objects from the Dashboard to see them here.</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tracked.map(obj => (
          <div key={obj.id} className="glass-panel p-5 border border-white/10 relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase mb-1">{obj.type}</div>
                <h3 className="font-heading font-bold text-lg text-white truncate max-w-[200px]" title={obj.name}>{obj.name}</h3>
              </div>
              <button onClick={() => handleRemove(obj.id)} className="p-2 opacity-0 group-hover:opacity-100 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm font-mono text-white/60">
              <div className="flex justify-between">
                <span>NORAD ID</span>
                <span className="text-white">{obj.id}</span>
              </div>
              {obj.orbitalHeightKm && (
                <div className="flex justify-between">
                  <span>ORBIT</span>
                  <span className="text-white">{Math.round(obj.orbitalHeightKm).toLocaleString()} km</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManagePreferences() {
  const [prefs, setPrefs] = useLocalStorage<UserPreferences>("zenith:preferences", {
    unitSystem: "metric",
    theme: "space"
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="glass-panel p-6 border border-white/10">
        <h3 className="text-lg font-heading tracking-widest text-white mb-6 uppercase">System Settings</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Unit System</p>
              <p className="text-white/50 text-sm font-light mt-1">Choose between kilometers and miles for distance data.</p>
            </div>
            <div className="flex bg-black/50 border border-white/10 p-1">
              <button 
                onClick={() => setPrefs({...prefs, unitSystem: "metric"})}
                className={`px-4 py-2 text-sm tracking-widest font-heading transition-colors ${prefs.unitSystem === "metric" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
              >
                METRIC
              </button>
              <button 
                onClick={() => setPrefs({...prefs, unitSystem: "imperial"})}
                className={`px-4 py-2 text-sm tracking-widest font-heading transition-colors ${prefs.unitSystem === "imperial" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
              >
                IMPERIAL
              </button>
            </div>
          </div>
          
          <hr className="border-white/10" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">UI Theme</p>
              <p className="text-white/50 text-sm font-light mt-1">Customize the color palette of the celestial tracking interface.</p>
            </div>
            <div className="flex bg-black/50 border border-white/10 p-1">
              <button 
                onClick={() => setPrefs({...prefs, theme: "space"})}
                className={`px-4 py-2 text-sm tracking-widest font-heading transition-colors ${prefs.theme === "space" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
              >
                SPACE
              </button>
              <button 
                onClick={() => setPrefs({...prefs, theme: "dark"})}
                className={`px-4 py-2 text-sm tracking-widest font-heading transition-colors ${prefs.theme === "dark" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
              >
                DARK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
