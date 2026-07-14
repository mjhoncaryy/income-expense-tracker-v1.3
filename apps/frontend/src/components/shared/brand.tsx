import { Landmark } from "lucide-react";
import { Link } from "react-router-dom";

export function Brand() {
  return <Link to="/" className="brand" aria-label="Income-Outcome Tracker, beranda">
    <span className="brand-mark"><Landmark size={17} aria-hidden="true" /></span>
    <span>Arusku</span>
  </Link>;
}
