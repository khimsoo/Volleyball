import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session.store.js';
import { api } from '../../services/api.js';
import type { Drill } from '@volleyball/types';

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function DrillLoggerRow({ drill, sessionId }: { drill: Drill; sessionId: string }) {
  const addDrillLog = useSessionStore((s) => s.addDrillLog);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [load, setLoad] = useState('');
  const [logged, setLogged] = useState(false);

  const logMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/sessions/${sessionId}/drills`, {
        drillId: drill.id,
        sequenceOrder: 0,
        setsCompleted: parseInt(sets),
        repsCompleted: parseInt(reps),
        loadKg: load ? parseFloat(load) : undefined,
      }),
    onSuccess: (data) => {
      addDrillLog((data as { drillLog: ReturnType<typeof addDrillLog> }).drillLog as Parameters<typeof addDrillLog>[0]);
      setLogged(true);
    },
  });

  return (
    <View style={[styles.drillRow, logged && styles.drillRowLogged]}>
      <View style={styles.drillRowHeader}>
        <Text style={styles.drillRowName}>{drill.name}</Text>
        {logged && <Ionicons name="checkmark-circle" size={20} color="#22C55E" />}
      </View>
      <View style={styles.drillRowInputs}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sets</Text>
          <TextInput
            style={styles.input}
            value={sets}
            onChangeText={setSets}
            keyboardType="number-pad"
            editable={!logged}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            editable={!logged}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>kg</Text>
          <TextInput
            style={styles.input}
            value={load}
            onChangeText={setLoad}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor="#6B7280"
            editable={!logged}
          />
        </View>
        {!logged && (
          <TouchableOpacity
            style={styles.logBtn}
            onPress={() => logMutation.mutate()}
            disabled={logMutation.isPending}
          >
            <Text style={styles.logBtnText}>Log</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function SessionActiveScreen() {
  const activeSession = useSessionStore((s) => s.activeSession);
  const currentRpe = useSessionStore((s) => s.currentRpe);
  const setRpe = useSessionStore((s) => s.setRpe);
  const tickElapsed = useSessionStore((s) => s.tickElapsed);
  const endSession = useSessionStore((s) => s.endSession);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const drillsQuery = useQuery<{ drills: Drill[] }>({
    queryKey: ['drills'],
    queryFn: () => api.get('/api/v1/drills?limit=10'),
  });

  useEffect(() => {
    timerRef.current = setInterval(() => tickElapsed(), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tickElapsed]);

  const completeMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/v1/sessions/${activeSession!.sessionId}/complete`, {
        sessionRpe: currentRpe,
      }),
    onSuccess: () => {
      endSession();
      router.replace('/(tabs)');
    },
  });

  if (!activeSession) {
    router.replace('/(tabs)');
    return null;
  }

  const handleEndSession = () => {
    Alert.alert('End Session?', 'This will complete your training session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: () => completeMutation.mutate(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.sessionType}>
            {activeSession.session.sessionType.toUpperCase()}
          </Text>
          <Text style={styles.elapsed}>
            {formatElapsed(activeSession.elapsedSeconds)}
          </Text>
        </View>
        <TouchableOpacity style={styles.endBtn} onPress={handleEndSession}>
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* RPE Slider */}
      <View style={styles.rpeBar}>
        <Text style={styles.rpeLabel}>RPE: {currentRpe}</Text>
        <View style={styles.rpeDots}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.rpeDot, currentRpe >= v && styles.rpeDotActive]}
              onPress={() => setRpe(v)}
            />
          ))}
        </View>
      </View>

      {/* Drill Logs */}
      <ScrollView style={styles.drillList} contentContainerStyle={styles.drillListContent}>
        <Text style={styles.sectionLabel}>Log Drills</Text>
        {drillsQuery.data?.drills.map((drill) => (
          <DrillLoggerRow
            key={drill.id}
            drill={drill}
            sessionId={activeSession.sessionId}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  sessionType: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', letterSpacing: 1.5 },
  elapsed: { fontSize: 36, fontWeight: '800', color: '#4FC3F7', letterSpacing: -1 },
  endBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  endBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  rpeBar: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  rpeLabel: { color: '#E5E7EB', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  rpeDots: { flexDirection: 'row', gap: 4 },
  rpeDot: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#1F2937' },
  rpeDotActive: { backgroundColor: '#0EA5E9' },
  drillList: { flex: 1 },
  drillListContent: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', marginBottom: 4 },
  drillRow: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
  },
  drillRowLogged: { borderColor: '#22C55E22', borderWidth: 1 },
  drillRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  drillRowName: { flex: 1, color: '#F9FAFB', fontSize: 14, fontWeight: '600' },
  drillRowInputs: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  logBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  logBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
