"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeSlash, ArrowLeft } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// ── Auth form fields ───────────────────────────────────────────────────────
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function InputField({ label, error, className, type, ...props }: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#022c22]">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          className={cn(
            "w-full h-11 px-3.5 rounded-lg border text-sm text-[#022c22] bg-white transition-all duration-150 outline-none",
            "placeholder:text-[#bbbdbd]",
            "border-[#bbbdbd] hover:border-[#6a6c6c]",
            "focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20",
            error && "border-red-400 focus:border-red-400 focus:ring-red-100",
            isPassword && "pr-10",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbbdbd] hover:text-[#6a6c6c] transition-colors"
          >
            {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

import { useLoginMutation } from "@/lib/api/authApi";
import { useSignupMutation } from "@/lib/api/authApi";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { setCredentials } from "@/lib/features/authSlice";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// ── Login Form ─────────────────────────────────────────────────────────────
export function LoginForm() {
  const [email, setEmail] = useState("johnajayi2008@gmail.com");
  const [password, setPassword] = useState("1234");
  const [login, { isLoading: loading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials(result));
      toast.success('Welcome back', 'You have successfully logged in.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Login failed', err?.data?.error?.message || err?.data?.detail || 'Please check your credentials.');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-5 bg-[#022c22] relative overflow-hidden">
      {/* African pattern animated background */}
      <div 
        className="absolute inset-0 opacity-10 animate-bg-scroll pointer-events-none" 
        style={{ backgroundImage: 'url("/african_pattern.png")', backgroundSize: '300px' }} 
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] bg-white rounded-2xl p-8 md:p-10 shadow-2xl shadow-black/20 relative z-10"
      >
        <div className="flex justify-between items-center mb-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#6a6c6c] hover:text-[#022c22] transition-colors">
            <ArrowLeft size={14} />
            Back
          </Link>
          <Logo size="md" />
        </div>

        <h1 className="text-2xl font-semibold text-[#022c22] mb-2 tracking-tighter">Welcome back</h1>
        <p className="text-sm text-[#6a6c6c] mb-8">Log in to your Avenue account.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField label="Email" type="email" placeholder="dev@yourapp.io" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <InputField label="Password" type="password" placeholder="Your password" required value={password} onChange={(e) => setPassword(e.target.value)} />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[#6a6c6c] cursor-pointer">
              <input type="checkbox" className="rounded border-[#bbbdbd] accent-[#022c22]" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-[#10b981] hover:text-[#059669] transition-colors">
              Forgot password?
            </Link>
          </div>

          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={loading}
            className="w-full justify-center mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full block"
                />
                Logging in…
              </span>
            ) : (
              "Log in"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-[#6a6c6c] mt-8">
          No account?{" "}
          <Link href="/signup" className="text-[#022c22] font-semibold hover:text-[#10b981] transition-colors">
            Sign up free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

// ── Signup Form ────────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-[#e4e7e9]", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-400"];

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 rounded-full transition-all duration-300", i < strength ? colors[strength] : "bg-[#e4e7e9]")}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", strength < 2 ? "text-red-500" : strength < 3 ? "text-amber-600" : "text-emerald-600")}>
        {labels[strength]}
      </p>
    </div>
  );
}

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signup, { isLoading: loading }] = useSignupMutation();
  const toast = useToast();
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup({ email, password, company_name: companyName }).unwrap();
      toast.success('Account created', 'Proceed to login.');
      router.push('/login');
    } catch (err: any) {
      toast.error('Signup failed', err?.data?.error?.message || err?.data?.detail || 'An error occurred.');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-5 bg-[#022c22] relative overflow-hidden">
      {/* African pattern animated background */}
      <div 
        className="absolute inset-0 opacity-10 animate-bg-scroll pointer-events-none" 
        style={{ backgroundImage: 'url("/african_pattern.png")', backgroundSize: '300px' }} 
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] bg-white rounded-2xl p-8 md:p-10 shadow-2xl shadow-black/20 relative z-10"
      >
        <div className="flex justify-between items-center mb-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#6a6c6c] hover:text-[#022c22] transition-colors">
            <ArrowLeft size={14} />
            Back
          </Link>
          <Logo size="md" />
        </div>

        <h1 className="text-2xl font-semibold text-[#022c22] mb-2 tracking-tighter">Demo Mode Active</h1>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
          <p className="text-sm text-amber-800 leading-relaxed">
            Due to deployment constraints on our hosting provider right before the hackathon submission window, new account registrations are temporarily paused.
            <br /><br />
            To evaluate the platform, please use the pre-configured test account. The login page has been automatically filled with the test credentials for your convenience.
          </p>
        </div>

        <Link href="/login" className="block w-full">
          <Button variant="primary" size="lg" className="w-full justify-center">
            Proceed to Login
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
