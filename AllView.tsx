"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7F5] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-[#E2E2DE] bg-white p-8"
      >
        <h1 className="text-lg font-semibold text-[#1A1B1E]">Kantong</h1>
        <p className="mt-1 text-sm text-[#6B6D70]">Enter the passphrase to continue.</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="mt-6 w-full rounded-md border border-[#E2E2DE] px-3 py-2 text-sm text-[#1A1B1E] outline-none focus:border-[#1E7A5F]"
          placeholder="Passphrase"
        />

        {error && <p className="mt-2 text-sm text-[#B23B3B]">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !password}
          className="mt-4 w-full rounded-md bg-[#1A1B1E] px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {submitting ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
