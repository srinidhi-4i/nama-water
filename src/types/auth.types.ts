// Login Request/Response Types
export interface LoginRequest {
    username: string;
    password: string;
    rememberMe: boolean;
}

export interface LoginResponse {
    success: boolean;
    user?: BranchUser;
    message?: string;
    error?: string;
}

// Branch User Data Structure
export interface BranchUser {
    userId?: string;
    username: string;
    email?: string;
    mobileNumber?: string;
    branchId?: string;
    branchName?: string;
    roleId?: string;
    roleName?: string;
    token?: string;
    menuDetails?: MenuDetail[];
    [key: string]: any; // Allow additional properties from backend
}

// Menu Details Structure
export interface MenuDetail {
    menuId: string;
    menuNameEn: string;
    menuNameAr?: string;
    applicationNameEn: string;
    applicationNameAr?: string;
    menuUrl: string;
    parentMenuId?: string;
    displayOrder?: number;
    iconClass?: string;
}

// Authentication State
export interface AuthState {
    isAuthenticated: boolean;
    user: BranchUser | null;
    loading: boolean;
    error: string | null;
}

// API Error Response
export interface ApiError {
    message: string;
    statusCode?: number;
    errors?: Record<string, string[]>;
}
