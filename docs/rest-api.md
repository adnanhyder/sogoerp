# SogoERP REST API

External apps can use API keys stored in `api_sources.source_key`.

Send the key as either:

```http
x-api-key: YOUR_SOURCE_KEY
```

or:

```http
Authorization: Bearer YOUR_SOURCE_KEY
```

## Endpoints

```http
GET    /api/rest/:module
POST   /api/rest/:module
GET    /api/rest/:module/:id
PATCH  /api/rest/:module/:id
DELETE /api/rest/:module/:id
```

List supports:

```http
GET /api/rest/leads?page=1&pageSize=25&q=ali
```

## Modules

- `inventory`
- `leads`
- `customers`
- `technicians`
- `vehicles`
- `sim-config`
- `sims`
- `finance`
- `commissions`
- `support`
- `whatsapp`
- `documents`
- `insurance`
- `reports`
- `tracking`
- `settings`
- `integrations`

## API Key Permissions

`api_sources.allowed_events` controls access. Leave it empty to allow all REST events for that key, or add exact event names:

- `inventory.read`, `inventory.create`, `inventory.update`, `inventory.delete`
- `leads.read`, `leads.create`, `leads.update`, `leads.delete`
- `customers.read`, `customers.create`, `customers.update`, `customers.delete`
- same pattern for every module above

Every write is automatically scoped to the API source organization.

## Example

```bash
curl -X POST http://localhost:3000/api/rest/leads \
  -H "x-api-key: YOUR_SOURCE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Lead\",\"phone\":\"03001234567\",\"location\":\"Faisalabad\"}"
```
