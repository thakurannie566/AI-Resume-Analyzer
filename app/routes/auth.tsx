import React, { useEffect } from "react";
import { useLocation, useNavigate, type NavigateFunction } from "react-router";
import { usePuterStore } from "~/lib/puter";

export const meta: () => any = () => [
  { title: "Resumind | Auth" },
  { name: "description", context: "Log into your account" },
];

const Auth = () => {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const next: string = location.search.split("next=")[1];
  const navigate: NavigateFunction = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) navigate(next);
  }, [auth.isAuthenticated, next]);
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
      <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1>Welcome</h1>
            <h2>Log In to Continue Your Job Journey </h2>
          </div>
          <div className="animate-pulse">
            {isLoading ? (
              <button className="auth-button" disabled>
                <p>Signing you in....</p>
              </button>
            ) : auth.isAuthenticated ? (
              <button className="auth-button" onClick={auth.signOut}>
                <p>Log out</p>
              </button>
            ) : (
              <button className="auth-button" onClick={auth.signIn}>
                <p>Log in</p>
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Auth;
