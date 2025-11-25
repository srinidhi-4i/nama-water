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
            const encodedUsername = encodeURIComponent(encryptedUsername);
            const encodedPassword = encodeURIComponent(encryptedPassword);

            const ldapFormData = new FormData();
            ldapFormData.append('UserName', encodedUsername);
            ldapFormData.append('Password', encodedPassword);

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

            console.log('Step 2: Getting branch details');
            console.log('Using plain UserADId:', loginData.username);

            // STEP 2: Get Branch Details with PLAIN username (not encrypted)
            const branchFormData = new FormData();
            branchFormData.append('UserADId', loginData.username); // Plain username, not encrypted

            const branchResponse = await api.post<any>('/api/auth/details', branchFormData);

            console.log('Branch Response:', branchResponse.data);

            if (branchResponse.data && branchResponse.data.StatusCode === 605) {
                const user = branchResponse.data.Data;

                if (user && user.UserID === 0) {
                    throw {
                        message: user.Outmessage || 'Invalid user',
                        statusCode: 605,
                    };
                }

                if (typeof window !== 'undefined' && user) {
                    const encryptedUser = encryptData(user);
                    localStorage.setItem(STORAGE_KEYS.BRANCH_USER_DATA, encryptedUser);

                    if (rememberMe) {
                        const encryptedUsername = encryptData(loginName);
                        localStorage.setItem('b\\u//n\\', encryptedUsername);
                    }

                    const dummyToken = 'branch-authenticated';
                    if (rememberMe) {
                        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, dummyToken);
                    } else {
                        sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, dummyToken);
                    }
                }

                return user;
            }

            throw {
                message: branchResponse.data?.Status || 'Failed to get branch details',
                statusCode: branchResponse.data?.StatusCode,
            };
        } catch (error: any) {
            console.error('Login error:', error);
            throw {
                message: error.message || 'Login failed',
                statusCode: error.statusCode,
                originalError: error
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
            localStorage.removeItem(STORAGE_KEYS.BRANCH_USER_DATA);
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem('branchAccountSearch');
        }
    },

    getCurrentUser: (): BranchUser | null => {
        if (typeof window === 'undefined') return null;
        const encryptedUser = localStorage.getItem(STORAGE_KEYS.BRANCH_USER_DATA);
        if (!encryptedUser) return null;
        return decryptData<BranchUser>(encryptedUser);
    },

    isAuthenticated: (): boolean => {
        if (typeof window === 'undefined') return false;
        const user = authService.getCurrentUser();
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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
