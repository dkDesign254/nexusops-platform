import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, Chrome, KeyRound } from "lucide-react";

export default function AuthPanel() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const utils = trpc.useUtils();
  const syncSession = trpc.auth.exchangeSupabaseSession.useMutation();
  const register = trpc.auth.register.useMutation();

  useEffect(() => {
    const trySync = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        await syncSession.mutateAsync({ accessToken: token });
        await utils.auth.me.invalidate();
      }
    };
    trySync();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === "signup") {
        await register.mutateAsync({ email, password, name });
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const token = data.session?.access_token;
      if (!token) throw new Error("No access token returned");

      await syncSession.mutateAsync({ accessToken: token });
      await utils.auth.me.invalidate();

      toast.success("Signed in successfully");
    } catch (err) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col gap-6 p-8 max-w-sm w-full">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold mt-4">AgentOps Platform</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to monitor workflows, track agents, and act without complexity." : "Create an account"}
          </p>
        </div>

        {mode === "signup" && (
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        )}

        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
            />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Processing..." : mode === "signin" ? "Sign in" : "Sign up"}
        </Button>

        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-xs text-muted-foreground">
          {mode === "signin" ? "Create account" : "Already have an account? Sign in"}
        </button>

        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: window.location.origin },
            });
          }}
          >
          <Chrome className="w-4 h-4 mr-2" />
          Continue with Google
        </Button><Button
                   variant="outline"
                   onClick={async () => {
                     await supabase.auth.signInWithOAuth({
                       provider: "google",
                       options: { redirectTo: window.location.origin },
                     });
                   }}
                   >
          <Chrome className="w-4 h-4 mr-2" />
          Continue with Google
        </Button>
        <button
          onClick={async () => {
            if (!email) {
              toast.error("Enter your email first");
              return;
            }
            
            setResetLoading(true);
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(email);
              if (error) throw error;
              toast.success("Check your email for reset link");
            } catch (e: any) {
              toast.error(e.message);
            } finally {
              setResetLoading(false);
            }
          }}
          className="text-xs text-primary"
          >
          <KeyRound className="inline w-3 h-3 mr-1" />
          {resetLoading ? "Sending..." : "Forgot password?"}
        </button>
      </div>
    </div>
  );
}
