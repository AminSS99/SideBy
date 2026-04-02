import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { brand } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    navigate(session ? "/app" : "/auth/sign-in", { replace: true });
  }, [isLoading, navigate, session]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/35">
          {brand.productName}
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight">
          Completing authentication
        </h1>
        <p className="mt-4 text-white/60">
          Finalizing your session with the {brand.aiEngineName}.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
