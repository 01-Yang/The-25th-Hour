# Headless Simulator

This simulator is the first executable rules kernel for the core run-loop. It has no UI and intentionally covers the core simulation phase first:

- fixed-seed full 60-week run
- weekly actions and unified settlement deltas
- review grades, GPA, portfolio accumulation
- four failure boundaries: money, energy, pressure, consecutive failed reviews
- internship tier records, competition award tiers, and route diagnostic summaries

Tuning notes and current batch baselines are tracked in `../docs/simulation-balance.md`.

Run one game:

```bash
npm run sim -- --seed 25 --strategy normal
```

Run a batch:

```bash
npm run sim -- --strategy normal --count 1000
```

Run with seeded event stubs enabled:

```bash
npm run sim -- --seed 25 --strategy normal --events
npm run sim -- --strategy normal --count 1000 --events
```

Run core verification:

```bash
npm run sim:verify
npm run sim:verify:events
npm run sim:verify:routes
```

Generate a baseline report:

```bash
npm run sim:report -- --count 1000
npm run sim:report -- --count 1000 --events
```

Strategies:

- `normal`: aims for ordinary graduation
- `balanced`: more ambitious stable play
- `postgrad`: formally joins the postgraduate-exam route
- `overseas`: formally joins the overseas-application route
- `civil_service`: formally joins the civil-service route
- `architecture_job`: formally joins the architecture-job route
- `career_change`: formally joins the career-change route
- `bankrupt`: stresses money failure
- `burnout`: stresses energy failure
- `pressure`: stresses pressure failure
- `fail_reviews`: stresses consecutive failed review failure

Route simulation currently covers one representative target per route group and caches hidden route results after the year-5-upper review. The final ending parser then reads that cached route outcome only after graduation design is complete.

Core route, internship, competition, and strategy tuning constants live in `balance.ts`.

Current route-balance signals from the stubbed 100-run event batch:

- `postgrad`, `architecture_job`, and `career_change` representative strategies are now reachable with fixed seed 25.
- `civil_service` fixed seed 25 reaches the fallback outcome, while batch runs still preserve failure and higher-success outcomes through the exam roll.
- `overseas` remains probabilistic after meeting GPA and portfolio eligibility.
- `architecture_job` currently succeeds at 100% because the representative target is the low-threshold local design institute fallback and the internship stub is permissive.
- These are useful architecture signals, not final tuning. Strong-route rarity should be tuned after the representative route targets are expanded beyond the current stubs.

The single-run summary includes both final attributes and hidden-route decision-time attributes. This matters because route results are cached after the year-5-upper review and revealed only after graduation design completion.

Single-run and batch reports also include:

- `competitionAwards` and `averageCompetitionAwardsByLevel`
- `internshipTier` and `internshipTierDistribution`
- `hiddenRouteFailureReasons` and aggregated `routeFailureReasons`

Event stubs currently cover phase gates, cooldowns, fixed guaranteed events, AI experience counters, model-week events, senior-year anxiety events, and graduation-memory events. They are intentionally lightweight placeholders for the full `events.md` content pool.

Event timing note: random events trigger at week start, before the player spends weekly actions. The simulator briefly tested week-end event timing and it made negative progress/quality events too punitive because players had no chance to respond before review.

This is not a second rule set. It is a small executable subset of the documented rules, ready to be expanded into the full game rules engine.
