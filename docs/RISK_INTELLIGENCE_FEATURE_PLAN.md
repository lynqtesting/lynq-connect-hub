# Risk Intelligence Dashboard - Implementation Plan

This document translates your two requested features into an implementation plan for the current dashboard stack (React + Supabase).

## Product intent

- Convert raw xAPI/SCORM telemetry into a normalized `deduction_template` JSON snapshot for decision-makers.
- Trigger automated client-facing distribution whenever a new snapshot is finalized or risk exceeds threshold.

## Feature 1: Real-Time xAPI to JSON ingestion

### 1) Admin flow (module setup)

In **Admin > Modules > Create Module**, add fields:

- `xapi_source_type` (`upload_zip` | `stream_endpoint`)
- `xapi_endpoint` (optional URL for live stream/pull)
- `course_title`
- `client_id` (maps to assignment and routing)
- `regional_mapping_strategy` (default: actor metadata tags)
- `confusion_threshold_pct` (default: `25`)

When a module is saved:

1. Create module record.
2. Bind xAPI ingestion config to module.
3. Enable background ingestion job (scheduled pull) or upload parser.

### 2) Source parsing

#### A. ZIP/SCORM package upload

Extract and parse:

- `rxd/indexAPI.html` for statement trigger hints and object mapping
- `configuration.js` for `contentUrl`, `courseTitle`, `rxdHostUrl`
- `imsmanifest.xml` for learning object IDs and hierarchy

Store normalized mappings in a module metadata table:

- `module_object_map(object_id, label, parent, source)`
- `module_source_config(module_id, rxd_host_url, content_url, course_title)`

#### B. xAPI statement stream / ingest endpoint

Create a Supabase Edge Function, for example `ingest-xapi-statements`, that accepts batches of xAPI statements and persists raw statements.

Required minimal statement fields:

- `actor.mbox`
- `verb.id`
- `object.id`
- `result.score.scaled`
- `result.success`
- `result.completion`
- `timestamp`
- actor/context metadata for region/client segmentation

### 3) Transformation engine (Edge Function)

Create `build-risk-snapshot` Edge Function that runs:

- on schedule (e.g., every 5-10 minutes), and/or
- immediately after ingestion batch closes.

It computes the `deduction_template` JSON:

- `STR_overall`: average of `result.score.scaled`
- `objective_score_overall`: average objective score from statement score fields
- `engagement_rate_overall`: distinct active learners / assigned learners
- `dropoff_rate_%`: percentage with incomplete or failed trajectories
- `num_rows`: count of rows/statements considered
- `learning_progress_status`: buckets by completion progression
- `region_wise_STR`: grouped averages by derived region tags
- `confusion_areas`: objects where failure rate > threshold (default 25%)
- `cod_by_theme`, `cod_total_hits`: confusion object distribution from object map categories

### 4) Confusion area logic

For each `object.id`:

- failure rate = `failed_attempts / total_attempts`
- include if `failure_rate >= confusion_threshold_pct`
- label resolution order:
  1. `imsmanifest.xml` mapped title
  2. xAPI object definition name
  3. fallback to raw object ID

Return top N confusion areas (e.g., top 5 by failure rate then volume).

### 5) Data model additions

Proposed tables:

- `xapi_raw_statements`
- `xapi_modules`
- `xapi_module_object_map`
- `risk_snapshots` (stores full JSON + metadata + status)
- `client_assignments` (`assigned` key like `ipru`)
- `client_stakeholders` (email routing)
- `snapshot_dispatch_log`

## Feature 2: Automated client distribution

### 1) Triggering rules

Dispatch event `SEND_DATA_TO_CLIENT` when:

- snapshot status becomes `finalized`, or
- `STR_overall` / derived risk score crosses configured "High Risk" threshold.

### 2) Routing workflow

1. Read `assigned` client key from snapshot/module (`ipru`, etc.).
2. Query `client_stakeholders` for 3-5 active recipients.
3. Render report HTML from snapshot JSON.
4. Send mail through Resend API.
5. Persist success/failure in `snapshot_dispatch_log`.

### 3) Email template content

Minimalist HTML should include:

- STR overall badge
- objective + engagement + dropoff summary row
- region bars (North/South/East/West)
- confusion area percentages
- optional CTA: "Open full dashboard"

### 4) Reliability controls

- Idempotency key per `(snapshot_id, recipient_email)`
- exponential retry (3 attempts)
- dead-letter marker for manual retry in admin
- audit trail with provider message IDs

## Suggested delivery phases

### Phase 1 (foundation)

- DB tables + RLS
- raw xAPI ingestion function
- module admin UI fields

### Phase 2 (intelligence)

- transformation function to produce `deduction_template`
- confusion area/objective/region aggregations
- snapshot list + JSON preview in admin

### Phase 3 (distribution)

- Resend integration + HTML renderer
- stakeholder lookup + trigger automation
- dispatch logs and retry controls

### Phase 4 (hardening)

- threshold tuning UI
- per-client template customization
- observability dashboards + alerting

## Acceptance criteria

- Admin can create a module, connect xAPI source, and see snapshot JSON generated without manual data cleaning.
- Snapshot values map consistently from xAPI fields (especially `result.score.scaled -> STR_overall`).
- Confusion areas are auto-detected from object failure rates against configurable threshold.
- Finalized or high-risk snapshots auto-send to assigned client stakeholder emails through Resend.
- Delivery outcomes are traceable from dispatch logs.

## Risks and mitigation

- **Inconsistent xAPI payloads** -> schema validation + fallback parsing.
- **Missing regional tags** -> default `Unknown` region bucket and admin correction mapping.
- **Email fatigue** -> cooldown window / digest mode per client.
- **False positives in high-risk trigger** -> rolling window smoothing before trigger.

## Immediate next step

If you approve this plan, implementation should start with:

1. migration + schema setup,
2. `ingest-xapi-statements` edge function,
3. first working `build-risk-snapshot` output against your sample template.




## Platform alignment (your current stack)

This plan is designed for your environment:

- Frontend: React dashboard (Lovable project)
- Backend/data: Supabase (Postgres + Edge Functions)
- Hosting/deploy flow: Lovable publish pipeline
- Messaging layer: keep Twilio in place for existing channels; use Resend specifically for stakeholder email reports (or swap to Twilio SendGrid if you want one-provider messaging)

## Lovable preview and release flow

Because your app is hosted on Lovable, use this workflow:

1. Implement DB migrations + Edge Functions in Supabase.
2. Update React admin screens in the Lovable project.
3. Open Lovable preview to validate module creation + snapshot rendering.
4. Run an ingestion test with sample xAPI statements.
5. Confirm risk snapshot JSON output and dispatch logs.
6. Publish from Lovable once checks pass.

If you prefer, we can make "Send Data to Client" provider-agnostic:

- `provider = resend | twilio_sendgrid`
- same trigger and routing logic, different adapter per provider.

## How to preview this

This file is a planning document only. There is no new UI page yet from this commit.

To preview the dashboard once implementation starts:

1. Run the app locally with `npm install` and `npm run dev`.
2. Open the URL printed by Vite (typically `http://localhost:5173`).
3. Go to **Admin > Modules** and create a module with xAPI source settings.
4. Use a test statement payload to hit the ingestion edge function.
5. Confirm generated snapshots in the admin snapshot list/JSON preview.
6. Trigger test email dispatch and verify entries in dispatch logs.

## Delivery expectation note (AI + engineering reality)

AI can accelerate implementation significantly, but shipping still includes:

- schema and migration safety,
- edge-function testing with real payload variance,
- email provider integration validation,
- end-to-end QA in your environment.

So timelines are driven by verification/risk controls, not typing speed alone.


## What to do now (execution checklist)

Follow these in order to move from plan to working feature quickly:

1. **Create schema first (Supabase migrations)**
   - Add tables: `xapi_raw_statements`, `xapi_modules`, `xapi_module_object_map`, `risk_snapshots`, `client_assignments`, `client_stakeholders`, `snapshot_dispatch_log`.
   - Add indexes on `module_id`, `timestamp`, `actor_mbox`, `client_id`.
   - Add RLS policies for admin write + scoped read.

2. **Build ingestion endpoint (Edge Function #1)**
   - Implement `ingest-xapi-statements`.
   - Validate required xAPI fields and store raw payload + normalized columns.
   - Return ingestion batch ID for traceability.

3. **Build snapshot transformer (Edge Function #2)**
   - Implement `build-risk-snapshot`.
   - Map `result.score.scaled -> STR_overall`.
   - Compute region STR, progress status, dropoff, confusion areas.
   - Persist final JSON into `risk_snapshots`.

4. **Add admin UI wiring (React/Lovable)**
   - In **Admin > Modules > Create Module**, add xAPI source fields.
   - Add snapshot viewer page (latest JSON + previous runs).
   - Add “Send Data to Client” manual trigger button for testing.

5. **Add automated distribution**
   - Trigger on snapshot `finalized` or high-risk threshold.
   - Lookup `assigned` client stakeholders.
   - Render minimal HTML and send via configured email provider.
   - Log every send outcome in `snapshot_dispatch_log`.

6. **Run end-to-end test before publish**
   - Ingest sample xAPI batch.
   - Verify generated JSON values match expected math.
   - Trigger/send email and confirm receipt + log entry.
   - Publish from Lovable after pass.

### Fast success criteria for your first release

- A module can be created with xAPI config.
- Ingesting statements produces a risk snapshot JSON automatically.
- Confusion areas are auto-populated using the failure threshold.
- At least one stakeholder receives the generated report email.
- Admin can audit what was sent and when.
