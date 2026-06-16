import type { CityInfo, MapAnimalMarker, MapPoiItem } from '@pet/shared';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimalMarkerView } from '@/components/map/AnimalMarker';
import { AnimalPeekSheet } from '@/components/map/AnimalPeekSheet';
import { MapHeader } from '@/components/map/MapHeader';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetchCities, fetchMapAnimals, fetchMapPois, regionToBbox } from '@/lib/api';
import { tokens } from '@/theme/tokens';

const DEFAULT_REGION: Region = {
  latitude: 39.9042,
  longitude: 116.4074,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function deltaFromZoom(zoom: number): number {
  return 360 / Math.pow(2, zoom);
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [city, setCity] = useState<CityInfo | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [animals, setAnimals] = useState<MapAnimalMarker[]>([]);
  const [pois, setPois] = useState<MapPoiItem[]>([]);
  const [showPois, setShowPois] = useState(true);
  const [selected, setSelected] = useState<MapAnimalMarker | null>(null);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState('');

  const debouncedRegion = useDebouncedValue(region, 400);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const res = await fetchCities();
        if (!mounted) return;

        setCities(res.data);
        const initial = res.data.find((c) => c.code === 'beijing') ?? res.data[0];
        if (initial) {
          setCity(initial);
          const delta = deltaFromZoom(initial.zoom);
          setRegion({
            latitude: initial.centerLat,
            longitude: initial.centerLng,
            latitudeDelta: delta,
            longitudeDelta: delta,
          });
        }

        if (Platform.OS !== 'web') {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const current = await Location.getCurrentPositionAsync({});
            mapRef.current?.animateToRegion(
              {
                latitude: current.coords.latitude,
                longitude: current.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              },
              600,
            );
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : '初始化失败');
        }
      } finally {
        if (mounted) setBooting(false);
      }
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const loadAnimals = useCallback(async (nextRegion: Region, cityCode?: string) => {
    setLoading(true);
    setError('');
    try {
      const bbox = regionToBbox(nextRegion);
      const [animalRes, poiRes] = await Promise.all([
        fetchMapAnimals({ bbox, cityCode }),
        showPois ? fetchMapPois({ bbox, cityCode }) : Promise.resolve({ data: [] }),
      ]);
      setAnimals(animalRes.data);
      setPois(poiRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载地图数据失败');
    } finally {
      setLoading(false);
    }
  }, [showPois]);

  useEffect(() => {
    if (booting) return;
    void loadAnimals(debouncedRegion, city?.code);
  }, [booting, debouncedRegion, city?.code, loadAnimals, showPois]);

  const handleCityChange = useCallback((nextCity: CityInfo) => {
    setCity(nextCity);
    setSelected(null);
    const delta = deltaFromZoom(nextCity.zoom);
    const nextRegion: Region = {
      latitude: nextCity.centerLat,
      longitude: nextCity.centerLng,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 500);
  }, []);

  const poiMarkers = useMemo(
    () =>
      pois.map((poi) => (
        <Marker
          key={`poi-${poi.id}`}
          coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
          pinColor={
            poi.type === 'station'
              ? '#2A9D8F'
              : poi.type === 'volunteer'
                ? '#457B9D'
                : '#E9C46A'
          }
          title={poi.name}
          description={poi.description ?? undefined}
        />
      )),
    [pois],
  );

  const markers = useMemo(
    () =>
      animals.map((animal) => (
        <Marker
          key={animal.id}
          coordinate={{
            latitude: animal.latitude,
            longitude: animal.longitude,
          }}
          onPress={() => setSelected(animal)}
          tracksViewChanges={false}
        >
          <AnimalMarkerView
            species={animal.species}
            status={animal.status}
            selected={selected?.id === animal.id}
          />
        </Marker>
      )),
    [animals, selected?.id],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={DEFAULT_REGION}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsMyLocationButton={Platform.OS === 'android'}
        >
          {markers}
          {showPois ? poiMarkers : null}
        </MapView>

        <MapHeader
          city={city}
          cities={cities}
          loading={loading}
          animalCount={animals.length}
          poiCount={pois.length}
          showPois={showPois}
          onTogglePois={() => setShowPois((v) => !v)}
          onCityChange={handleCityChange}
        />

        {booting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={tokens.color.primary} size="large" />
          </View>
        )}
      </View>

      {error ? (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <AnimalPeekSheet animal={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.background,
  },
  mapWrap: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,247,242,0.35)',
  },
  errorBar: {
    marginHorizontal: tokens.spacing[4],
    marginBottom: tokens.spacing[2],
    padding: tokens.spacing[3],
    borderRadius: tokens.radius.md,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: tokens.color.destructive,
    fontSize: 13,
  },
});
