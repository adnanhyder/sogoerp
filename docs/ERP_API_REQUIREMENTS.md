# SOGOERP Supabase Integration Requirements

## 1. Direction

SOGOERP will use Supabase as the primary backend:

- Supabase Auth for users
- Supabase Postgres for ERP data
- Supabase Row Level Security for access control
- Supabase Storage for files/images/PDFs
- Supabase REST/PostgREST for direct table inserts where safe
- Supabase RPC functions for validated business actions
- Supabase Realtime later for live dashboard updates

The goal is not to build many custom Next.js API endpoints. The app should mostly read/write Supabase directly, while external systems can send POST requests into Supabase tables or RPC functions.

## 2. Data Entry Methods

SOGOERP needs four ways to receive data:

1. Manual entry from ERP screens
2. External POST requests into Supabase
3. Bulk imports from CSV/XLSX
4. File uploads into Supabase Storage

## 3. Supabase POST Options

### Option A: Direct Insert Into Tables

External system sends POST directly to Supabase REST:

```txt
POST https://PROJECT_REF.supabase.co/rest/v1/leads
```

Headers:

```http
apikey: SUPABASE_ANON_OR_SERVICE_KEY
Authorization: Bearer SUPABASE_ACCESS_TOKEN_OR_SERVICE_KEY
Content-Type: application/json
Prefer: return=representation
```

Payload:

```json
{
  "name": "Ahmed Khan",
  "phone": "03001234567",
  "source": "Facebook Ads",
  "location": "Karachi",
  "vehicle_type": "Truck",
  "budget": 25000,
  "stage": "new_lead"
}
```

Use this for trusted internal tools only.

### Option B: Supabase RPC Functions

External system calls a Postgres function through Supabase:

```txt
POST https://PROJECT_REF.supabase.co/rest/v1/rpc/ingest_lead
```

Payload:

```json
{
  "payload": {
    "name": "Ahmed Khan",
    "phone": "03001234567",
    "source": "Facebook Ads",
    "message": "Need tracker for truck"
  }
}
```

Recommended because RPC can:

- Validate fields
- Normalize phone numbers
- Create audit logs
- Prevent duplicate leads
- Return clean success/error response

### Option C: Inbound Events Table

External systems can POST raw data into `inbound_events`.

Example:

```txt
POST https://PROJECT_REF.supabase.co/rest/v1/inbound_events
```

Payload:

```json
{
  "source": "facebook_lead_ads",
  "event_type": "lead.created",
  "payload": {
    "name": "Ahmed Khan",
    "phone": "03001234567"
  }
}
```

Then ERP/admin can process it into real tables.

Best for:

- Webhooks
- WhatsApp Cloud API events
- GPS provider callbacks
- Facebook lead forms
- Unknown/dirty data

## 4. Required Supabase Tables

Core ERP:

- `profiles`
- `organizations`
- `suppliers`
- `devices`
- `sims`
- `leads`
- `customers`
- `vehicles`
- `technicians`
- `work_orders`
- `support_tickets`
- `finance_entries`
- `commissions`
- `communication_logs`
- `documents`
- `audit_logs`
- `insurance_policies`
- `report_definitions`
- `tracking_events`
- `settings_items`

Integration/import/export:

- `inbound_events`
- `import_jobs`
- `export_jobs`
- `api_sources`

## 5. Required Supabase RPC Functions

Recommended functions:

- `ingest_lead(payload jsonb)`
- `ingest_customer(payload jsonb)`
- `ingest_device(payload jsonb)`
- `ingest_sim(payload jsonb)`
- `ingest_work_order(payload jsonb)`
- `ingest_support_ticket(payload jsonb)`
- `ingest_finance_entry(payload jsonb)`
- `ingest_whatsapp_message(payload jsonb)`
- `process_inbound_event(event_id uuid)`

## 6. External POST Payloads

### Lead

Target:

```txt
/rest/v1/rpc/ingest_lead
```

Payload:

```json
{
  "payload": {
    "name": "Ahmed Khan",
    "phone": "03001234567",
    "whatsapp": "03001234567",
    "source": "Facebook Ads",
    "location": "Karachi",
    "vehicle_type": "Truck",
    "budget": 25000,
    "message": "Need GPS tracker"
  }
}
```

### Device

Target:

```txt
/rest/v1/rpc/ingest_device
```

Payload:

```json
{
  "payload": {
    "imei": "865742091234567",
    "supplier_name": "Supplier A",
    "purchase_cost": 8500,
    "sale_price": 15000,
    "status": "stock_added"
  }
}
```

### SIM

Target:

```txt
/rest/v1/rpc/ingest_sim
```

Payload:

```json
{
  "payload": {
    "sim_number": "03015557788",
    "network_provider": "Jazz",
    "apn_settings": "jazzconnect",
    "activation_date": "2026-06-09"
  }
}
```

### Customer

Target:

```txt
/rest/v1/rpc/ingest_customer
```

Payload:

```json
{
  "payload": {
    "full_name": "Metro Fleet",
    "phone": "03001112222",
    "whatsapp": "03001112222",
    "email": "accounts@metrofleet.com",
    "address": "Karachi",
    "area": "Korangi"
  }
}
```

### Work Order

Target:

```txt
/rest/v1/rpc/ingest_work_order
```

Payload:

```json
{
  "payload": {
    "customer_phone": "03001112222",
    "imei": "865742091234567",
    "scheduled_at": "2026-06-10T10:00:00+05:00",
    "status": "scheduled"
  }
}
```

### WhatsApp Message

Target:

```txt
/rest/v1/rpc/ingest_whatsapp_message
```

Payload:

```json
{
  "payload": {
    "phone": "03001234567",
    "direction": "inbound",
    "message": "What is GPS tracker price?",
    "source": "WhatsApp Cloud API"
  }
}
```

## 7. Import Requirements

SOGOERP should support CSV/XLSX imports for:

- Devices / IMEIs
- SIMs
- Customers
- Vehicles
- Leads
- Finance entries

Each import should:

- Upload source file to Supabase Storage
- Create row in `import_jobs`
- Store import type
- Store status: `pending`, `processing`, `completed`, `failed`
- Store total rows, success rows, failed rows
- Store error details as JSON

Recommended import flow:

1. User uploads CSV/XLSX
2. File goes to Supabase Storage bucket `imports`
3. Row created in `import_jobs`
4. ERP processes rows and inserts into correct table
5. Errors are stored in `error_report`

## 8. Export Requirements

SOGOERP should support exports for:

- Devices
- Leads
- Customers
- Technicians
- Work orders
- Finance reports
- Commission reports
- Support tickets

Each export should:

- Create row in `export_jobs`
- Generate CSV/PDF
- Save file to Supabase Storage bucket `exports`
- Store final file URL
- Store status and generated date

## 9. Storage Buckets Required

Recommended Supabase Storage buckets:

- `device-images`
- `installation-proof`
- `documents`
- `imports`
- `exports`
- `invoices`

## 10. Security Requirements

External POST access must be controlled.

Recommended:

- Create `api_sources`
- Each source has a key/token
- Each source has allowed event types
- Store every inbound request in `inbound_events`
- Use RPC functions for validation
- Use RLS policies carefully
- Do not expose unrestricted service role keys in frontend

## 11. Recommended Build Order

1. Add `inbound_events`, `import_jobs`, `export_jobs`, `api_sources`
2. Add RPC functions for lead/device/SIM/customer ingestion
3. Add import UI for CSV/XLSX uploads
4. Add export buttons for CSV reports
5. Add Supabase Storage buckets
6. Add WhatsApp inbound event storage
7. Add GPS provider inbound event storage
8. Add audit logging for all ingestion/import/export actions


## 12. Secure Supabase RPC Pattern Now Added

The ERP now supports secure source-key based RPC functions.

External apps should create/register an API source inside SOGOERP Integrations, then call these RPC functions:

```txt
/rest/v1/rpc/ingest_lead_secure
/rest/v1/rpc/ingest_customer_secure
/rest/v1/rpc/ingest_device_secure
/rest/v1/rpc/ingest_sim_secure
/rest/v1/rpc/ingest_finance_entry_secure
/rest/v1/rpc/ingest_whatsapp_message_secure
```

Example request body:

```json
{
  "source_key": "external-app-key-created-in-sogoerp",
  "payload": {
    "name": "Ahmed Khan",
    "phone": "03001234567",
    "source": "External App"
  }
}
```

The source key is checked against `api_sources`. If the key is inactive or invalid, Supabase rejects the request.

SOGOERP users can manage API sources at:

```txt
/integrations
```
