# Hubnovo World — Competitions API (Campus Competition)

REST API used by the **mobile app** and the **web player screens**.
Shared TypeScript types live in [`lib/world/types.ts`](../../lib/world/types.ts) — copy them into the mobile app.

- **Base URL:** `https://<staging-or-prod-host>/api`
- **Auth:** `Authorization: Bearer <Supabase access token>` (the same token the app already uses for ModusHive). Browsers fall back to the cookie session.
- **Format:** JSON in, JSON out.
- **Success:** `200 { "ok": true, ...fields }`
- **Error:** `{ "error": "Human-readable message" }` with status
  - `400` invalid input / rule broken (show the message to the user)
  - `401` not signed in · `403` not allowed (admin-only) · `404` not found (also returned for a competition you can't play yet)
  - `429` rate limited (120 requests/min per user) · `500` server error
- **Points:** `XP` = progress & level (can't be spent). `HubTokens` = closed-loop, non-cash credits (no cash-out, no transfers).
- **Time:** all times are ISO-8601 UTC. Semesters run on Lagos time (UTC+1); day 1 = Monday, day 7 = Sunday (boss day).

## Status of the Campus Competition
`status: "live"` — any signed-in user can join and play. (When a competition is `preview`, only admins and testers can play; everyone else sees `coming_soon` and gets `404`.)

---

## Flow for the app

1. `GET /competitions` → find `slug: "campus"`; show it if `canPlay`.
2. `GET /competitions/campus` → if `me` is `null`, show onboarding.
3. Onboarding: `GET /institutions?q=uni` → `POST /competitions/campus/join`.
4. Home: `GET /competitions/campus/quests/today` (today's quest + catch-up list).
5. Mission screen: `GET /competitions/campus/missions/:id` → render by `kind` → (uploads) → `POST .../attempts`.
6. Show the result: `attempt.status`, `attempt.score`, `attempt.feedback`, `awarded.xp`, `awarded.tokens`, `badge`.
7. Passport: `GET /competitions/campus/progress`. Leaderboards: `.../leaderboard`, `.../league`.

---

## Endpoints

### `GET /competitions`
Every competition (classic Marketplace-style and world-style).
```json
{ "ok": true, "competitions": [ {
  "id": "uuid", "slug": "campus", "name": "Campus Competition", "tagline": "…", "format": "world",
  "status": "preview", "themeColor": "#0891B2", "icon": "graduation-cap", "seasonName": "Semester 1",
  "startsAt": "2026-11-08T23:00:00Z", "endsAt": "2027-02-28T22:59:59Z",
  "pathways": [ { "key": "career", "name": "Career & Employability", "tagline": "…", "color": "#2563EB" },
                { "key": "enterprise", "name": "Enterprise Development", "tagline": "…", "color": "#16A34A" } ],
  "participants": 12, "joined": false, "canPlay": true
} ] }
```

### `GET /competitions/:slug`
```json
{ "ok": true, "competition": {
  "...summary fields": "…", "description": "…", "weeks": 16,
  "clock": { "week": 1, "day": 3, "stage": 1, "startsAt": "…", "endsAt": "…", "phase": "running" },
  "me": null
} }
```
`clock.phase`: `upcoming | running | ended`. `me` after joining:
```json
{ "pathway": "career", "institution": { "id": "uuid", "name": "University of Lagos", "shortName": "UNILAG", "state": "Lagos", "kind": "university" },
  "state": "Lagos", "bracket": "newcomer", "avatar": { "character": 3 },
  "accessibility": { "lite": false, "captions": true, "reducedMotion": false }, "joinedAt": "…" }
```

### `GET /institutions?q=unilag`
`{ "ok": true, "institutions": [ { "id", "name", "shortName", "state", "kind" } ] }` (max 30, approved only).

### `POST /competitions/:slug/join`
```json
{ "pathway": "career", "institutionId": "uuid", "state": "Lagos", "character": 3,
  "accessibility": { "lite": false, "captions": true, "reducedMotion": false } }
```
- `pathway` required: `career | enterprise`.
- Institution: send `institutionId` from the search, **or** `institutionName` (free text → saved for admin approval), or neither.
- `state`: one of the 36 states or `FCT`. `character`: 0–11 (3D avatar; previews at `/competitions/city/characters/previews/character-<male|female>-<a..f>.png`).
- → `{ "ok": true }`. Joining twice → `400`.

### `PATCH /competitions/:slug/me`
Any of `state`, `character`, `accessibility`, `institutionId`, `institutionName`, `pathway`. Changing `pathway` is only allowed before the first attempt.

### `GET /competitions/:slug/quests/today`
```json
{ "ok": true, "today": MissionView | null, "catchUp": [MissionView], "clock": { … } }
```
`catchUp` = earlier missions still `available` or `needs_revision` (no streak penalties).

### `GET /competitions/:slug/quests?week=2`
`{ "ok": true, "week": 2, "missions": [MissionView] }` — 7 missions (Mon–Sun) for the caller's pathway.

### `GET /competitions/:slug/missions/:missionId`
`{ "ok": true, "mission": MissionView, "attempts": [AttemptView] }`

### `POST /competitions/:slug/missions/:missionId/upload-url`
For `file` / `video` fields. Body `{ "fieldId": "cv", "contentType": "application/pdf", "sizeBytes": 183422 }` →
`{ "ok": true, "uploadUrl": "https://…r2…", "key": "world/…/….pdf", "expiresInS": 3600 }`.
Then `PUT uploadUrl` with the raw file body and the same `Content-Type`. Use `{ "key": "…" }` as the field value.
Allowed: images (jpeg/png/webp) & PDF ≤ 10 MB; video (mp4/mov/webm) ≤ 150 MB — only the groups the field's `accept` lists.

### `POST /competitions/:slug/missions/:missionId/attempts`
Body is an `AttemptPayload` (by mission kind — see below). Response:
```json
{ "ok": true,
  "attempt": { "id": "uuid", "attemptNo": 1, "status": "passed", "score": 82, "feedback": "…", "rubricScores": { "completeness": 85 }, "createdAt": "…", "reviewedAt": "…" },
  "awarded": { "xp": 60, "tokens": 5 },
  "badge": null }
```
`status`:
- `passed` — done; XP + HubTokens awarded once.
- `needs_revision` — show `feedback`, allow another attempt (max `maxAttempts`, default 3).
- `in_review` — waiting for a judge (Sunday boss / finale) or a moderator. Poll the mission later.
- `rejected` — final; can be appealed.

Scoring rules shown to users:
- Quiz / sort / scenario: graded instantly. The **first attempt** counts towards the stage score; retries only help you pass.
- Written missions: scored by an AI reviewer against the rubric (feedback included). Personal data about other people → `needs_revision`.
- Sunday boss + stage finale: scored by human judges.
- Stage score = 40% evidence, 25% quality, 15% reflection, 10% teamwork, 10% showcase. Pass mark 60.

### `POST /competitions/:slug/missions/:missionId/coach`
`{ "message": "…", "history": [{ "role": "user" | "assistant", "content": "…" }] }` → `{ "ok": true, "reply": "…" }`.
The Novo coach for one mission: explains the brief and rubric and helps the player plan, but never writes the submission or gives quiz answers (off for judged missions, the Sunday boss challenges and the Week 4 finale: returns `400`). Keep `history` on the device. 30 messages per user per day (`429`); `503` when AI is unavailable.

### `POST /competitions/:slug/attempts/:attemptId/appeal`
`{ "reason": "…" }` (≥ 10 chars) → `{ "ok": true }`. One appeal per attempt.

### `GET /competitions/:slug/progress`
```json
{ "ok": true, "progress": {
  "level": { "level": 3, "name": "Builder", "xpToNext": 550, "progress": 0.63 },
  "xp": 2450, "tokens": 132, "rank": 4,
  "stages": [ { "stage": 1, "buckets": { "evidence": 80, "quality": 72, "reflection": 65, "teamwork": 70, "showcase": 0 },
                "total": 71, "passMark": 60, "passed": false, "missionsDone": 18, "missionsTotal": 28 } ],
  "badges": [ { "key": "career-explorer", "label": "Career Explorer", "icon": "award", "awardedAt": "…" } ]
} }
```

### `GET /competitions/:slug/leaderboard?pathway=career&scope=overall|institution|state&value=&period=all|week&limit=50`
- `pathway` defaults to the caller's. `scope=institution` / `scope=state` without `value` use the caller's own campus / state (or pass `value=<institutionId>` / `value=Lagos`).
- `period=week` ranks XP earned in the current semester week (only players with XP this week).
- `me` is the caller's own position even outside the top 50 (`me.rank: null` = no XP this week yet; `me: null` = not on this board).
`{ "ok": true, "pathway", "scope", "scopeValue", "scopeLabel": "UNILAG", "period", "week", "total": 3, "me": { "rank": 1, "xp": 110, "missionsCompleted": 2 }, "entries": [ { "rank", "userId", "username", "displayName", "avatarUrl", "character", "xp", "missionsCompleted", "institution", "institutionId", "state", "isMe" } ] }`
Show `character` (avatar preview) when `avatarUrl` is null.

### `GET /competitions/:slug/league?pathway=career`
Campus vs campus: average XP per participant, campuses with `minPlayers` (3)+ players. Omit `pathway` for both pathways.
`{ "ok": true, "pathway", "minPlayers": 3, "me": { "institutionId", "name", "participants", "rank": null, "averageXp", "playersNeeded": 2 }, "entries": [ { "rank", "institutionId", "name", "shortName", "state", "participants", "totalXp", "averageXp", "isMine" } ] }`

### Squads (teams of 3–5, same pathway, invite code only)
- `GET /competitions/:slug/squad` → `{ "ok": true, "enabled": true, "squad": Squad | null }`. Hide the feature when `enabled` is `false`.
- `POST /competitions/:slug/squad` `{ "name": "Lagoon Builders" }` → `{ "ok": true, "squad": Squad }` (you become leader).
- `PATCH /competitions/:slug/squad` `{ "name": "…" }` (leader renames).
- `POST /competitions/:slug/squad/join` `{ "code": "K7MQ3X" }` → `{ "ok": true, "squad": Squad }`. Errors: full, other pathway, already in a squad, unknown code.
- `POST /competitions/:slug/squad/leave` (leader leaving hands over to the longest-standing member; last one out closes the squad).
- `DELETE /competitions/:slug/squad/members/:userId` (leader removes a player).
- `POST /competitions/:slug/squad/chat` → `{ "ok": true, "chatChannelId": "group_squad_…" }`. Call it, then open that Stream `messaging` channel with the `/api/stream-token` session.

`Squad`: `{ id, name, code, pathway, leaderId, chatChannelId, totalXp, weekXp, min: 3, max: 5, createdAt, teamMission: { id, title, week, day, unlocksAt } | null, members: [ { userId, username, displayName, avatarUrl, character, isLeader, isMe, xp, weekXp, teamMission: MissionStatus | null, joinedAt } ] }`
Team missions pre-fill their `squad` field with the squad name on the web; do the same in the app.

---

### Rewards Exchange
Spend HubTokens on non-cash rewards (course discounts, avatar items, event access). Tokens never buy score or XP, can't be sent to anyone and can't be cashed out. `enabled: false` = not switched on yet (hide the feature).
- `GET /competitions/:slug/rewards` → `{ enabled, balance, rewards: RewardView[] }`. Disable Redeem when `blocked` is set (`out_of_stock` · `limit_reached` · `insufficient_tokens`).
- `POST /competitions/:slug/rewards/:id/redeem` `{ "requestId": "<uuid>" }` → `{ redemption, balance }`. Create the `requestId` when the confirm dialog opens and reuse it on retry: the same id never spends twice. `auto` rewards return `fulfilled` with a `code`; `manual` ones stay `pending` until the team fulfils them.
- `GET /competitions/:slug/redemptions` → `{ enabled, redemptions: RedemptionView[] }` (status `pending` · `fulfilled` · `cancelled` = refunded).

### Certificates
A stage is passed with a stage score of 60+ **and** its finale passed (the last boss challenge: Week 4 for Stage 1). Each passed stage gives one certificate.
- `GET /competitions/:slug/certificates` → `{ "ok": true, "enabled": true, "certificates": Certificate[], "next": { "stage": 1, "stageName": "Discover & Define", "total": 42, "passMark": 60, "finalePassed": false, "finaleWeek": 4 } | null }` (issues newly earned certificates first)
- Public, no token: `GET /certificates/:code` (verify JSON), `GET /certificates/:code/image` (PNG, `?download=1`), `GET /certificates/:code/pdf` (PDF, `?inline=1`)
- `Certificate`: `{ code, verifyUrl, imageUrl, pdfUrl, competitionName, stage, stageName, pathway, pathwayName, holderName, institution, score, issuedAt, revoked }`. Share `verifyUrl` (the QR code on the certificate points there).

---

## Notifications
Campus events arrive as rows in `notifications` with `type: "competition"` (push via the existing OneSignal trigger):
- daily "Today's quest" at 07:00 Lagos (Sunday: "Boss challenge is live"): `data.kind: "world_quest"`, `reference_id` = mission id
- judge results and appeal results: `data.kind: "world_attempt"`, `reference_id` = attempt id
- squad joins, removals and new leader: `data.kind: "world_squad"`, `reference_id` = squad id
- reward fulfilled or cancelled (refunded): `data.kind: "world_reward"`, `reference_id` = redemption id, `data.url` = the Rewards Exchange

Show `title` and `body`; `data.url` is the web path to open (e.g. `/app/competitions/campus/missions/<id>`, `/app/competitions/campus/squad`). Map it to the matching app screen.

---

## `MissionView`
```ts
{ id, key, pathway: 'career'|'enterprise', stage, week, day /* 1=Mon … 7=Sun */,
  title, story, kind, config, estMinutes, xp, tokens,
  bucket: 'evidence'|'quality'|'reflection'|'teamwork'|'showcase',
  reviewMode: 'auto'|'ai'|'human', rubric: { key, title, passMark, criteria: [{ id, label, weight }] } | null,
  status: 'locked'|'available'|'in_review'|'passed'|'needs_revision'|'rejected',
  unlocksAt, attemptsUsed, maxAttempts, lastAttempt: AttemptView | null, badge: { key, label } | null,
  tips: string[] /* "How to do this" steps to show above the activity */ }
```

## Mission kinds, configs and payloads

| kind | config | payload |
|---|---|---|
| `quiz` | `{ graded, questions: [{ id, prompt, multi?, options: [{ id, label }] }] }` | `{ kind: "quiz", answers: { [questionId]: optionId \| optionId[] } }` |
| `sort` | `{ prompt, items: [{ id, label }], bins: [{ id, label }] }` | `{ kind: "sort", placement: { [itemId]: binId } }` |
| `scenario` | `{ intro, start, nodes: [{ id, text, choices: [{ id, label, next? }] }] }` | `{ kind: "scenario", path: [{ node, choice }] }` — from `start`, follow each choice's `next` until a choice has none |
| `board`, `canvas`, `evidence`, `video`, `reflection`, `team`, `live_event`, `boss` | `FormConfig` (below) | `{ kind: "form", fields: { [fieldId]: value }, checklist: [checklistId] }` |

`graded: false` quizzes are self-assessments (no right answers). Answer keys are never sent to clients.
Self-assessments may include `config.profile`; their attempts then return `insights` (a ranked result such as the **Skill Compass**: `{ title, intro, ranking: [{ id, label, description, careers, share }] }`). Show it instead of a score.

### `FormConfig`
```ts
{ variant?: string,          // UI hint: five_whys, scorecard, goal_forge, lean_canvas, value_proposition, star, unit_economics, mock_interview…
  intro?: string,
  fields: FieldDef[],
  checklist?: [{ id, label }] } // every item must be ticked (consent, no personal data, honesty)

FieldDef = { id, label, type: 'text'|'textarea'|'number'|'select'|'checkbox'|'file'|'link'|'video',
             required?, hint?, options?: [{ id, label }], minWords?, maxWords?, min?, max?,
             accept?: ('image'|'pdf'|'video')[], maxSeconds?, repeat?: number }
```
Field values: `text`/`textarea` → string · `number` → number · `select` → option id · `checkbox` → boolean ·
`link` → `{ "url": "https://…" }` · `file`/`video` → `{ "key": "<from upload-url>" }`.
`repeat: N` → send an array of N values (e.g. "Why? ×5").

Example:
```json
{ "kind": "form",
  "fields": { "role": "Bank teller", "insight1": "…", "insight2": "…", "insight3": "…", "insight4": "…", "insight5": "…" },
  "checklist": ["consent", "no_pii"] }
```

---

## Admin (role `admin`)
- `POST /competitions/:slug/admin/sync` `{ "overwrite": false }` → `{ inserted, updated }` — loads missions from `lib/world/content`.
- Rewards (web: `/app/competitions/:slug/admin/rewards`): `GET|POST /competitions/:slug/admin/rewards`, `PATCH …/admin/rewards/:id` (`{ "isActive": false }` switches off), `GET …/admin/redemptions?status=pending`, `POST …/admin/redemptions/:id/fulfil` `{ code?, note? }`, `POST …/admin/redemptions/:id/cancel` `{ note? }` (refunds the tokens). The student is notified on fulfil and cancel.
- `POST /competitions/:slug/admin/testers` `{ "username": "dev_mobile" }` — allow a user to play while `preview`.
- `GET /competitions/review` (or `?appeals=1`) → `{ items: ReviewQueueItem[], counts: { inReview, appeals } }`. Each item has the mission (with its form config, so you can label the answers), the student, `current` (the result being appealed, for appeals), signed file URLs (30 min) and the AI suggestion. Web judges use `/app/competitions/judging`.
- `POST /competitions/review/:attemptId` `{ "decision": "pass"|"revise"|"reject", "rubricScores": { "clarity": 80, … }, "feedback": "…", "appeal": "upheld"|"dismissed" }`.

---

## Coming next (not yet available)
Reminders/notifications, and the 3D campus districts. Endpoints will be added to this document.
