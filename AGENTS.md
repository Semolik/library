# AGENTS.md - AI Coding Guide

Essential patterns and workflows for productive development in this monorepo.

## Architecture Overview

**Monorepo Structure**: Turbo-managed workspace with three layers:
- `apps/api` - NestJS backend (port 3000)
- `apps/web` - Next.js frontend (port 3001)  
- `packages/shared-types` - Shared TypeScript DTOs, Enums (used by both frontend & backend)

**Why this structure**: Single source of truth for API contracts prevents frontend/backend sync issues. All validation rules defined once in `packages/shared-types/src/dtos.ts`.

## Critical Workflows

### Local Development Startup
```bash
npm install                    # Install monorepo dependencies
docker-compose up -d          # Start PostgreSQL (reads .env for DB_HOST, DB_PORT, etc)
npm run db:seed               # Initialize DB with roles, permissions, superuser
npm run dev                   # Start all apps in watch mode
```
Key: `.env` file in project root must exist before `docker-compose up`. Copy from `.env.example`.

### Database Changes
```bash
# Add new Entity Model → Always also update:
# 1. apps/api/src/config/database.config.ts (add to entities[] array)
# 2. packages/shared-types/src/dtos.ts (add/update DTOs)
# 3. apps/api/src/config/seed.config.ts (add to PERMISSIONS_CONFIG if RBAC-protected)
docker-compose down -v && docker-compose up -d && npm run db:seed
```
Failure to update `database.config.ts` → Model won't be recognized by TypeORM synchronize.

### Testing
```bash
cd apps/api
npm test                      # Unit tests (watches src/**/*.spec.ts)
npm run test:e2e             # E2E tests (watches test/**/*.e2e-spec.ts)
npm run start:debug          # Debug mode with inspector on port 9229
```

### Shadcn UI Components in Monorepo
When user examples contain imports like `@/components/ui/avatar`, `@/components/ui/dropdown-menu`, `@/components/ui/sidebar`, etc., do **not** hand-write local copies first. Install via shadcn CLI in the shared UI package:

```bash
npx shadcn@latest add <component-names> -c packages/ui
```

Example:
```bash
npx shadcn@latest add avatar dropdown-menu sidebar -c packages/ui
```

Why: this repo keeps reusable UI primitives in `packages/ui/src/components`, and `apps/web` consumes them via `@workspace/ui/components/*`.

## Project-Specific Patterns

### Environment Validation Pattern
**File**: `apps/api/src/config/env.validation.ts`

All env vars loaded via class with constructor—not dotenv or ConfigService lookup:
```typescript
export class EnvironmentVariables {
  @IsString()
  DATABASE_USER: string;
  
  constructor() {
    Object.assign(this, {
      DATABASE_USER: process.env.DATABASE_USER || 'postgres',
    });
  }
}
```
**Why**: Immediate values at module initialization; simpler than async ConfigService.  
**Consequence**: Env class instantiated twice (AppModule + AuthModule)—already done but flag if you add EnvironmentVariables usage elsewhere.

### Module Structure Pattern
Every domain module follows: `modules/{entity}/{models,services,controllers}/{entity}.{type}.ts`

**Example**: User module
- `modules/user/models/user.model.ts` - TypeORM @Entity
- `modules/user/services/user.service.ts` - @Injectable with @InjectRepository
- `modules/user/controllers/user.controller.ts` - @Controller routes
- `modules/user/user.module.ts` - @Module binding all three

**When adding new module**:
1. Create `modules/{name}/{models,services,controllers}` directories
2. Define model → service → controller in that order
3. Import in `modules/index.ts` AND `app.module.ts` 
4. Export service from module (`exports: [SomeService]`)

### RBAC/PBAC Guard Pattern
**Guards Location**: `modules/auth/guards/` — two separate guards always used together.

```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)  // JWT first, then roles check
@Roles('ADMIN', 'SUPERUSER')           // Check user.roles array
@Permissions(PermissionEnum.BOOK_CREATE) // Check flattened permissions from roles
async create(@Body() dto: CreateBookDto) {}
```

**Rule**: Both guards stateless; user object injected via `@CurrentUser()` decorator, role/permission names resolved from JWT payload (`user.roles` and `user.permissions`).

### Shared Types as Single Source of Truth
**File**: `packages/shared-types/src/`

- `enums.ts` - `RoleEnum` (SUPERUSER, ADMIN, USER) and `PermissionEnum` (15+ operations)
- `dtos.ts` - All request/response shapes with `class-validator` decorators

**When adding new entity**:
1. Add DTO + Create/Update variants to `dtos.ts` **first**
2. Import in backend controller from `@workspace/shared-types`
3. Frontend uses same DTOs—no schema duplication

**Consequence**: Changing a DTO field requires coordinating both frontend and backend updates.

### Database Schema Separation
Two schemas in PostgreSQL:
- `public` - Domain data (users, books, etc)
- `security` - Auth tables (roles, permissions, join tables)

Entity decorator format:
```typescript
@Entity({ name: 'books', schema: 'public' })  // Explicit schema required
export class BookModel { }
```

## Integration Points

### Auth Flow
1. `/auth/register` (UserRegisterDto) → AuthService.register()
2. Hashes password via bcrypt, creates user, assigns default USER role
3. Returns `{ accessToken: JWT, user: { id, email, roles: [...] } }`
4. Frontend stores token in localStorage, sends as `Authorization: Bearer {token}`
5. Backend validates with JwtStrategy (passport-jwt), extracts `sub` (user ID) + `roles`

### API-to-DB Flow
Controller (validates DTO) → Service (finds/creates via TypeOrmRepository) → Controller returns DTO

**Critical**: Service methods return Models (TypeORM entities); controller maps to DTOs for response. Response formatter optional (see `common/utils/response.formatter.ts`).

### Database Initialization
**File**: `apps/api/src/scripts/seed.ts`

Runs on `npm run db:seed`. Creates:
- All 15 permissions from `PermissionEnum`
- 3 roles (SUPERUSER, ADMIN, USER) + their permission assignments
- 1 superuser account from `.env` (FIRST_SUPERUSER_EMAIL/PASSWORD)

**Re-running seed**: Clears all data in permission, role, user, and join tables—use only in development.

## Naming Conventions

- **Files/Folders**: `kebab-case` (e.g., `user-role.model.ts`)
- **Classes**: `PascalCase` + suffix
  - Models: `{Entity}Model` (UserModel, BookModel)
  - Services: `{Entity}Service` (UserService, BookService)
  - Controllers: `{Entity}Controller` (UserController)
  - DTOs: `{Entity}Dto` or `Create{Entity}Dto` (UserDto, CreateBookDto)
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`

## Common Pitfalls

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| TypeORM can't find model | Model not in `database.config.ts` entities array | Add import + to entities |
| `@Roles()` decorator ignored | RolesGuard not in @UseGuards | Add RolesGuard after JwtAuthGuard |
| DTO validation fails silently | Forgot `@Validate()` import or field decorator | Add `@IsString()`, `@IsEmail()`, etc |
| Changes not reflected after `npm run dev` | Watch mode watching wrong folder | Check tsconfig include/exclude paths |
| Seed script fails on re-run | Foreign key constraints when deleting | Already handled in seed.ts via CASCADE |

## Key Files Reference

- **Entry**: `apps/api/src/main.ts`, `apps/api/src/app.module.ts`
- **Auth**: `apps/api/src/modules/auth/services/auth.service.ts`, `strategies/jwt.strategy.ts`
- **Config**: `apps/api/src/config/` (env, db, seed)
- **Shared**: `packages/shared-types/src/enums.ts`, `dtos.ts`
- **Scripts**: `apps/api/src/scripts/seed.ts`
- **Docs**: `SETUP.md` (installation), `DEVELOPMENT.md` (patterns), `CREATE_MODULE.md` (step-by-step)

## When in Doubt

1. Check `CREATE_MODULE.md` for step-by-step new entity creation
2. Copy structure from existing module (auth, user, security)
3. Run `npm run lint` + `npm run typecheck` before committing
4. If DB issues: `docker-compose down -v && docker-compose up -d && npm run db:seed`

