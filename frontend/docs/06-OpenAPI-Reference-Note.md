# OpenAPI Reference Note

## Purpose
This note records the current backend API reference that the frontend should prioritize.
It is based on the shared OpenAPI file:
- `기본 모듈.openapi.json`

## Current Source Of Truth
Until a newer backend spec is shared, the frontend should treat the following endpoints as the primary integration baseline.

## Core Endpoints
- `POST /guest/session`
- `POST /renew/session`
- `POST /onboarding`
- `GET /profile`
- `PATCH /profile`
- `GET /profiles/targets`
- `GET /preferences`
- `POST /preferences/foods`
- `DELETE /preferences/foods`
- `GET /foods/search`
- `GET /meals`
- `POST /meals`
- `PATCH /meals/{mealId}`
- `DELETE /meals/{mealId}`
- `GET /meals/summary`

## Frontend Guidance
- Use the OpenAPI spec above as the default reference when adjusting frontend services, types, and request/response shapes.
- If current frontend mocks or temporary types differ from the OpenAPI spec, prefer aligning to the OpenAPI spec unless the backend team communicates otherwise.
- Treat undocumented or missing endpoints as pending, not final.

## Pending / Not Yet Shared
The following areas are still considered pending because they were not included in the shared OpenAPI file.
- image upload API
- OCR / food classification API
- confidence/result response schema for image analysis

## Notes
- The image upload / OCR flow in the frontend is currently scaffolded and should be finalized after the backend team shares the updated spec.
- If a newer Apidog/OpenAPI export is shared, this file should be updated together with any related frontend API types and services.
