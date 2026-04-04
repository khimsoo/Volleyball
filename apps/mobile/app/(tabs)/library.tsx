import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api.js';
import type { Drill } from '@volleyball/types';
import { DrillDifficulty } from '@volleyball/types';

const DIFFICULTY_COLORS: Record<DrillDifficulty, string> = {
  [DrillDifficulty.Beginner]: '#22C55E',
  [DrillDifficulty.Intermediate]: '#F59E0B',
  [DrillDifficulty.Advanced]: '#EF4444',
  [DrillDifficulty.Elite]: '#8B5CF6',
};

function DrillCard({ drill }: { drill: Drill }) {
  return (
    <TouchableOpacity
      style={styles.drillCard}
      onPress={() => router.push({ pathname: '/(modals)/drill-detail', params: { id: drill.id } })}
    >
      <View style={styles.drillHeader}>
        <Text style={styles.drillName} numberOfLines={1}>{drill.name}</Text>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: `${DIFFICULTY_COLORS[drill.difficulty]}22` },
          ]}
        >
          <Text
            style={[
              styles.difficultyText,
              { color: DIFFICULTY_COLORS[drill.difficulty] },
            ]}
          >
            {drill.difficulty}
          </Text>
        </View>
      </View>
      <Text style={styles.drillDescription} numberOfLines={2}>
        {drill.description}
      </Text>
      <View style={styles.drillMeta}>
        <View style={styles.skillBadge}>
          <Ionicons name="fitness-outline" size={12} color="#9CA3AF" />
          <Text style={styles.skillText}>
            {drill.skillType.replace(/_/g, ' ')}
          </Text>
        </View>
        {drill.videoUrl && (
          <View style={styles.videoBadge}>
            <Ionicons name="videocam-outline" size={12} color="#4FC3F7" />
            <Text style={styles.videoText}>Video</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function LibraryScreen() {
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');

  const drillsQuery = useQuery<{ drills: Drill[] }>({
    queryKey: ['drills', search, selectedSkill],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedSkill) params.set('skillType', selectedSkill);
      return api.get(`/api/v1/drills?${params.toString()}`);
    },
  });

  const skillFilters = [
    { key: '', label: 'All' },
    { key: 'serving', label: 'Serve' },
    { key: 'passing', label: 'Pass' },
    { key: 'setting', label: 'Set' },
    { key: 'attacking', label: 'Attack' },
    { key: 'blocking', label: 'Block' },
    { key: 'defense', label: 'Defense' },
    { key: 'strength', label: 'Strength' },
    { key: 'mobility', label: 'Mobility' },
  ];

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search drills..."
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Skill filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {skillFilters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, selectedSkill === f.key && styles.filterChipActive]}
            onPress={() => setSelectedSkill(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedSkill === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Drills list */}
      <ScrollView contentContainerStyle={styles.drillsList}>
        {drillsQuery.data?.drills.map((drill) => (
          <DrillCard key={drill.id} drill={drill} />
        ))}
        {drillsQuery.data?.drills.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search" size={40} color="#374151" />
            <Text style={styles.emptyText}>No drills found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#F9FAFB', fontSize: 15, paddingVertical: 12 },
  filtersRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  filterChipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  filterChipText: { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#FFFFFF' },
  drillsList: { padding: 16, paddingTop: 0, gap: 10 },
  drillCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
  },
  drillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  drillName: { flex: 1, color: '#F9FAFB', fontSize: 15, fontWeight: '600' },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  difficultyText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  drillDescription: { color: '#9CA3AF', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  drillMeta: { flexDirection: 'row', gap: 8 },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  skillText: { color: '#9CA3AF', fontSize: 11, textTransform: 'capitalize' },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0C1929',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  videoText: { color: '#4FC3F7', fontSize: 11 },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: '#6B7280', fontSize: 15 },
});
