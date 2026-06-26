"use client";

import { CelestialObject } from "@/lib/types/celestial";
import { formatDistanceToNow } from "date-fns";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { useState, useEffect } from "react";
import { Bookmark, X } from "lucide-react";

export default function ObjectDetails({
  object,
  onClose,
}: {
  object: CelestialObject | null;
  onClose: () => void;
}) {
  const [trackedObjects, setTrackedObjects] = useLocalStorage<CelestialObject[]>(
    "zenith:tracked_objects",
    []
  );

  const [wikiData, setWikiData] = useState<any>(null);
  const [isLoadingWiki, setIsLoadingWiki] = useState(false);

  useEffect(() => {
    setWikiData(null);
    if (!object) return;

    let isMounted = true;
    setIsLoadingWiki(true);

    const fetchWiki = async () => {
      try {
        let searchQuery = object.name.replace(/\(.*\)/g, '').replace(/ R\/B$/, '').trim();
        if (searchQuery === 'ISS') searchQuery = "International Space Station";
        else if (searchQuery === 'HST') searchQuery = "Hubble Space Telescope";

        const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&utf8=&format=json&origin=*`);
        const searchData = await searchRes.json();
        
        if (searchData.query?.search?.length > 0) {
          const spaceKeywords = ['space', 'satellite', 'rocket', 'orbit', 'missile', 'telescope', 'planet', 'astronomy', 'nasa', 'roscosmos', 'esa', 'spacex', 'observatory', 'spacecraft', 'constellation', 'star', 'galaxy'];
          
          let bestMatchTitle = null;

          // Intelligently find the first search result that actually mentions space/satellites in its preview text
          for (const hit of searchData.query.search) {
            const text = (hit.title + " " + hit.snippet).toLowerCase();
            if (spaceKeywords.some(kw => text.includes(kw))) {
              bestMatchTitle = hit.title;
              break;
            }
          }

          // Fallback to the first result if no keywords matched
          if (!bestMatchTitle) {
            bestMatchTitle = searchData.query.search[0].title;
          }

          const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestMatchTitle)}`);
          const summaryData = await summaryRes.json();
          
          if (summaryData.type !== 'disambiguation' && summaryData.extract) {
            const extractLower = summaryData.extract.toLowerCase();
            const isSpaceRelated = spaceKeywords.some(kw => extractLower.includes(kw));
            
            if (isSpaceRelated) {
              if (isMounted) setWikiData(summaryData);
            } else {
              if (isMounted) setWikiData(null);
            }
          } else {
            if (isMounted) setWikiData(null);
          }
        } else {
          if (isMounted) setWikiData(null);
        }
      } catch (e) {
        console.error("Failed to fetch wiki data", e);
      } finally {
        if (isMounted) setIsLoadingWiki(false);
      }
    };
    
    fetchWiki();
    return () => { isMounted = false; };
  }, [object?.name]);

  if (!object) return null;

  const isTracked = trackedObjects.some((t) => t.id === object.id);
  const isInZenith = object.altitude >= 80;

  const toggleTrack = () => {
    if (isTracked) {
      setTrackedObjects(trackedObjects.filter((t) => t.id !== object.id));
    } else {
      setTrackedObjects([...trackedObjects, object]);
    }
  };

  return (
    <div
      className="fixed bottom-6 left-6 z-40 w-[340px] animate-in slide-in-from-bottom-6 fade-in duration-300 bg-black/85 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl shadow-cyan-900/20"
    >
      {/* Hero Header */}
      <div className="relative h-28 w-full bg-space-black/50 border-b border-white/10">
        {isLoadingWiki ? (
          <div className="absolute inset-0 animate-pulse bg-white/5" />
        ) : wikiData?.thumbnail ? (
          <img 
            src={wikiData.thumbnail.source} 
            alt={wikiData.title}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 to-black/80" />
        )}
        
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

        {/* Top Action Buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <button
            onClick={toggleTrack}
            className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
              isTracked
                ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                : "border-white/10 bg-black/40 text-white/50 hover:text-white hover:border-white/30"
            }`}
            title={isTracked ? "Remove Bookmark" : "Bookmark Object"}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isTracked ? "fill-cyan-400" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full backdrop-blur-md border border-white/10 bg-black/40 text-white/50 hover:text-white hover:border-white/30 transition-all"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title and Badge */}
        <div className="absolute bottom-3 left-4 right-3 z-10">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.3em] drop-shadow-md">
              {object.type}
            </span>
            {isInZenith && (
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 px-1.5 py-0.5 text-[8px] font-heading tracking-widest uppercase animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                ZENITH ZONE
              </span>
            )}
          </div>
          <h3 className={`text-lg font-bold font-heading tracking-wider uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight`}>
            {object.name}
          </h3>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4">
        
        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="border border-white/10 bg-white/5 p-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[9px] uppercase text-white/40 tracking-[0.2em] mb-0.5">ALTITUDE</p>
            <p className="text-lg font-heading text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
              {object.altitude.toFixed(2)}°
            </p>
          </div>
          <div className="border border-white/10 bg-white/5 p-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[9px] uppercase text-white/40 tracking-[0.2em] mb-0.5">AZIMUTH</p>
            <p className="text-lg font-heading text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
              {object.azimuth.toFixed(2)}°
            </p>
          </div>
          
          {object.distanceKm != null && (
            <div className={`border border-white/10 bg-white/5 p-2 relative overflow-hidden group ${object.orbitalHeightKm == null ? "col-span-2" : ""}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-[9px] uppercase text-white/40 tracking-[0.2em] mb-0.5">DISTANCE</p>
              <p className="text-lg font-heading text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                {object.distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-[10px] text-cyan-400/50">KM</span>
              </p>
            </div>
          )}

          {object.orbitalHeightKm != null && (
            <div className={`border border-white/10 bg-white/5 p-2 relative overflow-hidden group ${object.distanceKm == null ? "col-span-2" : ""}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-[9px] uppercase text-white/40 tracking-[0.2em] mb-0.5">ORBITAL HEIGHT</p>
              <p className="text-lg font-heading text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                {object.orbitalHeightKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-[10px] text-cyan-400/50">KM</span>
              </p>
            </div>
          )}
        </div>

        {/* Status Rows */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-[10px] tracking-wider">
            <span className="text-white/40 uppercase">STATUS</span>
            <span className="text-cyan-400 font-medium uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
              {object.visibilityStatus}
            </span>
          </div>

          {object.zenithETA && object.altitude < 80 && (
            <div className="flex justify-between items-center text-[10px] tracking-wider border border-purple-500/30 bg-purple-500/10 p-1.5 rounded">
              <span className="text-purple-300/70 uppercase">ZENITH ETA</span>
              <span className="text-purple-300 font-bold uppercase animate-pulse">
                {new Date(object.zenithETA).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-[10px] tracking-wider">
            <span className="text-white/40 uppercase">SOURCE</span>
            <span className="text-white/80 font-medium uppercase">{object.source}</span>
          </div>
          
          <div className="flex justify-between items-center text-[10px] tracking-wider">
            <span className="text-white/40 uppercase">UPDATED</span>
            <span className="text-white/80 font-medium uppercase">
              {formatDistanceToNow(new Date(object.lastUpdated), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Wikipedia Extract */}
        {isLoadingWiki ? (
          <div className="border-t border-white/10 pt-3 animate-pulse">
            <div className="h-3 bg-white/10 rounded w-1/3 mb-2"></div>
            <div className="h-2 bg-white/10 rounded w-full mb-1.5"></div>
            <div className="h-2 bg-white/10 rounded w-full mb-1.5"></div>
            <div className="h-2 bg-white/10 rounded w-4/5"></div>
          </div>
        ) : wikiData && wikiData.extract ? (
          <div className="border-t border-white/10 pt-3">
            <a 
              href={wikiData.content_urls?.desktop?.page}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 mb-1.5 uppercase tracking-wider"
            >
              WIKIPEDIA DATABASE ↗
            </a>
            <p className="text-[11px] text-white/70 leading-relaxed font-sans line-clamp-4">
              {wikiData.extract}
            </p>
          </div>
        ) : null}

        {/* N2YO Database Link */}
        {object.id.startsWith('sat-') && (
          <div className={`pt-3 ${wikiData && wikiData.extract ? "mt-3 border-t border-white/10" : "border-t border-white/10 mt-3"}`}>
            <a 
              href={`https://www.n2yo.com/satellite/?s=${object.id.split('-')[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1 uppercase tracking-wider"
            >
              TRACK ON N2YO DATABASE ↗
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
