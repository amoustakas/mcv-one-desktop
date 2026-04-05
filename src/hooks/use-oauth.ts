import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOAuthStatus, initiateOAuth, disconnectOAuth, testOAuthConnection } from '../lib/api/oauth';

// ---------------------------------------------------------------------------
// OAuth React Query Hooks
// ---------------------------------------------------------------------------

/** Fetch all OAuth connections + API key health */
export function useOAuthStatus() {
  return useQuery({
    queryKey: ['oauth', 'status'],
    queryFn: getOAuthStatus,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Initiate OAuth connect flow */
export function useOAuthConnect() {
  return useMutation({
    mutationFn: async (provider: string) => {
      const redirectUrl = await initiateOAuth(provider);
      // Full-page redirect to provider's auth page
      window.location.href = redirectUrl;
    },
  });
}

/** Disconnect an OAuth provider */
export function useOAuthDisconnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectOAuth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oauth', 'status'] });
    },
  });
}

/** Test an OAuth connection */
export function useOAuthTest() {
  return useMutation({
    mutationFn: testOAuthConnection,
  });
}
