# Headless Simulator

This simulator is the first executable rules kernel for the core run-loop. It has no UI and intentionally covers the core simulation phase first:

- fixed-seed full 60-week run
- weekly actions and unified settlement deltas
- review grades, GPA, portfolio accumulation
- four failure boundaries: money, energy, pressure, consecutive failed reviews
- internship tier records, named competition results, and route diagnostic summaries

Simulation conclusions and current architecture handoff notes are tracked in `../docs/simulation-to-content-design.md`.

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
npm run sim:verify:competitions
npm run sim:verify:events
npm run sim:verify:entrepreneurship
npm run sim:verify:internships
npm run sim:verify:internship-value
npm run sim:verify:routes
npm run sim:verify:route-targets
```

Generate a baseline report:

```bash
npm run sim:report -- --count 1000
npm run sim:report -- --count 1000 --events
npm run sim:report:route-targets -- --count 100 --events
```

Run a specific route target:

```bash
npm run sim -- --seed 25 --strategy postgrad --routeTarget strong_postgrad_school --events
npm run sim -- --strategy architecture_job --routeTarget master_studio --count 100 --events
npm run sim -- --seed 25 --strategy career_change --routeTarget entrepreneurship --events
```

The commands listed above are not placeholders only. They have been exercised in this worktree alongside the full verify/report suite so the README examples stay in sync with runnable behavior.

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

Route simulation covers one representative default target per route group, plus explicit `--routeTarget` overrides for stronger schools, overseas tiers, civil-service subroutes, architecture jobs, and career-change jobs. The special `entrepreneurship` target under `career_change` requires all six attributes to reach 90, then records the demon-contract choice before it can resolve to `no_way_back_choice`. Route results are cached after the year-5-upper review. The final ending parser then reads that cached route outcome only after graduation design is complete.

Core route, route-target, internship, competition, and strategy tuning constants live in `balance.ts`.

Current route-balance signals from the 100-run event batch:

- `postgrad`, `architecture_job`, and `career_change` representative strategies are now reachable with fixed seed 25.
- `civil_service` fixed seed 25 currently reaches formal success, while batch runs still preserve fallback and failure outcomes through the exam roll.
- `overseas` remains probabilistic after meeting GPA and portfolio eligibility.
- `architecture_job` still succeeds at 100% because the representative target is the low-threshold local design institute fallback. Stronger targets such as `master_studio` now expose internship and portfolio diagnostics.
- Internships now use probabilistic applications, tier-by-tier progression, tier windows, attempt caps, and 3-week completion. Completed internships add cumulative `internshipValue`; tier progression still reads the highest completed tier so cumulative value cannot masquerade as a named-firm internship.
- Competitions now run through four named submissions with distinct semester windows, thresholds, shortlist modifiers, and prize multipliers instead of one generic submission bucket.
- Explicit route-target matrix verification now covers strong schools, overseas tiers, selection/civil-service/bianzhi targets, local/state-owned/foreign/master architecture jobs, and AI/game/sales/media/illustration career-change jobs.
- These are useful architecture signals, not final tuning. Strong-route rarity should be tuned with `npm run sim:verify:route-targets` plus `npm run sim:report:route-targets`.

The single-run summary includes both final attributes and hidden-route decision-time attributes. This matters because route results are cached after the year-5-upper review and revealed only after graduation design completion.

Single-run and batch reports also include:

- `competitionSubmissionCount`, `competitionShortlistCount`, `competitionRejectionCount`, `competitionResults`, `competitionById`, and `averageCompetitionAwardsByLevel`
- `internshipValue`, `internshipTier`, `internshipApplicationCount`, `internshipAcceptedCount`, `internshipRejectedCount`, and `internshipTierDistribution`
- `hiddenRouteInternshipValue`, `hiddenRouteNamedFirmInternship`, and route-decision internship distributions
- `hiddenRouteFailureReasons` and aggregated `routeFailureReasons`

Event stubs currently cover phase gates, cooldowns, fixed guaranteed events, AI experience counters, model-week events, senior-year anxiety events, and graduation-memory events. They are intentionally lightweight placeholders for the full `events.md` content pool.

Event timing note: random events trigger at week start, before the player spends weekly actions. The simulator briefly tested week-end event timing and it made negative progress/quality events too punitive because players had no chance to respond before review.

This is not a second rule set. It is a small executable subset of the documented rules, ready to be expanded into the full game rules engine.
