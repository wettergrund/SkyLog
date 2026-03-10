# SkyLog — Project Instructions

## Project Layout

| Path | Purpose |
|---|---|
| `MyFlightbook.Api/` | ASP.NET Core 8 Web API |
| `DbContext/` | EF Core `AppDbContext`, models, migrations |
| `client/` | React 18 + Vite + TypeScript SPA |

Other library projects (`MyFlightbook.CSV`, `MyFlightbook.Charting`, etc.) are legacy support libraries — do not modify them unless explicitly asked.

## Backend (`MyFlightbook.Api/`)

- **Framework**: ASP.NET Core 8, controller-based (not minimal APIs)
- **Auth**: Firebase ID tokens validated via JWT Bearer. Every controller inherits `ApiControllerBase` and calls `CurrentUserAsync()` to resolve the local `AppUser`.
- **Database**: SQL Server (LocalDB for dev) via EF Core 8. `AppDbContext` lives in `DbContext/`.
- **Response envelope**: All responses use `ApiOk(data)` / `ApiOk()` / `ApiError(message, status)` from `ApiControllerBase`. Shape: `{ ok: true, data: ... }` or `{ ok: false, error: "..." }`.
- **Route prefix**: `api/v1/`
- **JSON**: camelCase, nulls omitted (`WhenWritingNull`).
- **Repositories**: Generic `IRepository<T>` / `Repository<T>` in `Repositories/`. Direct `AppDbContext` injection is also used in controllers where needed.
- **Services**: `IUserResolver` / `FirebaseUserResolver` resolve Firebase UID → local `AppUser` (auto-provisioning on first call).

### Key files
- `Program.cs` — DI setup, auth, CORS, Swagger
- `Controllers/ApiControllerBase.cs` — base class with response helpers
- `Controllers/FlightsController.cs` — example of full CRUD pattern
- `DbContext/Data/AppDbContext.cs` — DbSets, model configuration

## Database / Migrations (`DbContext/`)

- EF Core migrations live in `DbContext/Migrations/`.
- To add a migration, run from repo root:
  ```
  dotnet ef migrations add <Name> --project DbContext --startup-project MyFlightbook.Api
  ```
- To apply:
  ```
  dotnet ef database update --project DbContext --startup-project MyFlightbook.Api
  ```

## Frontend (`client/`)

- **Stack**: React 18, Vite, TypeScript, React Router v6, TanStack Query v5, Firebase JS SDK v12
- **Dev server**: `npm run dev` → `http://localhost:5173`
- **API client**: `client/src/api/client.ts` — base fetch wrapper. Domain modules: `flights.ts`, `aircraft.ts`, `auth.ts`, `currency.ts`, `totals.ts`.
- **Auth**: Firebase Auth; token attached to every API request as `Authorization: Bearer <id_token>`.
- **Pages**: `client/src/pages/` — one folder per page.
- **Types**: `client/src/types/` — TypeScript interfaces matching API DTOs.
- **Hooks**: `client/src/hooks/` — TanStack Query hooks.

## Patterns to follow

- New API endpoints: add to an existing controller or create a new one inheriting `ApiControllerBase`. Return `ApiOk`/`ApiError`. Use `CurrentUserAsync()` for the authenticated user.
- New frontend data fetching: add a function in the relevant `client/src/api/*.ts` file, a hook in `client/src/hooks/`, and consume it in the page component.
- DTOs are inline records in the controller file (same file as the endpoint). Keep them there unless reuse is needed.
- No test projects currently exist — do not create them unless asked.
