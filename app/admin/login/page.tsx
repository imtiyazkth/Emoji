"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, secret }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.error?.message ?? "Login failed");
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 pt-16">
      <h1 className="text-xl font-bold">Admin Sign In</h1>
      <form onSubmit={handleSubmit} className="glass-card rounded-card flex flex-col gap-4 p-6">
        <label className="text-sm text-text-secondary">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2"
          />
        </label>
        <label className="text-sm text-text-secondary">
          Admin secret
          <input
            type="password"
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <button type="submit" className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white">
          Sign in
        </button>
      </form>
    </div>
  );
}
