"use client";

// NOTE:
// This project currently does not define any tRPC "post" router on the backend,
// so the original demo component that called `api.post.getLatest` and
// `api.post.create` caused TypeScript build errors on Vercel.
//
// To keep the build green, we provide a placeholder component here.
// If you later add a real tRPC router, you can re‑implement this component
// to call your procedures.

export function LatestPost() {
  return (
    <div className="w-full max-w-xs">
      <p className="text-sm text-gray-500">
        Latest posts will appear here once tRPC routes are implemented.
      </p>
    </div>
  );
}
