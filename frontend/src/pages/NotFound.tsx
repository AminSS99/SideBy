import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { brand } from "@/config/brand";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-white/60 mb-4">Oops! Page not found</p>
        <a href="/" className="text-purple-500 hover:text-purple-400 underline">
          Return to Home
        </a>
        <div className="mt-6">
          <a
            href={brand.url}
            className="text-sm text-white/35 transition-colors hover:text-white/70"
          >
            {brand.operatedByLine}
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
