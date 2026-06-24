import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@gym/shared";
import { Flame } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { ApiClientError } from "@/lib/api";
import { useSignup } from "@/lib/useAuth";
import { useToastStore } from "@/stores/toastStore";

export function SignupPage() {
  const navigate = useNavigate();
  const signup = useSignup();
  const showToast = useToastStore((s) => s.show);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = (input: SignupInput) => {
    signup.mutate(input, {
      onSuccess: () => navigate("/onboarding"),
      onError: (err) => {
        const message = err instanceof ApiClientError ? err.message : "Couldn't sign up";
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
          <h1 className="text-2xl font-bold text-text">Create your account</h1>
          <p className="text-sm text-text-secondary">Set up your plan in under a minute</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldWrapper label="Name" error={errors.name?.message}>
            <Input autoComplete="name" placeholder="Your name" {...register("name")} />
          </FieldWrapper>
          <FieldWrapper label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          </FieldWrapper>
          <FieldWrapper label="Password" error={errors.password?.message}>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...register("password")}
            />
          </FieldWrapper>
          <Button type="submit" size="lg" loading={signup.isPending} className="mt-2">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
