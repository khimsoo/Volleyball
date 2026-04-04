import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store.js';
import { useSessionStore } from '../../store/session.store.js';
import { api } from '../../services/api.js';
import type { TrainingSession } from '@volleyball/types';

function SliderInput({
  label,
  value,
  min,
  max,
  onChangeValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChangeValue: (v: number) => void;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}</Text>
      </View>
      <View style={styles.sliderTrack}>
        {steps.map((step) => (
          <TouchableOpacity
            key={step}
            style={[styles.sliderDot, value >= step && styles.sliderDotActive]}
            onPress={() => onChangeValue(step)}
          />
        ))}
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderMinLabel}>{min}</Text>
        <Text style={styles.sliderMaxLabel}>{max}</Text>
      </View>
    </View>
  );
}

export default function SessionStartModal() {
  const today = new Date().toISOString().split('T')[0];
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [sessionType, setSessionType] = useState('technical');

  const startSession = useSessionStore((s) => s.startSession);

  const sessionTypes = [
    { key: 'technical', label: 'Technical' },
    { key: 'strength', label: 'Strength' },
    { key: 'power', label: 'Power' },
    { key: 'conditioning', label: 'Conditioning' },
    { key: 'recovery', label: 'Recovery' },
  ];

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ session: TrainingSession }>('/api/v1/sessions', {
        scheduledDate: today,
        sessionType,
        preSessionSleepHours: sleepHours,
        preSessionSleepQuality: sleepQuality,
        preSessionSoreness: soreness,
      }),
    onSuccess: ({ session }) => {
      startSession(session.id, session);
      router.replace('/(modals)/session-active');
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Morning Check-in</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>

      <SliderInput
        label="Sleep Hours"
        value={sleepHours}
        min={4}
        max={10}
        onChangeValue={setSleepHours}
      />
      <SliderInput
        label="Sleep Quality (1–5)"
        value={sleepQuality}
        min={1}
        max={5}
        onChangeValue={setSleepQuality}
      />
      <SliderInput
        label="Overall Soreness (1–10)"
        value={soreness}
        min={1}
        max={10}
        onChangeValue={setSoreness}
      />

      <Text style={styles.sectionLabel}>Session Type</Text>
      <View style={styles.typeGrid}>
        {sessionTypes.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeChip, sessionType === t.key && styles.typeChipActive]}
            onPress={() => setSessionType(t.key)}
          >
            <Text
              style={[styles.typeChipText, sessionType === t.key && styles.typeChipTextActive]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.startBtn, mutation.isPending && styles.startBtnDisabled]}
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        <Text style={styles.startBtnText}>
          {mutation.isPending ? 'Starting...' : 'Start Session'}
        </Text>
      </TouchableOpacity>

      {mutation.isError && (
        <Text style={styles.error}>{mutation.error?.message}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A' },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: '#F9FAFB', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 32 },
  sliderContainer: { marginBottom: 28 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sliderLabel: { fontSize: 15, fontWeight: '600', color: '#E5E7EB' },
  sliderValue: { fontSize: 15, fontWeight: '700', color: '#4FC3F7' },
  sliderTrack: { flexDirection: 'row', gap: 4 },
  sliderDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1F2937',
  },
  sliderDotActive: { backgroundColor: '#0EA5E9' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderMinLabel: { fontSize: 11, color: '#6B7280' },
  sliderMaxLabel: { fontSize: 11, color: '#6B7280' },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#E5E7EB', marginBottom: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  typeChipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  typeChipText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
  typeChipTextActive: { color: '#FFFFFF' },
  startBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  error: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginTop: 12 },
});
