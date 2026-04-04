# VolleyTrainer — Professional Volleyball Performance & Training App

A full-stack monorepo for professional volleyball athlete performance tracking, training management, and coaching analytics.

---

## Architecture

```
volleyball/
├── apps/
│   ├── api/          # Fastify REST API (Node.js + TypeScript)
│   ├── mobile/       # Expo React Native athlete app (iOS + Android)
│   └── web/          # Next.js 15 coach dashboard
├── packages/
│   ├── types/        # Shared TypeScript interfaces & enums
│   └── utils/        # Shared calculation logic (ACWR, readiness, stats)
└── infrastructure/
    ├── supabase/     # PostgreSQL migrations + RLS policies
    └── docker-compose.yml
```

**Stack:** Turborepo · TypeScript · Fastify · Next.js 15 · Expo · Supabase (PostgreSQL + Auth) · Redis · Recharts · Tailwind CSS · Zustand · TanStack Query

---

## Core Modules

| Module | Description |
|---|---|
| **Readiness Score** | Daily 0–100 composite from HRV, sleep, soreness, ACWR |
| **ACWR Load Monitoring** | Acute:Chronic Workload Ratio with injury risk flagging |
| **Training Programs** | Periodized plans by position with drag-and-drop builder |
| **Session Logger** | Live in-session drill logging with RPE tracking |
| **Drill Library** | 8+ system drills + org custom drills with video cue support |
| **Performance Tests** | Jump height, sprint, 1RM, agility tracking with trend analysis |
| **Match Analytics** | Event logging, efficiency stats, court zone heatmaps |
| **Injury Tracker** | Injury log, RTP stages, load reduction triggers |
| **Nutrition & Recovery** | Sleep, HRV, soreness, macro targets by training load |
| **Periodization Calendar** | Annual macro/meso/micro cycle planning view |

---

## Player Positions

Setter · Outside Hitter · Opposite · Middle Blocker · Libero · Defensive Specialist

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Docker (for local PostgreSQL + Redis)

### Local Development

```bash
# Install dependencies
npm install

# Start database and Redis
docker-compose -f infrastructure/docker-compose.yml up -d

# Run all apps in dev mode
npm run dev

# Run individual apps
npm run dev --filter=api
npm run dev --filter=web
npm run dev --filter=mobile
```

### Environment Variables

Copy `.env.example` files in each app directory:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Database Setup

```bash
# Run migrations (requires running Supabase or local PostgreSQL)
npm run db:migrate

# Seed system drills and test data
npm run db:seed
```

---

## Key Algorithms

### ACWR (Acute:Chronic Workload Ratio)
```
ACWR = (7-day average session load) / (28-day average session load)

Session Load = RPE × Duration (minutes)  [Foster et al., 2001]

Risk zones:
  < 0.8   → Under-prepared
  0.8–1.3 → Optimal (sweet spot)
  1.3–1.5 → Caution
  > 1.5   → High injury risk
```

### Readiness Score (0–100)
```
Score = HRV(30%) + Sleep Hours(25%) + Sleep Quality(15%) + Soreness(20%) + ACWR penalty(10%)

Recommendations:
  ≥ 80 → Train Hard
  ≥ 65 → Train Normal
  ≥ 45 → Train Light
  < 45 → Rest
```

### Attack Efficiency
```
Efficiency = (Kills − Errors − Blocked) / Attempts
Professional target: > 0.280
```

---

## Database Security

All tables use PostgreSQL Row-Level Security (RLS) with `organization_id` isolation.
Even application-level bugs cannot leak data between organizations.

---

## Implementation Roadmap

- [x] Phase 0 — Monorepo setup, shared types & utils
- [x] Phase 1 — Database schema + RLS policies
- [x] Phase 2 — Fastify API (athletes, sessions, drills, analytics, matches)
- [x] Phase 3 — Expo mobile app (Today screen, session logger, drill library, analytics)
- [x] Phase 4 — Next.js coach dashboard (roster, programs, planning, analytics)
- [ ] Phase 5 — Wearable integrations (Apple HealthKit, Catapult, Garmin)
- [ ] Phase 6 — Video upload pipeline (Cloudflare Stream)
- [ ] Phase 7 — PDF report generation (monthly athlete reviews)
- [ ] Phase 8 — AI performance insights (trend detection, load suggestions)
