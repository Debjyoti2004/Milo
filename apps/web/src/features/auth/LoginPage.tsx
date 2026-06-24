import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@gym/shared";
import { Flame } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { ApiClientError } from "@/lib/api";
import { useLogin } from "@/lib/useAuth";
import { useToastStore } from "@/stores/toastStore";

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
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Flame className="size-6" />
          </div>
          <h1 className="text-2xl font-bold text-text">Welcome back</h1>
          <p className="text-sm text-text-secondary">Log in to get back to your plan</p>
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
