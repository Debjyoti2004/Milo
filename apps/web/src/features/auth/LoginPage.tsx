import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@gym/shared";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { ApiClientError } from "@/lib/api";
import { useLogin } from "@/lib/useAuth";
import { useToastStore } from "@/stores/toastStore";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const showToast = useToastStore((s) => s.show);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (input: LoginInput) => {
    login.mutate(input, {
      onSuccess: () => navigate("/"),
      onError: (err) => {
        const message = err instanceof ApiClientError ? err.message : "Couldn't log in";
        showToast(message, "error");
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/favicon.svg" alt="Milo" className="size-12 rounded-2xl" />
          <h1 className="text-2xl font-bold text-text">Welcome back</h1>
          <p className="text-sm text-text-secondary">Log in to get back to your plan</p>
        </div>

        {/* Google button */}
        <a
          href="/api/auth/google"
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-surface"
        >
          <GoogleIcon />
          Continue with Google
        </a>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldWrapper label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          </FieldWrapper>
          <FieldWrapper label="Password" error={errors.password?.message}>
            <Input type="password" autoComplete="current-password" placeholder="••••••••" {...register("password")} />
          </FieldWrapper>
          <Button type="submit" size="lg" loading={login.isPending} className="mt-2">
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          New here?{" "}
          <Link to="/signup" className="font-medium text-accent">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
