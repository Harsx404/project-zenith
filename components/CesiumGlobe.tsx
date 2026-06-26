"use client";

import React, { useMemo, useRef, useEffect } from 'react';
import { Viewer, Entity, PointGraphics, LabelGraphics, CameraFlyTo, PolylineGraphics, BillboardGraphics, EllipseGraphics } from 'resium';
import * as Cesium from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import { CelestialObject } from '@/lib/types/celestial';
import * as satellite from 'satellite.js';

// Configure Cesium
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium';
}
Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_TOKEN || '';

interface CesiumGlobeProps {
  objects: CelestialObject[];
  onSelectObject: (obj: CelestialObject) => void;
  selectedObjectId?: string;
  observerLat: number;
  observerLng: number;
}

const getIconUrl = (type: string) => {
  if (type === 'Planet' || type === 'Constellation') {
    return '/sm_planet.png';
  }
  if (type === 'ISS') {
    return '/sm_space-station.png';
  }
  return '/sm_satellite.png';
};

function CelestialEntity({ 
  obj, 
  positionProp, 
  isSelected, 
  onSelectObject 
}: { 
  obj: CelestialObject, 
  positionProp: Cesium.SampledPositionProperty | Cesium.Cartesian3,
  isSelected: boolean,
  onSelectObject: (obj: CelestialObject) => void
}) {
  const isISS = obj.type === "ISS";
  const isPlanet = obj.type === "Planet";
  const isConstellation = obj.type === "Constellation";
  
  // High-contrast tactical colors
  let color = Cesium.Color.CYAN;
  if (isSelected) {
    color = Cesium.Color.DEEPSKYBLUE;
  } else if (isISS) {
    color = Cesium.Color.GOLD;
  } else if (isPlanet) {
    color = Cesium.Color.ORANGERED;
  } else if (isConstellation) {
    color = Cesium.Color.LIGHTGRAY;
  }

  // Dynamic Plumb Line (Drop Line to surface)
  const dropLinePositions = useMemo(() => {
    if (!positionProp || typeof (positionProp as any).getValue !== 'function') return undefined;
    return new Cesium.CallbackProperty((time, result) => {
      try {
        const satPos = (positionProp as any).getValue(time);
        if (!satPos) return [Cesium.Cartesian3.ZERO, Cesium.Cartesian3.UNIT_X];
        
        const cartographic = Cesium.Cartographic.fromCartesian(satPos);
        if (!cartographic) return [Cesium.Cartesian3.ZERO, Cesium.Cartesian3.UNIT_X];
        
        const surfacePos = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0);
        return [satPos, surfacePos];
      } catch (e) {
        return [Cesium.Cartesian3.ZERO, Cesium.Cartesian3.UNIT_X];
      }
    }, false);
  }, [positionProp]);

  const iconUrl = useMemo(() => getIconUrl(obj.type), [obj.type]);
  const labelOffset = useMemo(() => new Cesium.Cartesian2(30, 0), []);
  const dummyPositions = useMemo(() => [Cesium.Cartesian3.ZERO, Cesium.Cartesian3.UNIT_X], []);

  const dropLineMaterial = useMemo(() => new Cesium.PolylineDashMaterialProperty({
    color: Cesium.Color.WHITE.withAlpha(0.5),
    dashLength: 16.0,
  }), []);

  return (
    <Entity
      id={obj.id}
      key={obj.id}
      position={positionProp as any}
      onClick={() => onSelectObject(obj)}
    >
      <BillboardGraphics 
        image={iconUrl}
        scale={isSelected ? 0.35 : isPlanet ? 0.3 : 0.25}
      />
      
      {/* Sci-Fi Minimalist Label */}
      <LabelGraphics 
        text={obj.name.toUpperCase()}
        font="bold 16px 'Courier New', monospace"
        scale={1.0} 
        fillColor={color}
        style={Cesium.LabelStyle.FILL_AND_OUTLINE}
        outlineColor={Cesium.Color.BLACK}
        outlineWidth={3}
        pixelOffset={labelOffset}
        horizontalOrigin={Cesium.HorizontalOrigin.LEFT}
        show={true}
        showBackground={false}
      />

      {/* Surface Drop Line (Plumb line) */}
      <PolylineGraphics
        show={!!dropLinePositions && isSelected}
        positions={(dropLinePositions || dummyPositions) as any}
        width={1}
        material={dropLineMaterial}
      />
    </Entity>
  );
}

export default function CesiumGlobe({ objects, onSelectObject, selectedObjectId, observerLat, observerLng }: CesiumGlobeProps) {
  
  const visibleObjects = objects;
  const positionProperties = useRef<Record<string, Cesium.SampledPositionProperty>>({});

  useEffect(() => {
    visibleObjects.forEach(obj => {
      if (!positionProperties.current[obj.id]) {
        if (obj.tleLine1 && obj.tleLine2) {
          try {
            const satrec = satellite.twoline2satrec(obj.tleLine1, obj.tleLine2);
            const prop = new Cesium.CallbackProperty((time: Cesium.JulianDate | undefined, result: Cesium.Cartesian3 | undefined) => {
              try {
                if (!time) return result || new Cesium.Cartesian3();
                // HIGH PRECISION TIME ARITHMETIC
                // Cesium uses two components (dayNumber and secondsOfDay) to avoid IEEE 754 float precision loss.
                // If we add them together into a single Julian Date float (~2.4 million), we lose sub-millisecond precision, causing camera jitter.
                // To fix this, we compute the differences BEFORE combining them!

                // 1. Calculate precise minutes since epoch
                const epochDay = Math.floor(satrec.jdsatepoch);
                const epochFraction = satrec.jdsatepoch - epochDay;
                const daysDiff = (time.dayNumber - epochDay) + (time.secondsOfDay / 86400.0 - epochFraction);
                const minutesSinceEpoch = daysDiff * 1440.0;
                
                const pv = satellite.sgp4(satrec, minutesSinceEpoch);
                
                if (pv && pv.position && typeof pv.position !== 'boolean') {
                  // 2. Calculate precise GMST
                  // J2000 epoch is exactly Julian Day 2451545.0
                  const daysSinceJ2000 = (time.dayNumber - 2451545.0) + (time.secondsOfDay / 86400.0);
                  const tut1 = daysSinceJ2000 / 36525.0;
                  
                  let temp = -6.2e-6 * tut1 * tut1 * tut1 + 0.093104 * tut1 * tut1 + (876600.0 * 3600 + 8640184.812866) * tut1 + 67310.54841;
                  temp = (temp * (Math.PI / 180.0)) / 240.0;
                  temp = temp % (2 * Math.PI);
                  if (temp < 0) temp += 2 * Math.PI;
                  const gmst = temp;

                  const posGd = satellite.eciToGeodetic(pv.position as satellite.EciVec3<number>, gmst);
                  return Cesium.Cartesian3.fromRadians(posGd.longitude, posGd.latitude, posGd.height * 1000, Cesium.Ellipsoid.WGS84, result);
                }
              } catch (e) {}
              
              let renderAlt = (obj.distanceKm || 0) > 0 ? (obj.distanceKm! * 1000) : 5000000;
              return Cesium.Cartesian3.fromDegrees(obj.longitude || 0, obj.latitude || 0, renderAlt, Cesium.Ellipsoid.WGS84, result);
            }, false);
            
            positionProperties.current[obj.id] = prop as any;
          } catch(e) {}
        } else {
          const prop = new Cesium.SampledPositionProperty();
          prop.forwardExtrapolationType = Cesium.ExtrapolationType.EXTRAPOLATE;
          prop.backwardExtrapolationType = Cesium.ExtrapolationType.EXTRAPOLATE;
          positionProperties.current[obj.id] = prop;
        }
      }

      if (!obj.tleLine1 && positionProperties.current[obj.id] && (positionProperties.current[obj.id] as any).addSample) {
        const prop = positionProperties.current[obj.id] as Cesium.SampledPositionProperty;
        const time = Cesium.JulianDate.fromDate(new Date(obj.lastUpdated));
        let renderAlt = (obj.distanceKm || 0) > 0 ? (obj.distanceKm! * 1000) : 5000000;
        const position = Cesium.Cartesian3.fromDegrees(obj.longitude || 0, obj.latitude || 0, renderAlt);
        
        try {
          prop.addSample(time, position);
        } catch (e) {}
      }
    });
  }, [visibleObjects]);

  const cameraDestination = useMemo(() => {
    return Cesium.Cartesian3.fromDegrees(observerLng, observerLat, 5000000);
  }, [observerLat, observerLng]);

  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (viewerRef.current && viewerRef.current.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      
      // APPLY TACTICAL MAP STYLING
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.atmosphereBrightnessShift = 0.4; // Brighter atmospheric glow
      viewer.scene.globe.atmosphereHueShift = 0.5; // Shift atmosphere to deeper blue
      
      const imageryLayer = viewer.imageryLayers.get(0);
      if (imageryLayer) {
        // Darken and color-shift the default earth imagery to look like a tactical radar
        imageryLayer.brightness = 0.15;
        imageryLayer.contrast = 1.8;
        imageryLayer.hue = 3.2; 
        imageryLayer.saturation = 0.1;
      }

      let isInteracting = false;
      const canvas = viewer.scene.canvas;

      const onInteractionStart = () => { isInteracting = true; };
      const onInteractionEnd = () => { isInteracting = false; };
      const onWheel = () => {
        isInteracting = true;
        clearTimeout((canvas as any).wheelTimeout);
        (canvas as any).wheelTimeout = setTimeout(() => { isInteracting = false; }, 1000);
      };

      canvas.addEventListener('pointerdown', onInteractionStart);
      window.addEventListener('pointerup', onInteractionEnd);
      canvas.addEventListener('wheel', onWheel);

      const onTick = () => {
        if (!isInteracting && !viewer.trackedEntity) {
          viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.0005);
        }
      };
      
      viewer.clock.onTick.addEventListener(onTick);
      
      return () => {
        canvas.removeEventListener('pointerdown', onInteractionStart);
        window.removeEventListener('pointerup', onInteractionEnd);
        canvas.removeEventListener('wheel', onWheel);
        if (!viewer.isDestroyed()) {
          viewer.clock.onTick.removeEventListener(onTick);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      if (selectedObjectId) {
        if (!viewer.trackedEntity || viewer.trackedEntity.id !== selectedObjectId) {
          const checkEntity = () => {
            if (!viewer.isDestroyed()) {
              const entity = viewer.entities.getById(selectedObjectId);
              if (entity) {
                viewer.trackedEntity = entity;
              } else {
                setTimeout(checkEntity, 50);
              }
            }
          };
          checkEntity();
        }
      } else {
        viewer.trackedEntity = undefined;
        viewer.camera.flyTo({
          destination: cameraDestination,
          orientation: {
            heading: 0.0,
            pitch: Cesium.Math.toRadians(-90.0),
            roll: 0.0,
          },
          duration: 0.8
        });
      }
    }
  }, [selectedObjectId, cameraDestination]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020412]">

      <Viewer 
        ref={viewerRef}
        full 
        timeline={false} 
        animation={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        baseLayerPicker={false}
        navigationHelpButton={false}
        infoBox={false}
        selectionIndicator={false}
        scene3DOnly={true}
        resolutionScale={typeof window !== 'undefined' ? window.devicePixelRatio : 1.0}
        className="cesium-viewer"
        style={{ width: '100%', height: '100%' }}
        shouldAnimate={true}
      >
        <CameraFlyTo 
          destination={cameraDestination} 
          orientation={{
            heading: 0.0,
            pitch: Cesium.Math.toRadians(-90.0),
            roll: 0.0,
          }}
          duration={0}
          once={true}
        />

        {/* User Location Marker */}
        <Entity position={Cesium.Cartesian3.fromDegrees(observerLng, observerLat, 0)}>
          <PointGraphics 
            pixelSize={12} 
            color={Cesium.Color.RED} 
            outlineColor={Cesium.Color.WHITE} 
            outlineWidth={3} 
            disableDepthTestDistance={Number.POSITIVE_INFINITY} 
            heightReference={Cesium.HeightReference.CLAMP_TO_GROUND} 
          />
          <LabelGraphics 
            text="OBSERVER" 
            font="bold 14px 'Courier New', monospace" 
            fillColor={Cesium.Color.RED}
            style={Cesium.LabelStyle.FILL_AND_OUTLINE}
            outlineColor={Cesium.Color.BLACK}
            outlineWidth={4}
            pixelOffset={new Cesium.Cartesian2(0, -25)}
            heightReference={Cesium.HeightReference.CLAMP_TO_GROUND}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
            showBackground={false}
          />
          
          {/* Tactical Ground Radar Circle instead of a massive cone */}
          <EllipseGraphics
            semiMajorAxis={1500000.0} // 1500km radius Zenith Zone
            semiMinorAxis={1500000.0}
            material={new Cesium.ColorMaterialProperty(Cesium.Color.CYAN.withAlpha(0.1))}
            outline={true}
            outlineColor={Cesium.Color.CYAN.withAlpha(0.6)}
            outlineWidth={3}
            heightReference={Cesium.HeightReference.CLAMP_TO_GROUND}
          />
        </Entity>

        {/* Satellites and Celestial Objects */}
        {visibleObjects.map((obj) => {
          let renderAlt = (obj.distanceKm || 0) > 0 ? (obj.distanceKm! * 1000) : 5000000;
          if (obj.tleLine1 && obj.tleLine2) {
            try {
              const satrec = satellite.twoline2satrec(obj.tleLine1, obj.tleLine2);
              const pv = satellite.propagate(satrec, new Date(obj.lastUpdated));
              if (pv && pv.position && typeof pv.position !== 'boolean') {
                const gmst = satellite.gstime(new Date(obj.lastUpdated));
                const posGd = satellite.eciToGeodetic(pv.position as satellite.EciVec3<number>, gmst);
                renderAlt = posGd.height * 1000;
              }
            } catch(e) {}
          }

          const fallbackPosition = Cesium.Cartesian3.fromDegrees(obj.longitude || 0, obj.latitude || 0, renderAlt);
          const positionProp = positionProperties.current[obj.id] || fallbackPosition;

          return (
            <CelestialEntity
              key={obj.id}
              obj={obj}
              positionProp={positionProp}
              isSelected={obj.id === selectedObjectId}
              onSelectObject={onSelectObject}
            />
          );
        })}
      </Viewer>
    </div>
  );
}
