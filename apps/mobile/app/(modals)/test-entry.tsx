import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store.js';
import { api } from '../../services/api.js';
import { TestType } from '@volleyball/types';

const TEST_CONFIGS: Array<{
  type: TestType;
  label: string;
  unit: string;
  description: string;
}> = [
  {
    type: TestType.VerticalJumpApproach,
    label: 'Approach Jump',
    unit: 'cm',
    description: 'Max reach height on 4-step approach',
  },
  {
    type: TestType.VerticalJumpStanding,
    label: 'Standing Vertical',
    unit: 'cm',
    description: 'Standing two-foot vertical jump height',
  },
  {
    type: TestType.BlockJump,
    label: 'Block Jump',
    unit: 'cm',
    description: 'Max reach on block jump from standing',
  },
  {
    type: TestType.Sprint505,
    label: '5-0-5 Agility',
    unit: 's',
    description: '5m sprint, change direction, return 5m',
  },
  {
    type: TestType.Squat1RM,
    label: 'Back Squat 1RM',
    unit: 'kg',
    description: 'Maximum back squat load for 1 rep',
  },
  {
    type: TestType.HangClean1RM,
    label: 'Hang Clean 1RM',
    unit: 'kg',
    description: 'Maximum hang clean load for 1 rep',
  },
  {
    type: TestType.ServeVelocity,
    label: 'Serve Velocity',
    unit: 'm/s',
    description: 'Peak serve speed via radar gun or app',
  },
];

export default function TestEntryModal() {
  const athlete = useAuthStore((s) => s.athlete);
  const [selectedType, setSelectedType] = useState<TestType>(TestType.VerticalJumpApproach);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const selectedConfig = TEST_CONFIGS.find((t) => t.type === selectedType)!;

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/api/v1/tests', {
        athleteId: athlete!.id,
        testDate: new Date().toISOString().split('T')[0],
        testType: selectedType,
        value: parseFloat(value),
        unit: selectedConfig.unit,
        notes: notes || undefined,
        deviceSource: 'manual',
      }),
    onSuccess: () => {
      router.back();
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Log Performance Test</Text>

      {/* Test type selector */}
      <Text style={styles.sectionLabel}>Select Test</Text>
      {TEST_CONFIGS.map((tc) => (
        <TouchableOpacity
          key={tc.type}
          style={[styles.typeRow, selectedType === tc.type && styles.typeRowActive]}
          onPress={() => {
            setSelectedType(tc.type);
            setValue('');
          }}
        >
          <View style={styles.typeInfo}>
            <Text style={styles.typeLabel}>{tc.label}</Text>
            <Text style={styles.typeDesc}>{tc.description}</Text>
          </View>
          <Text style={styles.typeUnit}>{tc.unit}</Text>
        </TouchableOpacity>
      ))}

      {/* Value input */}
      <Text style={styles.sectionLabel}>
        Result ({selectedConfig.unit})
      </Text>
      <TextInput
        style={styles.valueInput}
        value={value}
        onChangeText={setValue}
        keyboardType="decimal-pad"
        placeholder={`e.g. ${selectedConfig.type === TestType.VerticalJumpApproach ? '340' : selectedConfig.type === TestType.Squat1RM ? '120' : '2.4'}`}
        placeholderTextColor="#6B7280"
        returnKeyType="done"
      />

      <Text style={styles.sectionLabel}>Notes (optional)</Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Testing conditions, equipment used..."
        placeholderTextColor="#6B7280"
        multiline
      />

      <TouchableOpacity
        style={[styles.saveBtn, (!value || mutation.isPending) && styles.saveBtnDisabled]}
        onPress={() => mutation.mutate()}
        disabled={!value || mutation.isPending}
      >
        <Text style={styles.saveBtnText}>
          {mutation.isPending ? 'Saving...' : 'Save Test Result'}
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
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeRowActive: { borderColor: '#0EA5E9', backgroundColor: '#0C1929' },
  typeInfo: { flex: 1 },
  typeLabel: { color: '#F9FAFB', fontSize: 14, fontWeight: '600' },
  typeDesc: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  typeUnit: { color: '#4FC3F7', fontSize: 14, fontWeight: '700' },
  valueInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#F9FAFB',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    color: '#F9FAFB',
    fontSize: 14,
    minHeight: 80,
    marginBottom: 28,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  error: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginTop: 12 },
});
