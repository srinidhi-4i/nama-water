# Branch Operations Implementation Plan

## Overview
Create Branch Operations functionality with two main features:
1. Validate/Search a Customer
2. Guest User Service

## Phase 1: Validate/Search Customer Page

### 1.1 Create Page Structure
- **File**: `src/app/branchoperations/validate/page.tsx`
- **Layout**: Two tabs - "Validate" and "Profile Data"
- **Components**: Dropdown select, dynamic form fields, search button

### 1.2 Validation Types (Dropdown Options)
Based on ValidateUser.jsx lines 99-108:
1. **Account Payment** - Redirects to payment page
2. **Account Search** - Search by account number
3. **Civil ID** - Search by Civil ID
4. **CR Number** - Search by CR Number
5. **Get Customer ROP details** - Validate using ROP
6. **GSM Number** - Search by mobile number
7. **Request Number Search** - Search by request number
8. **Retrieve the OTP Log** - View OTP logs

### 1.3 Dynamic Form Fields
Each validation type shows different input fields:

#### Account Search
- Input: Account Number
- Button: Search
- Action: Navigate to ProfileDataAndTabsAccountNumber

#### Civil ID
- Input: Civil ID (text input)
- Button: Search
- Action: Validate and show user details

#### GSM Number
- Input: Mobile Number (8 digits, starts with 7 or 9)
- Prefix: 968
- Button: Search
- Action: Validate and show user details

#### CR Number
- Input: CR Number
- Button: Search
- Action: Validate and show user details

#### Request Number Search
- Input: Request Number
- Button: Search
- Action: Open AQ form in new tab

#### Retrieve OTP Log
- Input: Mobile Number
- Button: Search
- Action: Navigate to OTP log screen

#### Get Customer ROP details
- Input 1: Civil ID/National ID
- Input 2: Expiry Date (DatePicker)
- Button: Search
- Action: Fetch and display ROP user details

### 1.4 API Endpoints
- `BranchOfficer/GetAllList` - Get validation types
- `BranchOfficer/GetBranchOfficerCivilID` - Validate user
- `BranchOfficer/GetROPUserDetails` - Get ROP details
- `BranchOfficer/GetAQUrlfromServiceNo` - Get AQ URL
- `CommonService/GetServiceType` - Get service type
- `CommonService/GetCustomerInfoService` - Get customer info

### 1.5 UI Components Needed
- Select dropdown (shadcn)
- Input fields (shadcn)
- Button (shadcn)
- Tabs (shadcn)
- DatePicker (react-day-picker with shadcn)
- Modal/Dialog (shadcn)

## Phase 2: Guest User Service Page

### 2.1 Create Page Structure
- **File**: `src/app/branchoperations/guest/page.tsx`
- **Purpose**: Allow guest users to access services without full registration

## Phase 3: Types & Services

### 3.1 Create Types
- **File**: `src/types/branchops.types.ts`
- ValidationType interface
- ValidationRequest interface
- ValidationResponse interface

### 3.2 Create Services
- **File**: `src/services/branchops.service.ts`
- getValidationTypes()
- validateUser()
- getROPUserDetails()
- getCustomerInfo()

## Phase 4: Route Updates

### 4.1 Update Sidebar Menu
- Add proper routes for Branch Operations submenus
- `/branchoperations/validate` - Validate/Search Customer
- `/branchoperations/guest` - Guest User Service

## Implementation Order

### Step 1: Create Types ✅
Create `branchops.types.ts` with all interfaces

### Step 2: Create Service ✅
Create `branchops.service.ts` with API calls

### Step 3: Create Validate Page ✅
Create the main validate/search customer page with:
- Dropdown for validation types
- Dynamic form rendering
- Search functionality

### Step 4: Create Guest User Page ✅
Create guest user service page

### Step 5: Update Routes ✅
Update sidebar and routing configuration

### Step 6: Testing ✅
Test all validation types and flows

## Design Requirements

### Colors & Styling
- Primary: Teal-900 (#115e59)
- Accent: Red-500 for active states
- Background: White/Gray-50
- Borders: Gray-200

### Components
- Use shadcn/ui components
- Follow existing Header/Sidebar design
- Maintain consistent spacing and typography
- Responsive design for mobile/tablet

### Validation
- Client-side validation for all inputs
- Error messages using toast notifications
- Loading states during API calls

## Notes
- Match exact UI from screenshots
- Use TypeScript strict mode
- Follow Next.js 14 App Router patterns
- Implement proper error handling
- Add loading spinners for async operations
