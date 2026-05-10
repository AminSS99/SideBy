import { useEffect } from "react";

/**
 * usePageTitle
 * Updates the document title when the component mounts.
 * Appends the product name automatically.
 */
export const usePageTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} · SideBy` : "SideBy";
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default usePageTitle;
