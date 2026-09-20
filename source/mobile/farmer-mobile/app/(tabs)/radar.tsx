import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useFarmer } from '../../src/context/FarmerContext';
import {
  calculateHaversineDistance,
  estimateTransitTimeMinutes,
  openNativeMapsNavigation,
  calculateSmartScore,
  PUNJAB_FARM_HUBS,
} from '../../src/utils/geoUtils';
import {
  MapPin,
  Compass,
  Navigation,
  Truck,
  Sparkles,
  Clock,
  Building2,
  CalendarPlus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RADAR_SIZE = Math.min(SCREEN_WIDTH - 32, 340);
const RADAR_RADIUS = RADAR_SIZE / 2;

export default function MandiRadarScreen() {
  const router = useRouter();
  const {
    centres,
    userLocation,
    setUserLocation,
    setSelectedCentreForBooking,
    activeVehicleType,
    setActiveVehicleType,
  } = useFarmer();

  const [selectedHubId, setSelectedHubId] = useState(PUNJAB_FARM_HUBS[0].id);
  const [spotlightCentreId, setSpotlightCentreId] = useState<string>(
    centres.find((c) => c.isAiRecommended)?.id || centres[0].id
  );
  const [showHubSelector, setShowHubSelector] = useState(false);

  // Compute live distances for each mandi from active location
  const centresWithGeo = useMemo(() => {
    return centres.map((centre) => {
      const distanceKm = calculateHaversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        centre.latitude,
        centre.longitude
      );
      const transitMinutes = estimateTransitTimeMinutes(
        distanceKm,
        activeVehicleType
      );
      const smartMeta = calculateSmartScore(
        distanceKm,
        centre.avgWaitMinutes,
        centre.yardCapacityPercent
      );
      return {
        ...centre,
        liveDistanceKm: distanceKm,
        transitMinutes,
        smartScore: smartMeta.score,
        badge: smartMeta.badge,
        badgeColor: smartMeta.color,
        badgeReason: smartMeta.reason,
      };
    }).sort((a, b) => a.smartScore - b.smartScore);
  }, [centres, userLocation, activeVehicleType]);

  const spotlightCentre =
    centresWithGeo.find((c) => c.id === spotlightCentreId) || centresWithGeo[0];

  const handleSelectHub = (hub: (typeof PUNJAB_FARM_HUBS)[0]) => {
    setSelectedHubId(hub.id);
    setUserLocation({
      latitude: hub.latitude,
      longitude: hub.longitude,
      source: 'MANUAL_SELECTION',
      locationName: hub.name,
    });
    setShowHubSelector(false);
  };

  const handleBookAtCentre = (centreId: string) => {
    setSelectedCentreForBooking(centreId);
    router.push('/(tabs)/book');
  };

  // Convert GPS coordinates to radar (x, y) relative to userLocation
  // Maximum radius representation = 50 km
  const maxRadiusKm = 45;
  const getRadarPoint = (lat: number, lon: number) => {
    const dLat = (lat - userLocation.latitude) * 111; // ~111 km per degree latitude
    const dLon =
      (lon - userLocation.longitude) *
      111 *
      Math.cos((userLocation.latitude * Math.PI) / 180);

    // Map km to radar pixels from center
    const scale = (RADAR_RADIUS - 28) / maxRadiusKm;
    const x = dLon * scale;
    const y = -dLat * scale; // Inverted for screen coordinates

    // Clamp inside radar boundary
    const dist = Math.sqrt(x * x + y * y);
    if (dist > RADAR_RADIUS - 16) {
      const angle = Math.atan2(y, x);
      return {
        x: Math.cos(angle) * (RADAR_RADIUS - 22),
        y: Math.sin(angle) * (RADAR_RADIUS - 22),
      };
    }
    return { x, y };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header & GPS Status Bar */}
      <View style={styles.topBar}>
        <View>
          <View style={styles.gpsPill}>
            <View style={styles.pingDot} />
            <Text style={styles.gpsPillText}>
              {userLocation.source === 'GPS_LIVE'
                ? 'GPS Signal Locked'
                : 'Punjab Agricultural Belt'}
            </Text>
          </View>
          <Text style={styles.headerTitle}>Nearby Mandi Radar</Text>
          <Text style={styles.headerSubtitle}>
            Origin: {userLocation.locationName || 'Samrala Agri Zone'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.switchHubBtn}
          onPress={() => setShowHubSelector(!showHubSelector)}
        >
          <Compass size={16} color="#10B981" />
          <Text style={styles.switchHubText}>Hubs</Text>
        </TouchableOpacity>
      </View>

      {/* Hub Dropdown Selector */}
      {showHubSelector && (
        <View style={styles.hubDropdown}>
          <Text style={styles.hubDropdownTitle}>Select Agricultural Base:</Text>
          {PUNJAB_FARM_HUBS.map((hub) => (
            <TouchableOpacity
              key={hub.id}
              style={[
                styles.hubItem,
                selectedHubId === hub.id && styles.hubItemActive,
              ]}
              onPress={() => handleSelectHub(hub)}
            >
              <View>
                <Text
                  style={[
                    styles.hubItemName,
                    selectedHubId === hub.id && styles.hubItemNameActive,
                  ]}
                >
                  {hub.name}
                </Text>
                <Text style={styles.hubItemPunjabi}>{hub.punjabiName}</Text>
              </View>
              {selectedHubId === hub.id && (
                <View style={styles.activeCheckDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Vehicle Type Selector Chips */}
      <View style={styles.vehicleRow}>
        {(['Tractor Trolley', 'Mini Truck', 'Bullock Cart'] as const).map(
          (vType) => {
            const isSelected = activeVehicleType === vType;
            return (
              <TouchableOpacity
                key={vType}
                style={[
                  styles.vehicleChip,
                  isSelected && styles.vehicleChipActive,
                ]}
                onPress={() => setActiveVehicleType(vType)}
              >
                <Truck
                  size={14}
                  color={isSelected ? '#064E3B' : '#64748B'}
                />
                <Text
                  style={[
                    styles.vehicleChipText,
                    isSelected && styles.vehicleChipTextActive,
                  ]}
                >
                  {vType === 'Tractor Trolley'
                    ? 'Tractor (25k)'
                    : vType === 'Mini Truck'
                    ? 'Truck (40k)'
                    : 'Cart (8k)'}
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </View>

      {/* 360° Native SVG Radar Canvas */}
      <View style={styles.radarCard}>
        <Svg
          width={RADAR_SIZE}
          height={RADAR_SIZE}
          viewBox={`${-RADAR_RADIUS} ${-RADAR_RADIUS} ${RADAR_SIZE} ${RADAR_SIZE}`}
        >
          {/* Radar Background & Range Rings */}
          <Circle
            cx={0}
            cy={0}
            r={RADAR_RADIUS - 4}
            fill="#0F172A"
            stroke="#1E293B"
            strokeWidth={2}
          />
          <Circle
            cx={0}
            cy={0}
            r={(RADAR_RADIUS - 28) * 0.33}
            fill="none"
            stroke="#1E293B"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <Circle
            cx={0}
            cy={0}
            r={(RADAR_RADIUS - 28) * 0.66}
            fill="none"
            stroke="#1E293B"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <Circle
            cx={0}
            cy={0}
            r={RADAR_RADIUS - 28}
            fill="none"
            stroke="#334155"
            strokeWidth={1}
          />

          {/* Radar Axes */}
          <Line
            x1={-RADAR_RADIUS + 12}
            y1={0}
            x2={RADAR_RADIUS - 12}
            y2={0}
            stroke="#1E293B"
            strokeWidth={1}
          />
          <Line
            x1={0}
            y1={-RADAR_RADIUS + 12}
            x2={0}
            y2={RADAR_RADIUS - 12}
            stroke="#1E293B"
            strokeWidth={1}
          />

          {/* Compass Markers */}
          <SvgText
            x={0}
            y={-RADAR_RADIUS + 18}
            fill="#10B981"
            fontSize={10}
            fontWeight="bold"
            textAnchor="middle"
          >
            N
          </SvgText>
          <SvgText
            x={0}
            y={RADAR_RADIUS - 10}
            fill="#64748B"
            fontSize={9}
            textAnchor="middle"
          >
            S
          </SvgText>
          <SvgText
            x={RADAR_RADIUS - 12}
            y={3}
            fill="#64748B"
            fontSize={9}
            textAnchor="end"
          >
            E
          </SvgText>
          <SvgText
            x={-RADAR_RADIUS + 12}
            y={3}
            fill="#64748B"
            fontSize={9}
            textAnchor="start"
          >
            W
          </SvgText>

          {/* Range Labels */}
          <SvgText
            x={4}
            y={-(RADAR_RADIUS - 28) * 0.33 + 10}
            fill="#475569"
            fontSize={8}
            textAnchor="start"
          >
            15km
          </SvgText>
          <SvgText
            x={4}
            y={-(RADAR_RADIUS - 28) * 0.66 + 10}
            fill="#475569"
            fontSize={8}
            textAnchor="start"
          >
            30km
          </SvgText>
          <SvgText
            x={4}
            y={-(RADAR_RADIUS - 28) + 10}
            fill="#475569"
            fontSize={8}
            textAnchor="start"
          >
            45km
          </SvgText>

          {/* Center Origin: Farmer Marker */}
          <Circle cx={0} cy={0} r={9} fill="#065F46" />
          <Circle cx={0} cy={0} r={4.5} fill="#10B981" />

          {/* Mandi Nodes */}
          {centresWithGeo.map((centre) => {
            const pt = getRadarPoint(centre.latitude, centre.longitude);
            const isSpotlight = centre.id === spotlightCentreId;
            const nodeColor =
              centre.yardCapacityPercent < 50
                ? '#10B981'
                : centre.yardCapacityPercent < 80
                ? '#F59E0B'
                : '#EF4444';

            return (
              <G key={centre.id}>
                {isSpotlight && (
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={15}
                    fill={nodeColor}
                    fillOpacity={0.25}
                    stroke={nodeColor}
                    strokeWidth={1.5}
                  />
                )}
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSpotlight ? 7 : 5.5}
                  fill={nodeColor}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
              </G>
            );
          })}
        </Svg>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Fast Queue (&lt;45%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Moderate (45-80%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Bottleneck (&gt;80%)</Text>
          </View>
        </View>
      </View>

      {/* Spotlight Card */}
      <View style={styles.spotlightCard}>
        <View style={styles.spotlightHeader}>
          <View style={styles.spotlightTitleRow}>
            <Building2 size={18} color="#065F46" />
            <Text style={styles.spotlightName}>{spotlightCentre.name}</Text>
          </View>
          {spotlightCentre.isAiRecommended && (
            <View style={styles.aiBadge}>
              <Sparkles size={11} color="#78350F" />
              <Text style={styles.aiBadgeText}>AI TOP PICK</Text>
            </View>
          )}
        </View>

        <Text style={styles.spotlightAddress}>{spotlightCentre.address}</Text>

        {/* Dynamic Metric Grid */}
        <View style={styles.metricGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Distance</Text>
            <Text style={styles.metricValue}>
              {spotlightCentre.liveDistanceKm} km
            </Text>
            <Text style={styles.metricSub}>From Farm Hub</Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Transit Time</Text>
            <Text style={styles.metricValue}>
              ~{spotlightCentre.transitMinutes} mins
            </Text>
            <Text style={styles.metricSub}>via {activeVehicleType}</Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Queue Wait</Text>
            <Text style={styles.metricValue}>
              {spotlightCentre.avgWaitMinutes} mins
            </Text>
            <Text style={styles.metricSub}>
              {spotlightCentre.currentQueueCount} trolleys
            </Text>
          </View>
        </View>

        {/* AI Factor Reason */}
        <View style={styles.reasonBox}>
          <Sparkles size={13} color="#059669" />
          <Text style={styles.reasonText}>{spotlightCentre.badgeReason}</Text>
        </View>

        {/* 2 Primary Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() =>
              openNativeMapsNavigation(
                spotlightCentre.latitude,
                spotlightCentre.longitude,
                spotlightCentre.name
              )
            }
          >
            <Navigation size={15} color="#0F172A" />
            <Text style={styles.navBtnText}>Turn-by-Turn GPS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => handleBookAtCentre(spotlightCentre.id)}
          >
            <CalendarPlus size={15} color="#FFFFFF" />
            <Text style={styles.bookBtnText}>Book Slot Here</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Full Mandi List */}
      <Text style={styles.listSectionTitle}>All Available Mandi Centres</Text>
      {centresWithGeo.map((centre) => {
        const isSelected = centre.id === spotlightCentreId;
        return (
          <TouchableOpacity
            key={centre.id}
            style={[styles.mandiCard, isSelected && styles.mandiCardActive]}
            onPress={() => setSpotlightCentreId(centre.id)}
          >
            <View style={styles.mandiCardTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.mandiTitleRow}>
                  <Text style={styles.mandiName}>{centre.name}</Text>
                  {centre.isAiRecommended && (
                    <View style={styles.miniAiBadge}>
                      <Text style={styles.miniAiText}>AI Pick</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.mandiSub}>
                  {centre.liveDistanceKm} km away • ~{centre.transitMinutes} mins
                  drive
                </Text>
              </View>

              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor:
                      centre.yardCapacityPercent < 50
                        ? '#ECFDF5'
                        : centre.yardCapacityPercent < 80
                        ? '#FFFBEB'
                        : '#FEF2F2',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    {
                      color:
                        centre.yardCapacityPercent < 50
                          ? '#065F46'
                          : centre.yardCapacityPercent < 80
                          ? '#92400E'
                          : '#991B1B',
                    },
                  ]}
                >
                  {centre.yardCapacityPercent}% Load
                </Text>
              </View>
            </View>

            <View style={styles.mandiCardBottom}>
              <Text style={styles.mandiBays}>
                {centre.activeBays} Active Weighbridges • Current Wait: ~
                {centre.avgWaitMinutes}m
              </Text>
              <ArrowRight size={14} color="#64748B" />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  gpsPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  switchHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 4,
  },
  switchHubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  hubDropdown: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hubDropdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
  },
  hubItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  hubItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  hubItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  hubItemNameActive: {
    color: '#34D399',
    fontWeight: '800',
  },
  hubItemPunjabi: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  activeCheckDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  vehicleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  vehicleChipActive: {
    backgroundColor: '#A7F3D0',
    borderColor: '#10B981',
  },
  vehicleChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  vehicleChipTextActive: {
    color: '#064E3B',
    fontWeight: '800',
  },
  radarCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
  },
  spotlightCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    marginBottom: 20,
  },
  spotlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  spotlightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  spotlightName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#78350F',
  },
  spotlightAddress: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 12,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34D399',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 8,
    borderRadius: 10,
    gap: 6,
    marginBottom: 14,
  },
  reasonText: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '600',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E2E8F0',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mandiCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  mandiCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#1F2E45',
  },
  mandiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  mandiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mandiName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  miniAiBadge: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniAiText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#78350F',
  },
  mandiSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  mandiCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 6,
  },
  mandiBays: {
    fontSize: 10,
    color: '#64748B',
  },
});
