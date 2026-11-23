import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap section">
      <div className="empty"><h3>Page not found</h3><p>This ad may have been sold or deleted.</p><Link className="btn btn-primary" href="/browse">Browse listings</Link></div>
    </div>
  );
}
