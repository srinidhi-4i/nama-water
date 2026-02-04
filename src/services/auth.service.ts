import { api } from '@/lib/axios';
import { LoginRequest, LoginResponse, BranchUser } from '@/types/auth.types';
import { encryptString, encryptData, decryptData, STORAGE_KEYS } from '@/lib/crypto';

export const authService = {
    loginBranchOps: async (
        loginData: LoginRequest,
        rememberMe: boolean,
        loginName: string
    ): Promise<BranchUser | null> => {
        try {
            console.log('Step 1: LDAP Validation');
            console.log('Username (plain):', loginData.username);

            // STEP 1: LDAP Validation with encrypted credentials
            const encryptedUsername = encryptString(loginData.username);
            const encryptedPassword = encryptString(loginData.password);

            const ldapFormData = new FormData();
            ldapFormData.append('UserName', encryptedUsername);
            ldapFormData.append('Password', encryptedPassword);

            // Proxy call to Next.js API
            const ldapResponse = await api.post<any>('/api/auth/validate', ldapFormData);

            console.log('LDAP Response:', ldapResponse.data);

            // Check for failure - API returns StatusCode 606 for failure, 605 for success
            if (!ldapResponse.data || ldapResponse.data.StatusCode === 606) {
                throw {
                    message: ldapResponse.data?.Data?.ErrMessage || 'Invalid username or password',
                    statusCode: 'Failure',
                };
            }

            // Check if StatusCode is 605 (success) and Data.StatusCode is "Success"
            if (ldapResponse.data.StatusCode !== 605 || ldapResponse.data.Data?.StatusCode !== 'Success') {
                throw {
                    message: ldapResponse.data?.Data?.ErrMessage || 'LDAP validation failed',
                    statusCode: ldapResponse.data.StatusCode,
                };
            }

            // Capture token from LDAP response (it's returned here, not in branch details)
            const ldapToken = ldapResponse.data?.Data?.Token;
            console.log('LDAP Token captured:', ldapToken ? 'Yes' : 'No');

            console.log('Step 2: Getting branch details');
            console.log('Using plain UserADId:', loginData.username);

            // STEP 2: Get Branch Details with PLAIN username (not encrypted)
            const branchFormData = new FormData();
            branchFormData.append('UserADId', loginData.username);

            const branchResponse = await api.post<any>('/api/auth/details', branchFormData);

            console.log('Branch Response:', branchResponse.data);

            if (branchResponse.data && branchResponse.data.StatusCode === 605) {
                const apiData = branchResponse.data.Data;

                if (apiData && apiData.UserID === 0) {
                    throw {
                        message: apiData.Outmessage || 'Invalid user',
                        statusCode: 605,
                    };
                }

                // Structure the user data to match React app format
                const userData = {
                    BranchUserDetails: apiData.BranchUserDetails || [],
                    BranchUserMenuDetails: apiData.BranchUserMenuDetails || [],
                    BranchUserRoleDetails: apiData.BranchUserRoleDetails || []
                };

                if (typeof window !== 'undefined' && apiData) {
                    console.log('Login successful, processing user data');
                    // Save the complete user data structure
                    const encryptedUser = encryptData(userData);
                    localStorage.setItem(STORAGE_KEYS.BRANCH_USER_DATA, encryptedUser);

                    if (rememberMe) {
                        const encryptedUsername = encryptData(loginName);
                        localStorage.setItem('b\\u//n\\', encryptedUsername);
                    }

                    // Use the token from LDAP response
                    const realToken = ldapToken || apiData.Token || apiData.token || apiData.Data?.Token || apiData.Data?.token;
                    const tokenToUse = realToken || 'branch-authenticated';

                    if (realToken) {
                        console.log('Real token found, storing it');
                    } else {
                        console.warn('No real token found, using dummy token');
                    }

                    // Store auth token (for middleware/API calls)
                    sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokenToUse);
                    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokenToUse);

                    // Also set a cookie for middleware (fallback if httpOnly cookie fails)
                    document.cookie = `auth_token=${tokenToUse}; path=/; max-age=86400; SameSite=Lax`;
                }

                return apiData;
            } else {
                throw {
                    message: branchResponse.data?.Data?.ErrMessage || 'Failed to get branch details',
                    statusCode: branchResponse.data.StatusCode,
                };
            }
        } catch (error: any) {
            console.error('Branch Ops Login Error:', error);
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
