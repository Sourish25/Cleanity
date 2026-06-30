/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Compass, Loader2, MapPin } from 'lucide-react';
import L from 'leaflet';
import { Issue } from '../types';

interface InteractiveMapProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  selectedCoords: { lat: number; lng: number; address?: string } | null;
  onSelectCoords: (lat: number, lng: number, suggestedAddress: string) => void;
  cityCenter: { lat: number; lng: number };
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  issues,
  selectedIssue,
  onSelectIssue,
  selectedCoords,
  onSelectCoords,
  cityCenter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const draftMarkerRef = useRef<L.Marker | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet Map centered on the cityCenter
    const latVal = cityCenter && cityCenter.lat !== null && cityCenter.lat !== undefined ? Number(cityCenter.lat) : NaN;
    const lngVal = cityCenter && cityCenter.lng !== null && cityCenter.lng !== undefined ? Number(cityCenter.lng) : NaN;
    const centerLat = isNaN(latVal) || !isFinite(latVal) ? 40.7128 : latVal;
    const centerLng = isNaN(lngVal) || !isFinite(lngVal) ? -74.0060 : lngVal;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([centerLat, centerLng], 13);

    // Apply CARTO Voyager light-themed maps (clean, high contrast, zero gradients, minimal noise)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Place zoom controls in top-right for premium feel
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Click handler for new hazard pins
    map.on('click', async (e: L.LeafletMouseEvent) => {
      if (!e || !e.latlng) return;
      const { lat, lng } = e.latlng;
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        return;
      }
      
      setIsReverseGeocoding(true);

      let streetAddress = `Location near Coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
      try {
        // Query real Nominatim OpenStreetMap reverse geocoding
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
          {
            headers: {
              'User-Agent': 'Cleanity/1.0 (sourish25maity@gmail.com)'
            }
          }
        );
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          // Take first 3 parts (e.g. Street name, Suburb, Postcode/City) for clean, readable labeling
          streetAddress = parts.slice(0, 3).join(',').trim();
        }
      } catch (err) {
        console.warn('Reverse geocoding failed, falling back:', err);
      } finally {
        setIsReverseGeocoding(false);
      }

      onSelectCoords(lat, lng, streetAddress);
    });

    setMapInstance(map);

    return () => {
      map.off('click');
      map.remove();
      setMapInstance(null);
    };
  }, [cityCenter]);

  // Handle flying or centering Map when City or selectedIssue changes
  useEffect(() => {
    if (!mapInstance) return;

    const latVal = cityCenter && cityCenter.lat !== null && cityCenter.lat !== undefined ? Number(cityCenter.lat) : NaN;
    const lngVal = cityCenter && cityCenter.lng !== null && cityCenter.lng !== undefined ? Number(cityCenter.lng) : NaN;
    const targetCenterLat = isNaN(latVal) || !isFinite(latVal) ? 40.7128 : latVal;
    const targetCenterLng = isNaN(lngVal) || !isFinite(lngVal) ? -74.0060 : lngVal;

    if (selectedIssue) {
      const issueLat = selectedIssue.latitude !== null && selectedIssue.latitude !== undefined ? Number(selectedIssue.latitude) : NaN;
      const issueLng = selectedIssue.longitude !== null && selectedIssue.longitude !== undefined ? Number(selectedIssue.longitude) : NaN;
      if (!isNaN(issueLat) && !isNaN(issueLng) && isFinite(issueLat) && isFinite(issueLng)) {
        try {
          mapInstance.flyTo([issueLat, issueLng], 16, {
            animate: true,
            duration: 1.2,
          });
        } catch (err) {
          console.warn('Leaflet flyTo failed for selectedIssue:', err);
        }
      }
    } else {
      try {
        const currentCenter = mapInstance.getCenter();
        const currentZoom = mapInstance.getZoom();
        
        const currentLat = currentCenter ? Number(currentCenter.lat) : NaN;
        const currentLng = currentCenter ? Number(currentCenter.lng) : NaN;

        if (!isNaN(currentLat) && !isNaN(currentLng) && isFinite(currentLat) && isFinite(currentLng)) {
          const dist = Math.sqrt(
            Math.pow(currentLat - targetCenterLat, 2) + Math.pow(currentLng - targetCenterLng, 2)
          );
          // Only flyTo if the map is not currently at the city center or zoom level has changed
          if ((dist > 0.001 || currentZoom !== 13) && !isNaN(targetCenterLat) && !isNaN(targetCenterLng) && isFinite(targetCenterLat) && isFinite(targetCenterLng)) {
            mapInstance.flyTo([targetCenterLat, targetCenterLng], 13, {
              animate: true,
              duration: 1.0,
            });
          }
        } else {
          if (!isNaN(targetCenterLat) && !isNaN(targetCenterLng) && isFinite(targetCenterLat) && isFinite(targetCenterLng)) {
            mapInstance.flyTo([targetCenterLat, targetCenterLng], 13, {
              animate: true,
              duration: 1.0,
            });
          }
        }
      } catch (err) {
        console.warn('Map center checking or flying failed, falling back safely:', err);
      }
    }
  }, [mapInstance, selectedIssue, cityCenter]);

  // Update Markers when issues list changes
  useEffect(() => {
    if (!mapInstance) return;

    // Clear existing marker objects
    Object.keys(markersRef.current).forEach((id) => {
      try {
        markersRef.current[id].remove();
      } catch (err) {
        console.warn('Could not remove stale marker safely:', err);
      }
    });
    markersRef.current = {};

    // Render each active or resolved neighborhood issue as a custom styled L.divIcon marker
    issues.forEach((issue) => {
      const issueLat = issue.latitude !== null && issue.latitude !== undefined ? Number(issue.latitude) : NaN;
      const issueLng = issue.longitude !== null && issue.longitude !== undefined ? Number(issue.longitude) : NaN;
      if (isNaN(issueLat) || isNaN(issueLng) || !isFinite(issueLat) || !isFinite(issueLng)) {
        console.warn('Skipping marker rendering for issue due to invalid coordinates:', issue);
        return;
      }

      const isSelected = selectedIssue?.id === issue.id;
      
      // Compute priority-specific branding
      let pinColor = '#94a3b8'; // default
      if (issue.status === 'resolved') {
        pinColor = '#10b981'; // emerald green
      } else if (issue.priority === 'critical') {
        pinColor = '#ef4444'; // deep red
      } else if (issue.priority === 'high') {
        pinColor = '#f97316'; // orange
      } else if (issue.priority === 'medium') {
        pinColor = '#f59e0b'; // amber
      } else {
        pinColor = '#3b82f6'; // slate blue
      }

      const showPing = issue.status !== 'resolved' && (issue.priority === 'critical' || issue.priority === 'high');

      // Professional vector marker with pure CSS styling
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
            ${showPing ? `
              <span class="absolute inline-flex rounded-full opacity-35 animate-ping" style="width: 28px; height: 28px; background-color: ${pinColor};"></span>
            ` : ''}
            <div class="rounded-full shadow-lg border-2 flex items-center justify-center transition-all duration-300" 
                 style="
                   width: ${isSelected ? '20px' : '14px'}; 
                   height: ${isSelected ? '20px' : '14px'}; 
                   background-color: ${pinColor}; 
                   border-color: ${isSelected ? '#000000' : '#ffffff'};
                 "
            >
              <div class="rounded-full bg-white" style="width: ${isSelected ? '6px' : '4px'}; height: ${isSelected ? '6px' : '4px'};"></div>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      try {
        const marker = L.marker([issueLat, issueLng], { icon: customIcon })
          .addTo(mapInstance)
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            onSelectIssue(issue);
          });

        markersRef.current[issue.id] = marker;
      } catch (err) {
        console.warn('Marker creation failed safely:', err);
      }
    });
  }, [mapInstance, issues, selectedIssue]);

  // Handle draft marker (where user currently clicked to add a report)
  useEffect(() => {
    if (!mapInstance) return;

    // Remove existing draft marker
    if (draftMarkerRef.current) {
      try {
        draftMarkerRef.current.remove();
      } catch (err) {
        console.warn('Could not remove stale draft marker safely:', err);
      }
      draftMarkerRef.current = null;
    }

    if (selectedCoords) {
      const draftLat = selectedCoords.lat !== null && selectedCoords.lat !== undefined ? Number(selectedCoords.lat) : NaN;
      const draftLng = selectedCoords.lng !== null && selectedCoords.lng !== undefined ? Number(selectedCoords.lng) : NaN;
      if (isNaN(draftLat) || isNaN(draftLng) || !isFinite(draftLat) || !isFinite(draftLng)) {
        console.warn('Skipping draft marker rendering due to invalid coordinates:', selectedCoords);
        return;
      }

      const draftIcon = L.divIcon({
        className: 'custom-draft-icon',
        html: `
          <div class="relative flex flex-col items-center justify-center">
            <div class="animate-bounce" style="margin-top: -10px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" stroke="#ffffff" stroke-width="2" class="w-7 h-7 drop-shadow-md">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div class="w-2.5 h-1 bg-zinc-950/20 rounded-full blur-[1px]"></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      try {
        const marker = L.marker([draftLat, draftLng], { icon: draftIcon })
          .addTo(mapInstance);

        draftMarkerRef.current = marker;
      } catch (err) {
        console.warn('Draft marker creation failed safely:', err);
      }
      
      // Auto-center or pan to draft coordinates ONLY if they are far from the current viewport center (e.g. search-based input)
      try {
        const currentCenter = mapInstance.getCenter();
        const currentLat = currentCenter ? Number(currentCenter.lat) : NaN;
        const currentLng = currentCenter ? Number(currentCenter.lng) : NaN;
        
        if (!isNaN(currentLat) && !isNaN(currentLng) && isFinite(currentLat) && isFinite(currentLng)) {
          const dist = Math.sqrt(
            Math.pow(currentLat - draftLat, 2) + Math.pow(currentLng - draftLng, 2)
          );
          if (dist > 0.005) {
            mapInstance.panTo([draftLat, draftLng], { animate: true });
          }
        }
      } catch (err) {
        console.warn('Map panning to draft failed safely:', err);
      }
    }
  }, [mapInstance, selectedCoords]);

  return (
    <div className="relative bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] overflow-hidden group">
      {/* Header Panel details */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-sm text-zinc-900 tracking-tight flex items-center gap-1.5">
            <Compass className="h-4 w-4 text-amber-500" />
            Live Neighborhood Map
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5 leading-normal font-sans">
            Pan and click directly on the real map to pin a location and report an issue, or click markers to inspect.
          </p>
        </div>

        {(selectedCoords || isReverseGeocoding) && (
          <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-mono text-amber-700 flex items-center gap-1.5 shrink-0 shadow-xs">
            {isReverseGeocoding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>Geocoding...</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Pinned Location</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Map Container Ref */}
      <div className="relative border border-zinc-200 rounded-xl overflow-hidden shadow-inner bg-zinc-50">
        <div ref={mapContainerRef} className="w-full h-[320px] relative z-10" />
        
        {/* Real Map legends */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center py-3 bg-white border-t border-zinc-100 text-[10px] text-zinc-500 font-sans relative z-20">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: '#ef4444' }} />
            Critical Risk
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: '#f97316' }} />
            High Urgency
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: '#f59e0b' }} />
            Medium
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: '#3b82f6' }} />
            Low
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: '#10b981' }} />
            Resolved
          </div>
        </div>
      </div>
    </div>
  );
};
