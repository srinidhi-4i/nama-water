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

            // Don't set Content-Type - let browser set it for FormData
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
            branchFormData.append('UserADId', loginData.username); // Plain username, not encrypted

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

                    // Always use localStorage for token to support multiple tabs/persistence
                    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokenToUse);
                    if (!rememberMe) {
                        sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokenToUse);
                    }
                }

                // Return the first user details for the toast message
                return userData.BranchUserDetails[0] || apiData;
            }

            throw {
                message: branchResponse.data?.Status || 'Failed to get branch details',
                statusCode: branchResponse.data?.StatusCode,
            };
        } catch (error: any) {
            // Re-throw standardized error without noisy console.error
            throw {
                message: error.message || 'Login failed',
                statusCode: error.statusCode,
            };
        }
    },

    login: async (data: LoginRequest) => {
        try {
            const user = await authService.loginBranchOps(data, data.rememberMe, data.username);
            if (user) return { success: true, user };
            return { success: false, message: 'Login failed' };
        } catch (error: any) {
            return { success: false, message: error.message || 'An error occurred during login' };
        }
    },

    branchLogout: () => {
        if (typeof window !== 'undefined') {
            // Clear all possible auth keys used across versions
            const keysToClear = [
                STORAGE_KEYS.BRANCH_USER_DATA,
                STORAGE_KEYS.AUTH_TOKEN,
                'AU/@/#/TO/#/VA',
                'brUd/APtiypx/sw7lu83P7A==',
                'wcb/APtiypx/sw7lu83P7A==',
                'branchAccountSearch',
                'b\\u//n\\'
            ];

            keysToClear.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });

            localStorage.clear();
            sessionStorage.clear();

            // Force redirect to login
            window.location.href = '/login';
        }
    },

    getCurrentUser: (): BranchUser | null => {
        if (typeof window === 'undefined') return null;
        const encryptedUser = localStorage.getItem(STORAGE_KEYS.BRANCH_USER_DATA);
        if (!encryptedUser) return null;
        try {
            return decryptData<BranchUser>(encryptedUser);
        } catch (e) {
            return null;
        }
    },

    isAuthenticated: (): boolean => {
        if (typeof window === 'undefined') return false;
        const user = authService.getCurrentUser();
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
            sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
            localStorage.getItem('AU/@/#/TO/#/VA');
        return !!(user && token);
    },

    generateOTP: async (mobileOrEmail: string) => {
        console.log('Generating OTP for:', mobileOrEmail);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true };
    },

    validateOTP: async (otp: string) => {
        console.log('Validating OTP:', otp);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (otp === '1234') return { success: true };
        return { success: false, message: 'Invalid OTP' };
    },
};
