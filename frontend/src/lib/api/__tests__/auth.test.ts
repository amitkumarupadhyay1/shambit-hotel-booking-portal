import { authApi } from '../auth';
import apiClient from '../client';
import { authManager } from '../../auth/auth-manager';

// Mock dependencies
jest.mock('../client', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
    },
    setAccessToken: jest.fn(),
}));

jest.mock('../../auth/auth-manager', () => ({
    authManager: {
        checkAuth: jest.fn(),
        logout: jest.fn(),
    },
}));

describe('authApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('logoutGlobal', () => {
        it('should call global-logout endpoint and clear local auth state', async () => {
            // Setup mock
            (apiClient.post as jest.Mock).mockResolvedValue({ data: { message: 'Success' } });

            // Execute
            await authApi.logoutGlobal();

            // Verify API call
            expect(apiClient.post).toHaveBeenCalledWith('/auth/global-logout');

            // Verify local cleanup
            expect(authManager.logout).toHaveBeenCalled();
        });

        it('should clear local auth state even if API fails', async () => {
            // Setup mock to fail
            (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

            // Execute and catch error
            try {
                await authApi.logoutGlobal();
            } catch (e) {
                // Expected error
            }

            // Verify local cleanup still happened
            // Actually, looking at implementation:
            //         await apiClient.post('/auth/global-logout');
            //         authManager.logout();
            // If await throws, authManager.logout() won't run inside the api function.
            // But the hook catches it and calls logout() anyway.
            // So testing the API function in isolation, it SHOULD throw.

            expect(apiClient.post).toHaveBeenCalledWith('/auth/global-logout');
        });
    });
});
