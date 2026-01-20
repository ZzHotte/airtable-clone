"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef } from "react";

export function GoogleSignInButton() {
  const originalFaviconRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationStartRef = useRef<number | null>(null);

  useEffect(() => {
    // Store original favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      originalFaviconRef.current = favicon.href;
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      restoreFavicon();
    };
  }, []);

  const drawSpinner = (canvas: HTMLCanvasElement, rotation: number) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 32;
    const center = size / 2;
    const radius = 12;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw rotating spinner
    ctx.strokeStyle = "#011435";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(
      center,
      center,
      radius,
      rotation,
      rotation + Math.PI * 1.5,
      false
    );
    ctx.stroke();
  };

  const setLoadingFavicon = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    
    animationStartRef.current = performance.now();

    const animate = (timestamp: number) => {
      if (!animationStartRef.current) {
        animationStartRef.current = timestamp;
      }
      
      const elapsed = timestamp - animationStartRef.current;
      const rotation = (elapsed / 1000) * Math.PI * 2; // Rotate once per second

      drawSpinner(canvas, rotation);

      // Update favicon
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }
      favicon.href = canvas.toDataURL();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const restoreFavicon = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      animationStartRef.current = null;
    }

    if (originalFaviconRef.current) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = originalFaviconRef.current;
      }
    }
  };

  const handleGoogleSignIn = async () => {
    // Set loading favicon immediately
    setLoadingFavicon();
    
    try {
      await signIn("google", {
        callbackUrl: "/dashboard", // Redirect to dashboard after successful sign-in
      });
      // Note: The page will redirect, so animation will stop automatically
    } catch (error) {
      // Restore favicon if sign-in fails
      restoreFavicon();
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="flex items-center justify-center w-full h-10 px-3 gap-3 rounded-[6px] border border-gray-300 bg-white text-[#011435] text-[15px] leading-4 font-normal transition-shadow hover:shadow-[0px_2px_4px_0px_rgba(0,0,0,0.12)]"
    >
      <span className="flex items-center justify-center h-4 w-4">
        <svg width="16" height="16" viewBox="0 0 18 18">
          <path
            d="M17.64,9.20454545 C17.64,8.56636364 17.5827273,7.95272727 17.4763636,7.36363636 L9,7.36363636 L9,10.845 L13.8436364,10.845 C13.635,11.97 13.0009091,12.9231818 12.0477273,13.5613636 L12.0477273,15.8195455 L14.9563636,15.8195455 C16.6581818,14.2527273 17.64,11.9454545 17.64,9.20454545 L17.64,9.20454545 Z"
            fill="#4285F4"
          />
          <path
            d="M9,18 C11.43,18 13.4672727,17.1940909 14.9563636,15.8195455 L12.0477273,13.5613636 C11.2418182,14.1013636 10.2109091,14.4204545 9,14.4204545 C6.65590909,14.4204545 4.67181818,12.8372727 3.96409091,10.71 L0.957272727,10.71 L0.957272727,13.0418182 C2.43818182,15.9831818 5.48181818,18 9,18 L9,18 Z"
            fill="#34A853"
          />
          <path
            d="M3.96409091,10.71 C3.78409091,10.17 3.68181818,9.59318182 3.68181818,9 C3.68181818,8.40681818 3.78409091,7.83 3.96409091,7.29 L3.96409091,4.95818182 L0.957272727,4.95818182 C0.347727273,6.17318182 0,7.54772727 0,9 C0,10.4522727 0.347727273,11.8268182 0.957272727,13.0418182 L3.96409091,10.71 L3.96409091,10.71 Z"
            fill="#FBBC05"
          />
          <path
            d="M9,3.57954545 C10.3213636,3.57954545 11.5077273,4.03363636 12.4404545,4.92545455 L15.0218182,2.34409091 C13.4631818,0.891818182 11.4259091,0 9,0 C5.48181818,0 2.43818182,2.01681818 0.957272727,4.95818182 L3.96409091,7.29 C4.67181818,5.16272727 6.65590909,3.57954545 9,3.57954545 L9,3.57954545 Z"
            fill="#EA4335"
          />
        </svg>
      </span>
      <span>
        Continue with <span className="font-semibold">Google</span>
      </span>
    </button>
  );
}
