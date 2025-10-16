import { useMutation } from "@tanstack/react-query";
import { login, register, requestPasswordReset, verifyEmail, fetchBrandColor, saveBrandColor, setPasswordWithToken, resendConfirmation, resetPassword } from "./api";
import { useAuthStore } from "../../store/auth";
import { queryClient } from "../../lib/queryClient";
import { useThemeStore } from "../../store/theme";
import { useMerchantSelectionStore } from "../../store/merchantSelection";
import type { LoginApiResponse, SetPasswordWithTokenPayload } from "../../types/auth";
import type { AppError } from "../../lib/error";
import { toast } from "sonner";

export function useLogin() {
  const setSession = useAuthStore(s => s.setSession);
  const setMerchants = useMerchantSelectionStore(s=>s.setMerchants);
  // const setPrimaryHsl = useThemeStore(s => s.setPrimaryHsl);

  return useMutation({
    mutationFn: login,
    onSuccess: async (res: LoginApiResponse) => {
  const { accessToken, user, merchants, complianceStatus } = res.responseData;
      setSession({ user: {
        id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`, emailVerified: user.isEmailConfirmed
      }, accessToken, complianceStatus });
      if (Array.isArray(merchants)) {
        setMerchants(merchants);
      }
      const color = await fetchBrandColor().catch(() => ({ hsl: null }));
      if (color?.hsl) useThemeStore.getState().setPrimaryHsl(color.hsl);
      await queryClient.invalidateQueries();
    },
    onError: (e) => {
      const err = e as AppError;
      // avoid leaking raw errors in production logs
      // debug logging omitted to avoid leaking details in local logs
      if (err.code === "BAD_REQUEST") {
        toast.error("Invalid email or password");
      } else {
        toast.error(err.message || 'Unable to sign in');
      }
    }
  });
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => requestPasswordReset(email) });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: (token: string) => verifyEmail(token) });
}

export function useResendConfirmation() {
  return useMutation({
    mutationFn: (email: string) => resendConfirmation(email),
  });
}

export function useSetPasswordWithToken() {
  return useMutation({
    mutationFn: (payload: SetPasswordWithTokenPayload) => setPasswordWithToken(payload),
  });
}

export function useResetPasswordWithToken() {
  return useMutation({
    mutationFn: (payload: SetPasswordWithTokenPayload) => resetPassword(payload),
  });
}

export function useSaveBrandColor() {
  return useMutation({ mutationFn: saveBrandColor, onSuccess: () => queryClient.invalidateQueries() });
}