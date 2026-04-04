import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store.js';
import { api } from '../../services/api.js';
import type { PerformanceAlert } from '@volleyball/types';

type Tab = 'tests' | 'load' | 'recovery';

export default function AnalyticsScreen() {
  const athlete = useAuthStore((s) => s.athlete);
  const [activeTab, setActiveTab] = useState<Tab>('tests');

  const alertsQuery = useQuery<{ alerts: PerformanceAlert[] }>({
    queryKey: ['alerts', athlete?.id],
    queryFn: () => api.get(`/api/v1/analytics/alerts/${athlete!.id}`),
    enabled: !!athlete,
  });

  const testsQuery = useQuery<{
    latestTests: Array<{ test_type: string; value: number; unit: string; test_date: string }>;
  }>({
    queryKey: ['tests-latest', athlete?.id],
    queryFn: () => api.get(`/api/v1/tests/${athlete!.id}/latest`),
    enabled: !!athlete,
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'tests', label: 'Performance' },
    { key: 'load', label: 'Load' },
    { key: 'recovery', label: 'Recovery' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alerts */}
      {alertsQuery.data?.alerts && alertsQuery.data.alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Alerts</Text>
          {alertsQuery.data.alerts.map((alert, i) => (
            <View
              key={i}
              style={[
                styles.alertCard,
                alert.severity === 'critical' && styles.alertCritical,
                alert.severity === 'warning' && styles.alertWarning,
              ]}
            >
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Latest Performance Tests */}
      {activeTab === 'tests' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Test Results</Text>
          {testsQuery.data?.latestTests.map((test) => (
            <View key={test.test_type} style={styles.testRow}>
              <Text style={styles.testType}>
                {test.test_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
              <View style={styles.testValueRow}>
                <Text style={styles.testValue}>{test.value}</Text>
                <Text style={styles.testUnit}> {test.unit}</Text>
              </View>
              <Text style={styles.testDate}>{test.test_date}</Text>
            </View>
          ))}
          {!testsQuery.data?.latestTests?.length && (
            <Text style={styles.emptyText}>No performance tests recorded yet.</Text>
          )}
        </View>
      )}

      {/* Load tab placeholder */}
      {activeTab === 'load' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Load (ACWR)</Text>
          <Text style={styles.emptyText}>
            ACWR trend chart coming soon. Track your 7-day vs 28-day load ratio to stay in the
            optimal 0.8–1.3 training zone.
          </Text>
        </View>
      )}

      {/* Recovery tab placeholder */}
      {activeTab === 'recovery' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recovery Trends</Text>
          <Text style={styles.emptyText}>
            HRV, sleep, and soreness trends will appear here after 7 days of logging.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A' },
  content: { padding: 20, paddingBottom: 40 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#1D4ED8' },
  tabLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  tabLabelActive: { color: '#FFFFFF' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  alertCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#1F2937',
    borderLeftWidth: 3,
    borderLeftColor: '#6B7280',
  },
  alertCritical: { borderLeftColor: '#EF4444', backgroundColor: '#1A0A0A' },
  alertWarning: { borderLeftColor: '#F59E0B', backgroundColor: '#1A1500' },
  alertMessage: { color: '#E5E7EB', fontSize: 13, lineHeight: 18 },
  testRow: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  testType: { flex: 1, color: '#D1D5DB', fontSize: 13 },
  testValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  testValue: { color: '#4FC3F7', fontSize: 20, fontWeight: '700' },
  testUnit: { color: '#9CA3AF', fontSize: 13 },
  testDate: { color: '#6B7280', fontSize: 11, marginLeft: 8 },
  emptyText: { color: '#6B7280', fontSize: 14, lineHeight: 20 },
});
