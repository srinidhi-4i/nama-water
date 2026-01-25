# Routing Architecture Documentation

## Two-Tier Routing Structure

The nama-water application uses a two-tier routing structure to separate public (guest) and protected (staff) routes.

### Public Routes (No Authentication Required)

**Location**: `src/app/branchoperations/`

**Purpose**: Guest user services - accessible without login

**Routes**:
- `/branchoperations/guest/[serviceId]` - Guest service forms (water leakage, complaints, etc.)

**Why Outside (dashboard)**:
- Guest users are NOT authenticated
- Should NOT require login
- Should NOT be protected by dashboard layout/middleware

### Protected Routes (Authentication Required)

**Location**: `src/app/(dashboard)/branch-operations/`

**Purpose**: Staff operations - requires authentication

**Routes**:
- `/branch-operations/validate` - Customer validation and search
- `/branch-operations/account-dashboard/[accountNumber]` - Account details
- `/branch-operations/account-payment/[id]` - Payment processing
- `/branch-operations/registration/[step]` - Customer registration wizard
- `/branch-operations/otp-log/[mobile]` - OTP log retrieval

**Why Inside (dashboard)**:
- Staff-only operations
- Requires authentication
- Protected by dashboard layout and middleware

## Folder Structure Pattern

### Correct Pattern (Implemented)

```
src/
├── app/
│   ├── (dashboard)/                    # Protected routes
│   │   ├── branch-operations/
│   │   │   ├── validate/
│   │   │   │   ├── page.tsx           # Minimal: calls ValidateSearch
│   │   │   │   ├── user/[type]/[id]/
│   │   │   │   │   └── page.tsx       # Minimal: extracts params, calls UserProfileResult
│   │   │   │   └── rop/[civilId]/[date]/
│   │   │   │       └── page.tsx       # Minimal: extracts params, calls ROPProfileResult
│   │   │   ├── account-dashboard/[accountNumber]/
│   │   │   │   └── page.tsx           # Minimal: extracts param, calls AccountDashboard
│   │   │   └── registration/[step]/
│   │   │       └── page.tsx           # Minimal: extracts param, calls RegistrationWizard
│   │   └── water-shutdown/
│   │       ├── page.tsx                # Redirects to list
│   │       ├── list/
│   │       │   ├── page.tsx            # Minimal: calls WaterShutdownList
│   │       │   └── columns.tsx
│   │       ├── create/
│   │       │   └── page.tsx            # Minimal: calls WaterShutdownCreate
│   │       ├── edit/[eventId]/
│   │       │   └── page.tsx            # Minimal: extracts param, calls WaterShutdownEdit
│   │       ├── view/[eventId]/
│   │       │   └── page.tsx            # Minimal: extracts param, calls WaterShutdownView
│   │       └── templates/
│   │           ├── page.tsx            # Minimal: calls TemplateList
│   │           ├── columns.tsx
│   │           └── [id]/
│   │               └── page.tsx        # Minimal: extracts params, calls TemplateView
│   └── branchoperations/               # Public routes
│       └── guest/[serviceId]/
│           └── page.tsx                # Minimal: extracts param, calls GuestServicePage
└── components/pages/
    ├── branchoperation/                # ALL business logic here
    │   ├── validate/
    │   │   ├── validateorsearch.tsx
    │   │   ├── UserProfileResult.tsx
    │   │   └── ROPProfileResult.tsx
    │   ├── account-dashboard/
    │   │   └── AccountDashboard.tsx
    │   ├── registration/
    │   │   └── RegistrationWizard.tsx
    │   └── guest/
    │       └── GuestServicePage.tsx
    └── watershutdown/                  # ALL business logic here
        ├── WaterShutdownList.tsx
        ├── WaterShutdownCreate.tsx
        ├── WaterShutdownEdit.tsx
        ├── WaterShutdownView.tsx
        └── WaterShutdownTemplateView.tsx
```

## Rules

### ✅ DO:
1. Keep ALL page.tsx files minimal (< 15 lines)
2. Only extract params/searchParams in page.tsx
3. Put ALL business logic in components/pages/
4. Separate public (guest) and protected (staff) routes
5. Use dynamic routes [param] for variable paths

### ❌ DON'T:
1. Put useState/useEffect in page.tsx
2. Put business logic in page.tsx
3. Mix public and protected routes
4. Create unnecessary folder nesting

## Verification

To verify the structure is correct:

```bash
# Check for logic in page.tsx files
grep -r "useState\|useEffect" src/app/(dashboard)/*/page.tsx

# Should return NO results

# Check page.tsx file sizes
find src/app/(dashboard) -name "page.tsx" -exec wc -l {} \;

# All should be < 15 lines
```

## Benefits

1. **Clear Separation**: Public vs protected routes are obvious
2. **Security**: Authentication enforced at folder level
3. **Maintainability**: Logic is centralized in components
4. **Testability**: Components can be tested independently
5. **Scalability**: Easy to add new routes following the pattern
