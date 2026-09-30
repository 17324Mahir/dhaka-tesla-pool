# API reference

Base URL: `http://localhost:5000`

Requests and responses use JSON. Protected endpoints require:

```http
Authorization: Bearer YOUR_JWT
Content-Type: application/json
```

Validation errors use HTTP `400` and include field-level details:

```json
{
  "message": "Request validation failed",
  "errors": [
    { "field": "email", "message": "Enter a valid email address" }
  ]
}
```

## Authentication

### Register

`POST /auth/register` — public

```json
{
  "name": "Amina",
  "email": "amina@example.com",
  "password": "password123",
  "role": "PASSENGER"
}
```

`role` must be `PASSENGER` or `DRIVER`. Successful response (`201`):

Driver registration also creates an assigned three-seat Tesla in offline mode.
The driver must go online before waiting passenger requests can be matched.

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "name": "Amina",
    "email": "amina@example.com",
    "role": "PASSENGER"
  }
}
```

Possible errors: `400` invalid body, `409` email already exists, `500`
registration failed.

### Login

`POST /auth/login` — public

```json
{
  "email": "passenger@example.com",
  "password": "password123"
}
```

Successful response (`200`):

```json
{
  "message": "Login successful",
  "token": "jwt",
  "user": {
    "id": "uuid",
    "name": "Amina",
    "role": "PASSENGER"
  }
}
```

Possible errors: `400` invalid body, `401` invalid email or password, `500`
login failed.

## Passenger

Every passenger endpoint requires a passenger JWT. Driver tokens receive
`403`.

### Request and match a ride

`POST /rides`

```json
{
  "pickup": "Banani",
  "destination": "Mohakhali",
  "seats": 1
}
```

Supported areas are Banani, Gulshan, Gulshan 1, Mohakhali, Dhanmondi, Mirpur,
Uttara, Farmgate, and Bashundhara. Seats must be an integer from 1 to 3. The
request stays `REQUESTED` and is shown to online drivers whose current area
matches its pickup. When a driver accepts it, the API checks remaining capacity
and destination compatibility according to `src/data/zones.json`.

Saved response (`202`):

```json
{
  "message": "Ride requested; waiting for a nearby driver to accept",
  "ride": {
    "id": "uuid",
    "pickup": "Banani",
    "destination": "Mohakhali",
    "seats": 1,
    "status": "REQUESTED",
    "fare": 5192
  }
}
```

The saved fare is the passenger's full route fare. If a driver later accepts a
second compatible passenger into the same Tesla, each active member receives a
20% discount on their own route fare. The API recalculates the remaining fare
when an active member joins or cancels.

Possible errors: `400` invalid request, `401` missing or invalid token, `403`
wrong role, `500` creation failed.

### List own rides

`GET /rides/history` (preferred) or `GET /rides/my` (compatibility alias)

No request body. Successful response (`200`):

```json
[
  {
    "id": "uuid",
    "pickup": "Banani",
    "destination": "Mohakhali",
    "seats": 1,
    "status": "MATCHED",
    "fare": 4154,
    "tip": 0,
    "receipt": { "fare": 4154, "tip": 0, "total": 4154 },
    "createdAt": "2026-09-30T10:00:00.000Z",
    "statusHistory": [
      { "status": "REQUESTED", "createdAt": "2026-09-30T10:00:00.000Z" },
      { "status": "MATCHED", "createdAt": "2026-09-30T10:00:01.000Z" }
    ],
    "poolMember": {
      "pool": {
        "tesla": { "name": "Model Y 01", "driver": { "name": "Rahim" } }
      }
    }
  }
]
```

Possible errors: `401`, `403`, or `500` cannot fetch rides.

### Add or update a tip

`PATCH /rides/:id/tip`

The ride must belong to the authenticated passenger and be `COMPLETED`. Money
is sent as non-negative integer paisa; the tip can be updated later without
changing the fare.

```json
{ "tip": 2500 }
```

Successful response (`200`):

```json
{
  "message": "Tip updated",
  "rideId": "uuid",
  "receipt": { "fare": 4154, "tip": 2500, "total": 6654 }
}
```

Possible errors: `400` invalid ID/body, `401`, `403` not the ride owner, `404`
ride not found, `409` ride not completed, or `500` update failed.

### Cancel own ride

`PATCH /rides/:id/cancel`

No request body. The ride must belong to the passenger and be `REQUESTED` or
`MATCHED`. Successful response (`200`):

```json
{
  "message": "Ride cancelled",
  "ride": { "id": "uuid", "status": "CANCELLED" }
}
```

Possible errors: `400` invalid ID or state, `401`, `403` not the owner, `404`
ride not found, `500` cancellation failed.

### List own pools

`GET /pool/my`

No request body. The response exposes aggregate occupancy plus only the
authenticated passenger's membership. It never includes another passenger's
route, fare, status, name, or identifier:

```json
[
  {
    "id": "uuid",
    "status": "WAITING",
    "tesla": { "id": "uuid", "name": "Model Y 01", "capacity": 3 },
    "memberCount": 2,
    "usedSeats": 2,
    "availableSeats": 1,
    "myMembership": {
      "id": "uuid",
      "seats": 1,
      "individualFare": 4154,
      "ride": {
        "id": "uuid",
        "pickup": "Banani",
        "destination": "Mohakhali",
        "status": "MATCHED",
        "fare": 4154
      }
    }
  }
]
```

Possible errors: `401`, `403`, or `500` cannot fetch pool.

## Driver

Every driver endpoint requires a driver JWT. Passenger tokens receive `403`.
A driver can only accept or update pools assigned to their own Tesla.

### Driver and Tesla summary

`GET /driver/dashboard`

Returns the assigned Tesla's online state and capacity summary:

```json
{
  "id": "uuid",
  "name": "Model Y 01",
  "capacity": 3,
  "isOnline": true,
  "currentArea": "Banani",
  "occupiedSeats": 2,
  "availableSeats": 1
}
```

### Go online or offline

`PATCH /driver/status`

```json
{ "isOnline": true, "currentArea": "Banani" }
```

`currentArea` is required when going online and can be sent again to update the
driver's location. Going offline uses `{ "isOnline": false }` and is rejected
with `409` while the Tesla has an active pool.

### List nearby passenger requests

`GET /driver/requests`

Returns unassigned `REQUESTED` rides whose pickup matches the authenticated
online driver's current area. Offline drivers receive an empty list.

### Accept a passenger request

`PATCH /driver/requests/:id/accept`

The first eligible driver to accept receives the ride. The API validates the
driver's online state, current area, compatible destination, and remaining
capacity. A concurrent later acceptance receives `409`.

### List assigned rides

`GET /driver/rides`

No request body. Returns active rides assigned to the authenticated driver's
Tesla, including safe passenger details and pool state:

```json
[
  {
    "id": "uuid",
    "pickup": "Banani",
    "destination": "Mohakhali",
    "status": "MATCHED",
    "fare": 4154,
    "passenger": { "id": "uuid", "name": "Amina" },
    "poolMember": {
      "pool": {
        "id": "uuid",
        "status": "WAITING",
        "tesla": { "id": "uuid", "name": "Model Y 01" }
      }
    }
  }
]
```

Possible errors: `401`, `403`, or `500` cannot fetch driver rides.

### List completed rides and earnings

`GET /driver/history`

Returns only completed rides assigned to the authenticated driver's Tesla.
Each record includes the assigned passenger and a separated receipt:

```json
[
  {
    "id": "uuid",
    "pickup": "Banani",
    "destination": "Mohakhali",
    "status": "COMPLETED",
    "passenger": { "id": "uuid", "name": "Amina" },
    "receipt": { "fare": 4154, "tip": 2500, "total": 6654 }
  }
]
```

Possible errors: `401`, `403`, or `500` cannot fetch driver history.

### Accept a pool

`PATCH /driver/pool/:id/accept`

No request body. The pool must be `WAITING`, non-empty, assigned to the
driver’s online Tesla, and identified by a UUID.
The API rechecks that active member seats do not exceed Tesla capacity before
acceptance.

```json
{ "message": "Pool accepted", "poolId": "uuid" }
```

Possible errors: `400` invalid ID, `401`, `403` another driver's pool, `404`
pool not found, `409` invalid pool/Tesla state, `500` acceptance failed.

### Mark driver arrival

`PATCH /driver/ride/:id/arrival`

No request body. Requires an accepted (`ACTIVE`) pool and a `MATCHED` ride.

```json
{
  "message": "Ride status updated to DRIVER_ARRIVED",
  "ride": { "id": "uuid", "status": "DRIVER_ARRIVED" }
}
```

Possible errors: `400` invalid ID, `401`, `403` unassigned ride, `404` ride not
found, `409` invalid pool or ride state, `500` update failed.

### Start a trip

`PATCH /driver/ride/:id/start`

No request body. Requires `DRIVER_ARRIVED`. The response shape matches the
arrival response with status `STARTED`. Possible errors: `400`, `401`, `403`,
`404`, `409`, or `500`.

### Complete a trip

`PATCH /driver/ride/:id/complete`

No request body. Requires `STARTED`. The response contains status `COMPLETED`.
When every ride in the pool is completed or cancelled, the pool becomes
`COMPLETED`. Possible errors: `400`, `401`, `403`, `404`, `409`, or `500`.

### Cancel an assigned ride

`PATCH /driver/ride/:id/cancel`

The pool must be active and the ride must still be `MATCHED`. The response
shape matches the other lifecycle endpoints with status `CANCELLED`.

### Generic lifecycle endpoint

`PATCH /rides/:id/status`

This role-protected driver endpoint supports the evaluator-facing API shape:

```json
{ "status": "DRIVER_ARRIVED" }
```

Allowed requested statuses are `DRIVER_ARRIVED`, `STARTED`, `COMPLETED`, and
`CANCELLED`. The same ownership, pool acceptance, and transition rules apply.

## Utility routes

| Method | Endpoint | Result |
| --- | --- | --- |
| `GET` | `/` | API availability message and deployed commit version |
| `GET` | `/health/ready` | Verifies API/database readiness and deployed commit version |
| `GET` | `/profile` | Verifies any authenticated JWT |
| `GET` | `/driver-only` | Verifies a driver JWT |

Unknown endpoints return `404` with `{ "message": "Route not found" }`.
