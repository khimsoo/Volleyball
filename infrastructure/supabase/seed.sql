-- ─── Seed: System Drills Library ─────────────────────────────────────────────
-- organization_id = NULL → global drills available to all organizations

INSERT INTO drills (name, description, instructions, skill_type, positions_relevant, difficulty, training_phase_tags, equipment_required, coaching_cues, is_public)
VALUES
  (
    'Serving Zone Target',
    'Serve to specific court zones to develop serve accuracy and tactical placement.',
    '1. Stand at service line. 2. Identify target zone (1-9). 3. Execute float or jump serve. 4. Track success rate per zone.',
    'serving',
    ARRAY['setter','outside_hitter','opposite','middle_blocker','defensive_specialist','libero']::volleyball_position[],
    'intermediate',
    ARRAY['general','competition_maintenance']::training_phase[],
    ARRAY['volleyball', 'target cones'],
    '[{"timestamp_seconds": 5, "cue_text": "Toss the ball consistently to the same spot every rep", "cue_type": "technical"}, {"timestamp_seconds": 15, "cue_text": "Contact the ball at full arm extension", "cue_type": "technical"}]'::jsonb,
    true
  ),
  (
    'Pass-Set-Hit (3-Touch)',
    'Full 3-touch sequence drill: reception, set, and attack. Develops system continuity.',
    '1. Server initiates rally. 2. Passer targets setter position. 3. Setter delivers to antenna. 4. Attacker executes kill.',
    'passing',
    ARRAY['setter','outside_hitter','opposite','libero','defensive_specialist']::volleyball_position[],
    'intermediate',
    ARRAY['general','competition_maintenance','peaking']::training_phase[],
    ARRAY['volleyball', 'net'],
    '[{"timestamp_seconds": 3, "cue_text": "Establish your platform before the ball arrives", "cue_type": "technical"}, {"timestamp_seconds": 20, "cue_text": "Call for the ball early so setter knows your run", "cue_type": "tactical"}]'::jsonb,
    true
  ),
  (
    'Approach Jump Training',
    'Focus on maximizing attack height through optimal 4-step approach mechanics.',
    '1. Start 4 meters from net. 2. Execute 4-step approach (right: L-R-L-R or left: R-L-R-L). 3. Penultimate step is longest. 4. Jump and reach maximum height.',
    'attacking',
    ARRAY['outside_hitter','opposite','middle_blocker']::volleyball_position[],
    'advanced',
    ARRAY['strength','power','peaking']::training_phase[],
    ARRAY['volleyball', 'approach markers'],
    '[{"timestamp_seconds": 2, "cue_text": "Penultimate step: long, low, and fast", "cue_type": "technical"}, {"timestamp_seconds": 8, "cue_text": "Swing both arms aggressively upward on takeoff", "cue_type": "physical"}, {"timestamp_seconds": 14, "cue_text": "Contact the ball at the top of your reach with a firm wrist snap", "cue_type": "technical"}]'::jsonb,
    true
  ),
  (
    'Block Footwork — Lateral Shuffle',
    'Middle blocker lateral movement drill for closing on outside attacks.',
    '1. Start in base position at middle of net. 2. On cue, shuffle 2-3 steps to outside. 3. Execute block jump with penetration over net. 4. Return to base.',
    'blocking',
    ARRAY['middle_blocker','outside_hitter','opposite']::volleyball_position[],
    'advanced',
    ARRAY['general','power']::training_phase[],
    ARRAY['volleyball', 'net'],
    '[{"timestamp_seconds": 4, "cue_text": "Stay low — do not bounce up and down between reps", "cue_type": "technical"}, {"timestamp_seconds": 12, "cue_text": "Lead with the inside foot when closing to the pin", "cue_type": "technical"}]'::jsonb,
    true
  ),
  (
    'Libero Defensive Sprawl',
    'Develop extension defense and floor-contact skills for extreme ball retrieval.',
    '1. Coach attacks down the line at chest height. 2. Libero dives/sprawls to dig. 3. Recover immediately to base. 4. Repeat 5× each side.',
    'defense',
    ARRAY['libero','defensive_specialist']::volleyball_position[],
    'elite',
    ARRAY['general','competition_maintenance']::training_phase[],
    ARRAY['volleyball', 'knee pads'],
    '[{"timestamp_seconds": 3, "cue_text": "Lead with your platform — contact the ball before your body hits the floor", "cue_type": "technical"}, {"timestamp_seconds": 10, "cue_text": "Keep eyes on the ball through contact", "cue_type": "mental"}]'::jsonb,
    true
  ),
  (
    'Jump Squat (Power Development)',
    'Explosive lower body power development exercise targeting volleyball-specific jump mechanics.',
    '1. Barbell on traps, 30-50% of 1RM squat. 2. Descend to parallel (fast eccentric). 3. Explode upward through entire foot. 4. Land softly, immediately reset.',
    'strength',
    ARRAY['setter','outside_hitter','opposite','middle_blocker','libero','defensive_specialist']::volleyball_position[],
    'advanced',
    ARRAY['power','peaking']::training_phase[],
    ARRAY['barbell', 'squat rack', 'bumper plates'],
    '[{"timestamp_seconds": 5, "cue_text": "The descent should be controlled but fast — build elastic energy", "cue_type": "physical"}, {"timestamp_seconds": 12, "cue_text": "Drive through your heels and push the floor away", "cue_type": "technical"}]'::jsonb,
    true
  ),
  (
    'Setter Decision Training (Live Ball)',
    'Develop setter reading ability under realistic game-speed conditions.',
    '1. 4 attackers in hitting positions. 2. Setter receives free ball pass. 3. Blockers pre-set one side. 4. Setter must read block and distribute opposite.',
    'setting',
    ARRAY['setter']::volleyball_position[],
    'elite',
    ARRAY['peaking','competition_maintenance']::training_phase[],
    ARRAY['volleyball', 'net', 'blockers'],
    '[{"timestamp_seconds": 2, "cue_text": "Read the middle blocker''s footwork before the pass arrives", "cue_type": "tactical"}, {"timestamp_seconds": 15, "cue_text": "Disguise your set direction until the last possible moment", "cue_type": "tactical"}]'::jsonb,
    true
  ),
  (
    'Hip Mobility Circuit',
    'Pre-session hip mobility routine targeting the ranges needed for volleyball movement patterns.',
    '1. World''s greatest stretch × 10 each side. 2. Hip 90/90 rotations × 15 each side. 3. Lateral band walks × 20 each side. 4. Pigeon stretch × 60s each side.',
    'mobility',
    ARRAY['setter','outside_hitter','opposite','middle_blocker','libero','defensive_specialist']::volleyball_position[],
    'beginner',
    ARRAY['general','deload','hypertrophy']::training_phase[],
    ARRAY['resistance band', 'yoga mat'],
    '[{"timestamp_seconds": 10, "cue_text": "Keep your torso upright in the world''s greatest stretch", "cue_type": "technical"}]'::jsonb,
    true
  );
