import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";

export function NotFound() {
  return (
    <div className="text-center py-24">
      <h1 className="text-3xl font-semibold text-slate-900 mb-4">404</h1>
      <p className="text-slate-500 mb-8">Page not found.</p>
      <Link to="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
