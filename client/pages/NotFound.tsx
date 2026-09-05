import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "lucide-react";
import PlaceholderPage from "@/components/PlaceholderPage";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <PlaceholderPage
      icon={Compass}
      title="Page not found"
      description="This screen doesn't exist yet. Head back to your class overview."
    />
  );
};

export default NotFound;
