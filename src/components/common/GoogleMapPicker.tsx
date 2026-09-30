import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, ExternalLink, AlertCircle } from 'lucide-react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import { LocationData, parseGoogleAddressComponents } from '../../utils/googleMaps';

export type { LocationData };

interface GoogleMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationSelect: (location: LocationData) => void;
}

export const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  initialLat = 13.7563,
  initialLng = 100.5018,
  initialAddress = '',
  onLocationSelect,
}) => {
  const [customKey, setCustomKey] = useState<string>('');
  const { isLoaded, loadError } = useGoogleMaps({ apiKey: customKey || undefined });

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat || 13.7563,
    lng: initialLng || 100.5018,
  });
  const [addressPreview, setAddressPreview] = useState<string>(initialAddress);

  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const handleReverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google?.maps?.Geocoder) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      if (status === 'OK' && results?.[0]) {
        const first = results[0];
        const parsed = parseGoogleAddressComponents(first.address_components || []);
        setAddressPreview(first.formatted_address);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          formattedAddress: first.formatted_address,
          placeId: first.place_id,
          ...parsed,
        });
      } else {
        onLocationSelect({ latitude: lat, longitude: lng });
      }
    });
  }, [onLocationSelect]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google?.maps) return;

    const initialCenter = { lat: coords.lat, lng: coords.lng };
    const map = new window.google.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;

    const marker = new window.google.maps.Marker({
      position: initialCenter,
      map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });
    markerInstanceRef.current = marker;

    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (!position) return;
      const lat = position.lat();
      const lng = position.lng();
      setCoords({ lat, lng });
      handleReverseGeocode(lat, lng);
    });

    if (searchInputRef.current && window.google.maps.places?.Autocomplete) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        componentRestrictions: { country: 'th' },
        fields: ['geometry', 'formatted_address', 'place_id', 'address_components'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newCoords = { lat, lng };

        setCoords(newCoords);
        map.setCenter(newCoords);
        marker.setPosition(newCoords);

        const parsed = parseGoogleAddressComponents(place.address_components || []);
        setAddressPreview(place.formatted_address || '');
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          formattedAddress: place.formatted_address,
          placeId: place.place_id,
          ...parsed,
        });
      });
    }
  }, [isLoaded, handleReverseGeocode]);

  return (
    <div className="space-y-2.5">
      {/* Search Bar / Places Autocomplete */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="ค้นหาชื่อสถานที่, อาคาร, โกดัง หรือที่อยู่ใน Google Maps..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
        />
      </div>

      {/* Map View Canvas or Fallback */}
      <div className="relative w-full h-[220px] rounded-lg border border-border overflow-hidden bg-bg-subtle">
        {isLoaded ? (
          <div ref={mapRef} className="w-full h-full" />
        ) : (
          <div className="p-4 h-full flex flex-col justify-center items-center text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <div className="text-xs font-semibold text-text-primary">
              {loadError === 'MISSING_API_KEY'
                ? 'ยังไม่ได้กำหนด VITE_GOOGLE_MAPS_API_KEY'
                : 'ไม่สามารถโหลด Google Maps API ได้'}
            </div>
            <div className="text-[11px] text-text-secondary max-w-sm">
              ระบุ Key ในไฟล์ <code className="bg-bg-app px-1 py-0.5 rounded font-mono">.env</code> หรือใส่ API Key ชั่วคราว:
            </div>
            <div className="flex gap-2 w-full max-w-xs">
              <input
                type="password"
                placeholder="Google Maps API Key..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs border border-border rounded bg-white font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Coordinates readout and manual adjustments */}
      <div className="bg-bg-subtle/80 p-2.5 rounded-lg border border-border flex items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2 truncate">
          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="font-mono text-text-primary font-semibold text-[11px]">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </span>
          {addressPreview && (
            <span className="text-[11px] text-text-secondary truncate border-l border-divider pl-2">
              {addressPreview}
            </span>
          )}
        </div>
        <a
          href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:text-brand-hover text-[11px] font-medium flex items-center gap-1 shrink-0"
        >
          <span>เปิดดูพิกัดจริง</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
