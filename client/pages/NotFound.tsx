import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="space-y-3 py-10 text-center">
      <h1 className="font-heading text-2xl font-bold">This page is not in Sahayak</h1>
      <p className="text-sm text-muted-foreground">Head back to your class overview.</p>
      <Link to="/" className="font-semibold text-primary">
        Home
      </Link>
    </div>
  );
}
