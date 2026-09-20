import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFarmer } from '../../src/context/FarmerContext';
import {
  ShieldCheck,
  CalendarCheck,
  MapPin,
  QrCode,
  Truck,
  ArrowRight,
  TrendingUp,
  LandPlot,
  Building2,
  Clock,
  Banknote,
  CheckCircle2,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const { farmer, centres, activeToken, tokens } = useFarmer();

  const nearestCentre = centres[0];
  const totalBags = activeToken ? activeToken.totalBags : 90;
  const estimatedPayout = activeToken ? activeToken.payoutAmount || 102375 : 102375;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome & Farmer Profile Card */}
      <View style={styles.heroCard}>
        <View style={styles.verifiedPill}>
          <ShieldCheck size={13} color="#34D399" />
          <Text style={styles.verifiedText}>Aadhaar & PM-KISAN Verified</Text>
        </View>

        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.farmerName}>{farmer.name}</Text>
        <Text style={styles.farmerSub}>
          {farmer.village} • {farmer.landAcres} Acres
        </Text>

        <View style={styles.kisanIdRow}>
          <Text style={styles.kisanIdLabel}>KISAN CARD ID:</Text>
          <View style={styles.kisanIdBadge}>
            <Text style={styles.kisanIdText}>{farmer.farmerId}</Text>
          </View>
        </View>
      </View>

      {/* Quick Stat Metric Grid (2x2) */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={styles.statBox}
          onPress={() => router.push('/(tabs)/epass')}
        >
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <QrCode size={18} color="#10B981" />
          </View>
          <Text style={styles.statLabel}>Active Gate Pass</Text>
          <Text style={styles.statValue}>
            {activeToken ? activeToken.tokenNumber : 'None'}
          </Text>
          <Text style={styles.statSub}>
            {activeToken ? activeToken.status : 'Tap to book'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statBox}
          onPress={() => router.push('/(tabs)/radar')}
        >
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <MapPin size={18} color="#38BDF8" />
          </View>
          <Text style={styles.statLabel}>Nearest Mandi</Text>
          <Text style={styles.statValue}>{nearestCentre.distanceKm} km</Text>
          <Text style={styles.statSub}>{nearestCentre.name}</Text>
        </TouchableOpacity>

        <View style={styles.statBox}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Banknote size={18} color="#F59E0B" />
          </View>
          <Text style={styles.statLabel}>Guaranteed MSP</Text>
          <Text style={styles.statValue}>₹{(estimatedPayout / 1000).toFixed(1)}k</Text>
          <Text style={styles.statSub}>Direct to {farmer.bankName}</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
            <LandPlot size={18} color="#A855F7" />
          </View>
          <Text style={styles.statLabel}>Registered Land</Text>
          <Text style={styles.statValue}>{farmer.landAcres} Ac</Text>
          <Text style={styles.statSub}>Tehsil Samrala</Text>
        </View>
      </View>

      {/* Active Token Spotlight Action Card */}
      {activeToken && (
        <TouchableOpacity
          style={styles.activePassBanner}
          onPress={() => router.push('/(tabs)/epass')}
        >
          <View style={styles.activePassHeader}>
            <View style={styles.activePassBadge}>
              <Text style={styles.activePassBadgeText}>LIVE GATE PASS</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor:
                    activeToken.status === 'COMPLETED'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : activeToken.status === 'ARRIVED'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(56, 189, 248, 0.2)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color:
                      activeToken.status === 'COMPLETED'
                        ? '#34D399'
                        : activeToken.status === 'ARRIVED'
                        ? '#FBBF24'
                        : '#38BDF8',
                  },
                ]}
              >
                {activeToken.status}
              </Text>
            </View>
          </View>

          <View style={styles.activePassBody}>
            <View style={{ flex: 1 }}>
              <Text style={styles.activePassCrop}>
                {activeToken.cropName} • {activeToken.estimatedQuintals} Qtl ({totalBags} Bags)
              </Text>
              <Text style={styles.activePassCentre}>
                {activeToken.centreName} • {activeToken.slotTime}
              </Text>
              <Text style={styles.activePassVehicle}>
                Vehicle: <Text style={{ color: '#FCD34D' }}>{activeToken.vehicleNumber}</Text> ({activeToken.vehicleType})
              </Text>
            </View>

            <View style={styles.qrIconBox}>
              <QrCode size={36} color="#10B981" />
              <Text style={styles.qrScanLabel}>View QR</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Navigation Action Buttons */}
      <Text style={styles.sectionHeader}>Quick Actions</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
          onPress={() => router.push('/(tabs)/book')}
        >
          <CalendarCheck size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Book New Slot</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' }]}
          onPress={() => router.push('/(tabs)/radar')}
        >
          <MapPin size={18} color="#34D399" />
          <Text style={[styles.actionBtnText, { color: '#E2E8F0' }]}>Mandi Radar</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Bookings List */}
      <Text style={styles.sectionHeader}>Your Procurement Bookings</Text>
      {tokens.map((tok) => (
        <TouchableOpacity
          key={tok.id}
          style={styles.bookingCard}
          onPress={() => router.push('/(tabs)/epass')}
        >
          <View style={styles.bookingCardTop}>
            <Text style={styles.bookingToken}>{tok.tokenNumber}</Text>
            <View
              style={[
                styles.miniStatusBadge,
                {
                  backgroundColor:
                    tok.status === 'COMPLETED'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : tok.status === 'ARRIVED'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(56, 189, 248, 0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.miniStatusText,
                  {
                    color:
                      tok.status === 'COMPLETED'
                        ? '#34D399'
                        : tok.status === 'ARRIVED'
                        ? '#FBBF24'
                        : '#38BDF8',
                  },
                ]}
              >
                {tok.status}
              </Text>
            </View>
          </View>

          <Text style={styles.bookingCrop}>
            {tok.cropName} • {tok.estimatedQuintals} Quintals
          </Text>
          <Text style={styles.bookingMeta}>
            Centre: {tok.centreName} • {tok.slotDate} ({tok.slotTime})
          </Text>

          <View style={styles.bookingCardFooter}>
            <Text style={styles.bookingVehicle}>{tok.vehicleNumber}</Text>
            <View style={styles.viewPassLink}>
              <Text style={styles.viewPassText}>Gate Pass</Text>
              <ArrowRight size={13} color="#10B981" />
            </View>
          </View>
        </TouchableOpacity>
      ))}
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
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  welcomeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  farmerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  farmerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  kisanIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  kisanIdLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  kisanIdBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kisanIdText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#FCD34D',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    width: '48.5%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  statSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  activePassBanner: {
    backgroundColor: '#0F251E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginBottom: 18,
  },
  activePassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activePassBadge: {
    backgroundColor: '#065F46',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePassBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  activePassBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activePassCrop: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activePassCentre: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  activePassVehicle: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginTop: 3,
  },
  qrIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  qrScanLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#34D399',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E2E8F0',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bookingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  bookingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingToken: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#34D399',
  },
  miniStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  bookingCrop: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookingMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  bookingCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  bookingVehicle: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#FCD34D',
    fontWeight: '700',
  },
  viewPassLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewPassText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
});
