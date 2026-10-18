# Rescue coordination demo

Open **Rescue** on the map, or visit `/rescue` while the Vite server is running.
The dashboard and map dispatch controls use the same `ResourceDefenseGame` pool.
The latest upstream tactical commander and white dashboard theme are preserved.
Its incident context comes from the current ranked reports. The embedded
scenario copilot is advisory; it does not dispatch incident resources. The map
commander's direct dispatch accepts explicit commands such as `Deploy Boat`,
not questions or negated instructions. It uses the team's existing provider
configuration, separately from the optional OpenAI report extractor below.

## Working flow

1. Review the next recommendation. Incidents sort by reviewed urgency, then
   reported vulnerability, then proximity to the active simulated flood crest.
2. Select an incident and approve a single unit. The shared pool reserves that
   unit plus its personnel. The operator can select a different incident instead
   of accepting the recommended priority order.
3. Return to the map to watch the existing vehicle animation. Reopen Rescue to
   see `EN ROUTE`, then `ON SCENE`.
4. Confirm completion after arrival. Only then is the unit returned to the
   available pool. Completion cannot release it twice.
5. Inject an urgent report or mark an unassigned incident's access blocked.
   Recommendations recompute; active assignments are never silently switched.

The map's pool-reset control cannot clear active incident reservations. Complete
those missions first. A page reload resets the entire exercise.

## Prioritization and allocation

- Base urgency: life threat 90, medical 75, stranded 55, support 30.
- Explicit vulnerability adds 5. Being within 25 km of an active simulated crest
  adds 5. Scores are capped at 100. Proximity is an exercise signal, not a
  validated flood-exposure calculation.
- Pending needs are considered highest score first; ties use report order/ID.
  Each recommendation uses one unit and its personnel cost: boat 4, pump 8,
  response crew 25. Planning does not reserve actual stock; approval does.
- Invalid coordinates, blocked access, completed/assigned incidents, unavailable
  units and insufficient personnel block dispatch. Repeated approval cannot
  spend the same resource twice. Exact message-and-coordinate duplicates are
  detected on report entry.
- The map picks the nearest configured depot using straight-line distance.
  This is a greedy exercise allocator, not an optimization solver or real route
  planner. Stock is global; depot-specific inventory is not modelled.

## Optional AI message extraction

The report form can send an English or Roman Urdu message to the server's
`POST /api/openai/rescue-triage` endpoint. The response suggests only
`{ danger, resource, vulnerable }`. The operator must review the fields and
provide coordinates before adding the report. An LLM never dispatches units.

Set server-side `OPENAI_API_KEY` in the ignored `.env`; optionally set
`OPENAI_RESCUE_TRIAGE_MODEL` (defaults to the app's existing `gpt-5-nano` model).
Restart Vite after changing environment variables. The key stays on the server.
Messages are sent to OpenAI only when the operator clicks extraction; requests
use `store: false`, a strict schema, the existing same-site gate/rate limiter,
bounded input and a timeout. See the official
[Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

No key, provider failure or invalid model output leaves manual entry available.
This endpoint needs the existing Vite provider server; a static-only deployment
does not provide it. Provider tests mock requests and make no paid API calls.

## Exercise limits

Default reports, resources and outcomes are simulated; assignments stay in this
browser session's memory. The upstream citizen-beacon submission is preserved
in the report form: opt in to save a report to its existing Supabase registry,
with a device-local queue on failure. The activity log distinguishes those
outcomes; neither confirms contact with emergency services. GPS is optional and
never falls back to an invented location. No SMS/WhatsApp gateway, assignment
persistence, authentication or real emergency dispatch is claimed. Each
assignment is one unit, not a promise that everyone
listed can be evacuated. Medical specialists, carrying capacity, road/water
passability and real travel timing are not modelled. Movement takes 14 real
seconds on a straight line regardless of the illustrative distance estimate.

## Checks

```sh
node --test src/simulation/rescueAllocation.test.mjs src/simulation/resourceDefenseGame.test.mjs server/providers/openai/rescue-triage.test.mjs
node --test src/simulation/tacticalAiCommander.test.mjs
node --test src/services/supabaseClient.test.mjs
npm run check:boundaries
npm run build
```

With the dev server running, `npm run qa:rescue` exercises the real dashboard and
resource engine in an isolated browser surface without loading the 3D globe.
It checks approval, shared inventory, arrival, completion, filters, access,
deduplication, report entry, safe text rendering, AI fallback, draft preservation
and navigation. Desktop and narrow-viewport screenshots go to `qa-shots/rescue`.
Set `QA_URL`, `CHROME_PATH` or `QA_OUTPUT_DIR` when needed. Narrow viewport checks
verify layout, not physical mobile-device gestures or map rendering.
