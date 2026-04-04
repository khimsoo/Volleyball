import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/auth.store.js';
import { api } from '../../services/api.js';
import type { ReadinessScore, ACWRData } from '@volleyball/types';

function ReadinessMeter({ score, recommendation }: { score: number; recommendation: string }) {
  const color =
    score >= 70 ? '#22C55E' : score >= 45 ? '#F59E0B' : '#EF4444';

  const recLabel: Record<string, string> = {
    train_hard: 'Train Hard',
    train_normal: 'Train Normal',
    train_light: 'Train Light',
    rest: 'Rest Day',
  };

  return (
    <LinearGradient
      colors={['#1E293B', '#0F172A']}
      style={styles.readinessCard}
    >
      <Text style={styles.readinessLabel}>Readiness Score</Text>
      <View style={styles.readinessScoreRow}>
        <Text style={[styles.readinessScore, { color }]}>{score}</Text>
        <Text style={styles.readinessMax}>/100</Text>
      </View>
      <View style={[styles.recBadge, { backgroundColor: `${color}22` }]}>
        <Text style={[styles.recText, { color }]}>
          {recLabel[recommendation] ?? recommendation}
        </Text>
      </View>
    </LinearGradient>
  );
}

function ReadinessComponents({
  components,
}: {
  components: ReadinessScore['components'];
}) {
  const items = [
    { label: 'HRV', value: components.hrvScore },
    { label: 'Sleep', value: components.sleepScore },
    { label: 'Quality', value: components.sleepQualityScore },
    { label: 'Soreness', value: components.sorenessScore },
    { label: 'Load', value: components.acwrScore },
  ];

  return (
    <View style={styles.componentsRow}>
      {items.map((item) => {
        const color =
          item.value >= 70 ? '#22C55E' : item.value >= 45 ? '#F59E0B' : '#EF4444';
        return (
          <View key={item.label} style={styles.componentItem}>
            <Text style={[styles.componentValue, { color }]}>
              {Math.round(item.value)}
            </Text>
            <Text style={styles.componentLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ACWRWidget({ acwr, risk }: { acwr: number; risk: string }) {
  const color =
    risk === 'optimal' ? '#22C55E' : risk === 'caution' ? '#F59E0B' : '#EF4444';
  return (
    <View style={styles.acwrWidget}>
      <Text style={styles.widgetLabel}>Training Load (ACWR)</Text>
      <Text style={[styles.acwrValue, { color }]}>{acwr.toFixed(2)}</Text>
      <Text style={[styles.acwrRisk, { color }]}>{risk.toUpperCase()}</Text>
    </View>
  );
}

export default function TodayScreen() {
  const athlete = useAuthStore((s) => s.athlete);
  const today = new Date().toISOString().split('T')[0];

  const readinessQuery = useQuery<ReadinessScore>({
    queryKey: ['readiness', athlete?.id, today],
    queryFn: () => api.get(`/api/v1/analytics/readiness/${athlete!.id}?date=${today}`),
    enabled: !!athlete,
  });

  const acwrQuery = useQuery<ACWRData>({
    queryKey: ['acwr', athlete?.id],
    queryFn: () => api.get(`/api/v1/analytics/acwr/${athlete!.id}`),
    enabled: !!athlete,
  });

  const isLoading = readinessQuery.isLoading;
  const isRefreshing = readinessQuery.isFetching || acwrQuery.isFetching;

  const onRefresh = () => {
    readinessQuery.refetch();
    acwrQuery.refetch();
  };

  const readiness = readinessQuery.data;
  const acwrData = acwrQuery.data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#4FC3F7"
        />
      }
    >
      {/* Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.name}>
            {athlete?.userId ? 'Athlete' : 'Player'} 🏐
          </Text>
        </View>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Readiness Card */}
      {isLoading ? (
        <View style={[styles.readinessCard, styles.skeleton]} />
      ) : readiness ? (
        <>
          <ReadinessMeter score={readiness.score} recommendation={readiness.recommendation} />
          <ReadinessComponents components={readiness.components} />
        </>
      ) : (
        <TouchableOpacity
          style={styles.checkinPrompt}
          onPress={() => router.push('/(modals)/session-start')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#4FC3F7" />
          <Text style={styles.checkinText}>Log your morning readiness check-in</Text>
        </TouchableOpacity>
      )}

      {/* ACWR Widget */}
      {acwrData && (
        <ACWRWidget acwr={acwrData.acwr} risk={acwrData.risk} />
      )}

      {/* Start Session CTA */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push('/(modals)/session-start')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#0284C7', '#0EA5E9']}
          style={styles.startButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="play-circle" size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Today's Session</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Log Performance Test */}
      <TouchableOpacity
        style={styles.quickAction}
        onPress={() => router.push('/(modals)/test-entry')}
      >
        <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
        <Text style={styles.quickActionText}>Log Performance Test</Text>
        <Ionicons name="chevron-forward" size={16} color="#5A6070" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  readinessCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  readinessLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  readinessScoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  readinessScore: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 68,
  },
  readinessMax: {
    fontSize: 20,
    color: '#6B7280',
    marginBottom: 8,
    marginLeft: 4,
  },
  recBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  recText: {
    fontSize: 13,
    fontWeight: '600',
  },
  componentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  componentItem: {
    alignItems: 'center',
  },
  componentValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  componentLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  acwrWidget: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  widgetLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  acwrValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  acwrRisk: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  startButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  quickActionText: {
    flex: 1,
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '500',
  },
  skeleton: {
    height: 160,
    backgroundColor: '#1F2937',
    marginBottom: 12,
  },
  checkinPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C1929',
    borderColor: '#1E40AF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  checkinText: {
    color: '#93C5FD',
    fontSize: 14,
  },
});
