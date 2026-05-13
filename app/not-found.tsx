import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6 animate-fade-in">
        <div className="text-6xl font-black text-zinc-800">404</div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-300">Page not found</h1>
          <p className="text-sm text-zinc-600">
            The page you&#39;re looking for doesn&#39;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#A3E635] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#B5F03D] transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
