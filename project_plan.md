# Project Plan: Baptistini Advogados - Gamified Task Tracker

## 1. Project Overview
Migration of legacy Excel incentive system to a high-performance SaaS.
**Client:** Baptistini Advogados.
**Identity:** Bold, Aggressive, "Wolf of Wall Street".
**Core Goal:** Transparency & Competition (Social Pressure).

## 2. Technical Architecture

### Stack
- **Frontend:** Next.js 14, Tailwind CSS, Recharts.
- **Backend:** Supabase (PostgreSQL).
- **Theme:** High-Contrast Black (`#000000`) & Intense Yellow (`#FFE500`).

### Database Schema (See `database/schema.sql`)
1.  **`profiles`**: Stores user Tiers (Bronze -> Diamond).
2.  **`activity_logs`**: Capture Client, Process, Time, and Complexity.
3.  **`scoring_rules`**: Configurable point values (10/25/50).

## 3. Implementation Steps

### Phase 1: Foundation (Current)
- [x] Next.js Setup (Completed)
- [x] Basic "Yellow/Black" Theme (Completed - needs adjustment to #FFE500)
- [ ] Database Schema Proposal (Completed)
- [ ] Update Local Mock Store to match new Schema.

### Phase 2: Feature Implementation
1.  **Task Input Module**:
    -   Form with Date, Client, Process, Description, Time.
    -   Complexity Selector (Light/Medium/Hard).
    -   Admin/Manual "Bonus" toggle.
2.  **Logic Engine**:
    -   Apply Multipliers based on User Tier.
    -   Calculate `final_points = base * tier_multiplier`.
3.  **Dashboard 2.0 (The Bloomberg Terminal)**:
    -   Live Leaderboard.
    -   Line Chart (Points Progression).
    -   Total Monthly Points vs Balance.

## 4. Design Guidelines
-   **Font:** Inter or Roboto Mono (Data-heavy).
-   **Colors:**
    -   Background: `#000000` (Void Black)
    -   Primary: `#FFE500` (Safety Yellow / Ferrari Yellow)
    -   Secondary: `#1A1A1A` (Dark Gray surfaces)
    -   Text: `#FFFFFF` and `#FFE500`.

## 5. Security & Validation
-   Admin audit capabilities in the dashboard.
-   Validation to prevent spamming "Hard" tasks.
