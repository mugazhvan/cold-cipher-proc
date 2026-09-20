import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { useFarmer, MobileToken } from '../../src/context/FarmerContext';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Scale,
  FileText,
  X,
  Building2,
  BadgePercent,
  LandPlot,
  ArrowRight,
} from 'lucide-react-native';

const STAGES = [
  { id: 'BOOKED', label: 'Slot Booked', desc: 'Gate window reserved' },
  { id: 'ARRIVED', label: 'Gate Admitted', desc: 'Security verified at gate' },
  { id: 'WEIGHBRIDGE_IN', label: 'Gross Weighing', desc: 'Loaded vehicle weighed' },
  { id: 'QUALITY_CHECK', label: 'Quality Assayed', desc: 'Moisture probe tested' },
  { id: 'COMPLETED', label: 'Form J Issued', desc: 'Direct bank payout cleared' },
];

export default function EPassScreen() {
  const { activeToken, advanceTokenStage, farmer } = useFarmer();
  const [showJFormModal, setShowJFormModal] = useState(false);

  if (!activeToken) {
    return (
      <View style={styles.emptyContainer}>
        <QrCode size={48} color="#64748B" />
        <Text style={styles.emptyTitle}>No Active e-Gate Pass</Text>
        <Text style={styles.emptySub}>
          Schedule a harvest drop-off slot in the Book tab to generate your pass.
        </Text>
      </View>
    );
  }

  const currentStageIdx = STAGES.findIndex((s) => s.id === activeToken.status);
  const effectiveStageIdx = currentStageIdx >= 0 ? currentStageIdx : 0;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `KISANFLOW-PASS:${activeToken.tokenNumber}|FARMER:${farmer.farmerId}|VEHICLE:${activeToken.vehicleNumber}|CENTRE:${activeToken.centreId}`
  )}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{activeToken.status}</Text>
        </View>
        <Text style={styles.headerTitle}>Official e-Gate Pass</Text>
        <Text style={styles.headerSub}>
          Token: <Text style={styles.tokenMono}>{activeToken.tokenNumber}</Text>
        </Text>
      </View>

      {/* Scannable e-Gate Pass Card */}
      <View style={styles.passCard}>
        <View style={styles.passCardHeader}>
          <View>
            <Text style={styles.passGovTitle}>GOVT. OF PUNJAB • APMC MANDI</Text>
            <Text style={styles.passCentreName}>{activeToken.centreName}</Text>
          </View>
          <ShieldCheck size={24} color="#10B981" />
        </View>

        {/* QR Code Container */}
        <View style={styles.qrWrapper}>
          <Image source={{ uri: qrUrl }} style={styles.qrImage} />
          <View style={styles.qrScanBar}>
            <Text style={styles.qrScanText}>SCAN AT MANDI WEIGHBRIDGE ENTRY</Text>
          </View>
        </View>

        {/* Pass Details Rows */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>FARMER</Text>
            <Text style={styles.detailValue}>{farmer.name}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>KISAN CARD ID</Text>
            <Text style={[styles.detailValue, { color: '#FCD34D', fontFamily: 'monospace' }]}>
              {farmer.farmerId}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>PRODUCE</Text>
            <Text style={styles.detailValue}>
              {activeToken.cropName.split(' ')[0]} ({activeToken.estimatedQuintals} Qtl)
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>VEHICLE NO</Text>
            <Text style={[styles.detailValue, { color: '#38BDF8', fontFamily: 'monospace' }]}>
              {activeToken.vehicleNumber}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>WINDOW</Text>
            <Text style={styles.detailValue}>{activeToken.slotTime}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>EST. PAYOUT</Text>
            <Text style={[styles.detailValue, { color: '#34D399', fontWeight: '900' }]}>
              ₹{activeToken.payoutAmount?.toLocaleString('en-IN') || '1,02,375'}
            </Text>
          </View>
        </View>

        {/* Security Hash Bar */}
        <View style={styles.hashBox}>
          <Text style={styles.hashLabel}>SEC-HASH:</Text>
          <Text style={styles.hashValue} numberOfLines={1}>
            {activeToken.securityHash}
          </Text>
        </View>
      </View>

      {/* 5-Stage Procurement Stepper */}
      <View style={styles.stepperCard}>
        <Text style={styles.stepperTitle}>Procurement Journey Progress</Text>
        <Text style={styles.stepperSub}>
          Live status synchronized with weighbridge computer scale
        </Text>

        <View style={styles.stepperList}>
          {STAGES.map((stg, idx) => {
            const isCompleted = idx <= effectiveStageIdx;
            const isCurrent = idx === effectiveStageIdx;

            return (
              <View key={stg.id} style={styles.stepRow}>
                <View style={styles.stepIndicatorCol}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && styles.stepCircleCompleted,
                      isCurrent && styles.stepCircleCurrent,
                    ]}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={14} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.stepCircleNum}>{idx + 1}</Text>
                    )}
                  </View>
                  {idx < STAGES.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        idx < effectiveStageIdx && styles.stepLineCompleted,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.stepTextCol}>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCompleted && styles.stepLabelCompleted,
                      isCurrent && styles.stepLabelCurrent,
                    ]}
                  >
                    {stg.label}
                  </Text>
                  <Text style={styles.stepDesc}>{stg.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Advance Stage Demo Trigger for Reviewers */}
        <TouchableOpacity
          style={styles.advanceStageBtn}
          onPress={() => advanceTokenStage(activeToken.id)}
        >
          <Text style={styles.advanceStageText}>
            Simulate Next Weighbridge Step ({effectiveStageIdx < 4 ? STAGES[effectiveStageIdx + 1].label : 'Restart Cycle'})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Digital Form 'J' Button */}
      {activeToken.status === 'COMPLETED' ? (
        <TouchableOpacity
          style={styles.jFormButton}
          onPress={() => setShowJFormModal(true)}
        >
          <FileText size={18} color="#FFFFFF" />
          <Text style={styles.jFormButtonText}>View Official Digital Form 'J' Receipt</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.jFormButton, { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' }]}
          onPress={() => setShowJFormModal(true)}
        >
          <FileText size={18} color="#34D399" />
          <Text style={[styles.jFormButtonText, { color: '#E2E8F0' }]}>
            Preview Government Form 'J' Voucher
          </Text>
        </TouchableOpacity>
      )}

      {/* Form J Modal */}
      <Modal
        visible={showJFormModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJFormModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalGovBadge}>OFFICIAL RECEIPT (FORM 'J')</Text>
                <Text style={styles.modalVoucherNum}>
                  {activeToken.jFormNumber || 'J-FORM-2026-PB-8492'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowJFormModal(false)}
                style={styles.closeBtn}
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalIntro}>
                PUNJAB STATE AGRICULTURAL MARKETING BOARD
              </Text>
              <Text style={styles.modalSubIntro}>
                Certificate of Sale Under Section 27 of Punjab Agricultural Produce Markets Act
              </Text>

              {/* Receipt Body Table */}
              <View style={styles.receiptTable}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableHead}>Seller / Farmer:</Text>
                  <Text style={styles.tableVal}>{farmer.name}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableHead}>Kisan ID:</Text>
                  <Text style={[styles.tableVal, { fontFamily: 'monospace' }]}>{farmer.farmerId}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableHead}>Procurement Centre:</Text>
                  <Text style={styles.tableVal}>{activeToken.centreName}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableHead}>Crop & Variety:</Text>
                  <Text style={styles.tableVal}>{activeToken.cropName}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableHead}>Gross Vehicle Weight:</Text>
                  <Text style={styles.tableVal}>{activeToken.grossWeightKg || 8520} kg</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableHead}>Tare Vehicle Weight:</Text>
                  <Text style={styles.tableVal}>{activeToken.tareWeightKg || 4020} kg</Text>
                </View>

                <View style={[styles.tableRow, styles.tableRowHighlight]}>
                  <Text style={[styles.tableHead, { color: '#34D399', fontWeight: '800' }]}>Net Grain Weight:</Text>
                  <Text style={[styles.tableVal, { color: '#34D399', fontWeight: '900', fontFamily: 'monospace' }]}>
                    {activeToken.netWeightKg || 4500} kg ({activeToken.estimatedQuintals} Qtl)
                  </Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableHead}>Moisture Reading:</Text>
                  <Text style={styles.tableVal}>{activeToken.moisturePercent || 11.4}% (Permissible &lt;12%)</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableHead}>Quality Dockage:</Text>
                  <Text style={styles.tableVal}>₹0.00 (Zero Penalty)</Text>
                </View>

                <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: '#334155', marginTop: 6, paddingTop: 8 }]}>
                  <Text style={[styles.tableHead, { fontSize: 13, color: '#FFFFFF', fontWeight: '800' }]}>Total Direct Credit:</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#34D399', fontFamily: 'monospace' }}>
                    ₹{activeToken.payoutAmount?.toLocaleString('en-IN') || '1,02,375'}
                  </Text>
                </View>
              </View>

              {/* Settlement Bank Confirmation */}
              <View style={styles.bankConfirmBox}>
                <CheckCircle2 size={16} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankConfirmTitle}>Direct Bank Settlement Cleared</Text>
                  <Text style={styles.bankConfirmSub}>
                    Transferred to {farmer.bankName} ({farmer.bankAccountMasked}) • IFSC: {farmer.ifscCode}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E2E8F0',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  header: {
    marginBottom: 16,
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  tokenMono: {
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#FCD34D',
  },
  passCard: {
    backgroundColor: '#1E293B',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginBottom: 16,
  },
  passCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  passGovTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  passCentreName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrScanBar: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  qrScanText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  hashBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  hashLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
  },
  hashValue: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#94A3B8',
    flex: 1,
  },
  stepperCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  stepperTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepperSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 16,
  },
  stepperList: {
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepCircleCurrent: {
    borderColor: '#FCD34D',
  },
  stepCircleNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: '#334155',
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
  },
  stepTextCol: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  stepLabelCompleted: {
    color: '#E2E8F0',
  },
  stepLabelCurrent: {
    color: '#FCD34D',
    fontWeight: '800',
  },
  stepDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  advanceStageBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  advanceStageText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
  },
  jFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 20,
  },
  jFormButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalGovBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  modalVoucherNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  modalScroll: {
    marginBottom: 20,
  },
  modalIntro: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E2E8F0',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  modalSubIntro: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  receiptTable: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableRowHighlight: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    marginHorizontal: -6,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  tableHead: {
    fontSize: 11,
    color: '#94A3B8',
  },
  tableVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bankConfirmBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  bankConfirmTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
  },
  bankConfirmSub: {
    fontSize: 10,
    color: '#A7F3D0',
    marginTop: 2,
  },
});
