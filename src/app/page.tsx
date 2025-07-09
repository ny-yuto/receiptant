"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      redirect("/dashboard");
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="h-screen flex items-center justify-center flex-col gap-y-4">
      <h1 className="text-xl font-semibold">ようこそ！</h1>
      <div className="flex gap-4">
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            ログイン
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
