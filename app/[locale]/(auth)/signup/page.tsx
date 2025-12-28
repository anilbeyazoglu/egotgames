"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SignupPage() {
  const t = useTranslations("Auth.signup");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Update profile with display name (username/handle)
      await updateProfile(userCredential.user, {
        displayName: username,
      });
      console.log("User signed up:", userCredential.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-neutral-400">{t("description")}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-neutral-300">
            {t("usernameLabel")}
          </Label>
          <Input
            id="username"
            placeholder="RetroMaster99"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-white/20 focus:ring-white/20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-neutral-300">
            {t("emailLabel")}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="player@egotgames.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-white/20 focus:ring-white/20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-neutral-300">
            {t("passwordLabel")}
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-white/20 focus:ring-white/20"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-white text-black hover:bg-neutral-200 font-bold h-11"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="underline hover:text-white transition-colors"
        >
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
