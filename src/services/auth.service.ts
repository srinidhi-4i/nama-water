import { api } from '@/lib/axios';
import { LoginRequest, LoginResponse, BranchUser } from '@/types/auth.types';
import { encryptString, encryptData, decryptData, STORAGE_KEYS } from '@/lib/crypto';
import { loginAction } from '@/app/actions/auth/login';

export const authService = {
    loginBranchOps: async (
        loginData: LoginRequest,
        rememberMe: boolean,
        loginName: string
    ): Promise<BranchUser | null> => {
        try {
            console.log('Using Server Action for Login...');

            // Call Server Action
            const result = await loginAction(loginData);

            if (!result.success || !result.data) {
                throw {
                    message: result.message || 'Login failed',
                    statusCode: 'Failure',
                };
            }

            const apiData = result.data;

            console.log('Login Server Action Success:', apiData);

            // Structure the user data to match React app format
            const userData = {
                BranchUserDetails: apiData.BranchUserDetails || [],
                BranchUserMenuDetails: apiData.BranchUserMenuDetails || [],
                BranchUserRoleDetails: apiData.BranchUserRoleDetails || []
            };

            if (typeof window !== 'undefined') {
                console.log('Processing user data on client');
                // Save the complete user data structure
                const encryptedUser = encryptData(userData);
                localStorage.setItem(STORAGE_KEYS.BRANCH_USER_DATA, encryptedUser);

                if (rememberMe) {
                    const encryptedUsername = encryptData(loginName);
                    localStorage.setItem('b\\u//n\\', encryptedUsername);
                }

                // Use the token returned by action
                const tokenToUse = result.token || apiData.Token || 'branch-authenticated';

                // Store auth token (for middleware/API calls)
                sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokenToUse);
                localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokenToUse);

                // Also set a fallback cookie on client just in case (server action sets httpOnly ones)
                document.cookie = `auth_token=${tokenToUse}; path=/; max-age=86400; SameSite=Lax`;
            }

            return apiData;

        } catch (error: any) {
            console.error('[UPDATE_CHECK_1] Branch Ops Login Error - Full Details:', {
                message: error?.message,
                response: error?.response?.data,
                status: error?.response?.status,
                stack: error?.stack
            });
            throw error;
        }
    },

    isAuthenticated: (): boolean => {
        if (typeof window === 'undefined') return false;

        const userData = localStorage.getItem(STORAGE_KEYS.BRANCH_USER_DATA);
        const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        return !!userData && !!token;
    },

    getCurrentUser: (): BranchUser | null => {
        if (typeof window === 'undefined') return null;

        const encryptedUser = localStorage.getItem(STORAGE_KEYS.BRANCH_USER_DATA);
        if (!encryptedUser) return null;

        try {
            return decryptData(encryptedUser);
        } catch (error) {
            console.error('Error decrypting user data:', error);
            return null;
        }
    },

    branchLogout: async (): Promise<void> => {
        try {
            await api.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEYS.BRANCH_USER_DATA);
                localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                localStorage.removeItem('AU/@/#/TO/#/VA'); // Legacy token key

                // Clear cookies
                document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }
        }
    }
};
