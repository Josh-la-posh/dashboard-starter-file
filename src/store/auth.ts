import { create } from "zustand";
import { persist } from "zustand/middleware";
import { popIntendedRoute } from "../lib/redirect";
import { scheduleRefreshFromToken, clearScheduledRefresh } from "../lib/authRefreshManager";

const USE_REFRESH_TOKEN = import.meta.env.VITE_USE_REFRESH_TOKEN === "true";

type User = { id: string; email: string; name?: string; emailVerified?: boolean; role?: string };

type ComplianceStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | null;
type State = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hydrating: boolean;
  complianceStatus: ComplianceStatus;
};
type Actions = {
  setSession: (payload: { user: User; accessToken: string; complianceStatus?: ComplianceStatus }) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
  consumeIntendedRoute: () => string | null;
  hydrateFromRefresh?: () => Promise<void>;
  isTokenExpired: () => boolean;
  setHydrating: (val: boolean) => void;
  setComplianceStatus: (status: ComplianceStatus) => void;
};

function isExpired(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload));
    return Date.now() >= exp * 1000;
  } catch {
    return true; // invalid token
  }
}

export const useAuthStore = create<State & Actions>()(
  persist(
    (set, get) => ({
  user: null,
      accessToken: null,
      isAuthenticated: false,
      hydrating: true,
  complianceStatus: null,

      setSession: ({ user, accessToken, complianceStatus }) => {
        set({ user, accessToken, isAuthenticated: true, complianceStatus: complianceStatus ?? null });
        if (USE_REFRESH_TOKEN) {
          scheduleRefreshFromToken(accessToken).catch(() => {});
        }
      },

      setAccessToken: (accessToken) => {
        set({ accessToken, isAuthenticated: !!accessToken && !!get().user });
        if (USE_REFRESH_TOKEN && accessToken) {
          scheduleRefreshFromToken(accessToken).catch(() => {});
        }
      },

      logout: () => {
        if (USE_REFRESH_TOKEN) clearScheduledRefresh();
        set({ user: null, accessToken: null, isAuthenticated: false, complianceStatus: null });
      },
  setComplianceStatus: (status) => set({ complianceStatus: status }),

      consumeIntendedRoute: () => popIntendedRoute(),

      hydrateFromRefresh: USE_REFRESH_TOKEN
        ? async () => {
            try {
              const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include",
              });
              if (!res.ok) throw new Error("Refresh failed");
              const data = await res.json();
              if (data?.accessToken && get().user) {
                get().setAccessToken(data.accessToken);
              }
            } catch {
              get().logout();
            } finally {
              get().setHydrating(false);
            }
          }
        : undefined,

      isTokenExpired: () => {
        const token = get().accessToken;
        if (!token) return true;
        return isExpired(token);
      },

      setHydrating: (val) => set({ hydrating: val }),
    }),
    {
      name: "auth",
      partialize: (state) => {
        if (USE_REFRESH_TOKEN) {
          // persist only user info
          return { user: state.user, isAuthenticated: state.isAuthenticated };
        } else {
          // persist both user + token
          return {
            user: state.user,
            accessToken: state.accessToken,
            isAuthenticated: state.isAuthenticated,
          };
        }
      },
      onRehydrateStorage: () => (state) => {
        // hydration done after Zustand loads from storage
        if (state) state.hydrating = false;
      },
    }
  )
);

// 🟢 Auto-expiry check for non-refresh mode
if (!USE_REFRESH_TOKEN) {
  const { accessToken, logout } = useAuthStore.getState();
  if (accessToken && isExpired(accessToken)) {
    logout();
  }
}
