"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GoogleSignInButton } from "./_components/google-signin-button";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render sign-in form if authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  return (
    <main className="w-full bg-white h-screen">
      <div className="w-full max-w-[1536px] h-screen mx-auto md:mx-auto">
        <div className="grid h-full lg:grid-cols-[50%_50%]">
          {/* Left: Sign in form */}
          <div className="flex items-center justify-center w-full lg:pt-0 lg:-mt-2">
            <div className="box-border flex flex-col w-full max-w-[360px] md:max-w-[500px]">
              {/* Logo */}
              <div className="flex justify-start mt-0 md:mt-5">
                <svg
                  width="42"
                  height="35.7"
                  viewBox="0 0 200 170"
                  style={{ shapeRendering: "geometricPrecision" }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g>
                    <path
                      fill="rgb(255, 186, 5)"
                      d="M90.0389,12.3675 L24.0799,39.6605 C20.4119,41.1785 20.4499,46.3885 24.1409,47.8515 L90.3759,74.1175 C96.1959,76.4255 102.6769,76.4255 108.4959,74.1175 L174.7319,47.8515 C178.4219,46.3885 178.4609,41.1785 174.7919,39.6605 L108.8339,12.3675 C102.8159,9.8775 96.0559,9.8775 90.0389,12.3675"
                    />
                    <path
                      fill="rgb(57, 202, 255)"
                      d="M105.3122,88.4608 L105.3122,154.0768 C105.3122,157.1978 108.4592,159.3348 111.3602,158.1848 L185.1662,129.5368 C186.8512,128.8688 187.9562,127.2408 187.9562,125.4288 L187.9562,59.8128 C187.9562,56.6918 184.8092,54.5548 181.9082,55.7048 L108.1022,84.3528 C106.4182,85.0208 105.3122,86.6488 105.3122,88.4608"
                    />
                    <path
                      fill="rgb(220, 4, 59)"
                      d="M88.0781,91.8464 L66.1741,102.4224 L63.9501,103.4974 L17.7121,125.6524 C14.7811,127.0664 11.0401,124.9304 11.0401,121.6744 L11.0401,60.0884 C11.0401,58.9104 11.6441,57.8934 12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
                    />
                    <path
                      fill="rgba(0, 0, 0, 0.25)"
                      d="M88.0781,91.8464 L66.1741,102.4224 L12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
                    />
                  </g>
                </svg>
              </div>

              {/* Title */}
              <h1
                className="mt-12 mb-12 text-left font-normal leading-[125%] text-[#011435] text-2xl lg:text-[32px]"
                style={{
                  fontFamily:
                    '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                  fontWeight: 500,
                }}
              >
                Sign in to Airtable
              </h1>

              {/* Email form */}
              <form className="w-full">
                <div className="mb-6 block relative p-1">
                  <label
                    htmlFor="emailLogin"
                    className="block text-sm font-normal text-[#011435]"
                  >
                    Email
                  </label>
                  <div className="mt-1" />
                  <div style={{ width: "100%" }}>
                    <input
                      type="email"
                      className="w-full h-10 px-2 text-[15px] bg-white rounded-[6px] border-none shadow-[var(--elevation-low)] text-[#011435] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      id="emailLogin"
                      name="email"
                      placeholder="Email address"
                      spellCheck="false"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="flex items-center justify-center w-full h-10 min-w-[200px] px-[14px] py-[7px] gap-[10px] rounded-[6px] border border-[rgba(1,20,53,0.12)] bg-[rgb(27,97,201)] text-white font-normal text-[15px] shadow-[rgba(0,0,0,0.08)_0px_1px_3px_0px,rgba(0,0,0,0.08)_0px_0px_2px_0px,rgba(0,0,0,0.32)_0px_0px_1px_0px] cursor-not-allowed opacity-60"
                >
                  <span className="truncate">Continue</span>
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center justify-center my-6">
                <p className="flex items-center text-center text-sm text-[rgba(1,20,53,0.6)]">
                  or
                </p>
              </div>

              {/* SSO & social buttons */}
              <div>
                <form>
                  <button
                    type="button"
                    className="flex items-center justify-center w-full h-10 px-3 rounded-[6px] border border-gray-300 bg-white text-[#011435] text-[15px] leading-4 font-normal transition-shadow hover:shadow-[0px_2px_4px_0px_rgba(0,0,0,0.12)]"
                  >
                    <span className="ml-1">
                      Sign in with{" "}
                      <span className="font-semibold"> Single Sign On</span>
                    </span>
                  </button>
                </form>

                <div className="pt-4">
                  <GoogleSignInButton />
                </div>

                <div className="pt-4">
                  <form>
                    <button
                      type="button"
                      className="flex items-center justify-center w-full h-10 px-3 gap-3 rounded-[6px] border border-gray-300 bg-white text-[#011435] text-[15px] leading-4 font-normal transition-shadow hover:shadow-[0px_2px_4px_0px_rgba(0,0,0,0.12)]"
                    >
                      <span className="flex items-center justify-center h-4 w-4">
                        <svg width="16" height="16" viewBox="19 19 18 18" fill="none">
                          <g
                            id="White-Logo-Square-"
                            stroke="none"
                            strokeWidth="1"
                            fill="none"
                            fillRule="evenodd"
                          >
                            <path
                              d="M28.2226562,20.3846154 C29.0546875,20.3846154 30.0976562,19.8048315 30.71875,19.0317864 C31.28125,18.3312142 31.6914062,17.352829 31.6914062,16.3744437 C31.6914062,16.2415766 31.6796875,16.1087095 31.65625,16 C30.7304687,16.0362365 29.6171875,16.640178 28.9492187,17.4494596 C28.421875,18.06548 27.9414062,19.0317864 27.9414062,20.0222505 C27.9414062,20.1671964 27.9648438,20.3121424 27.9765625,20.3604577 C28.0351562,20.3725366 28.1289062,20.3846154 28.2226562,20.3846154 Z M25.2929688,35 C26.4296875,35 26.9335938,34.214876 28.3515625,34.214876 C29.7929688,34.214876 30.109375,34.9758423 31.375,34.9758423 C32.6171875,34.9758423 33.4492188,33.792117 34.234375,32.6325493 C35.1132812,31.3038779 35.4765625,29.9993643 35.5,29.9389701 C35.4179688,29.9148125 33.0390625,28.9122695 33.0390625,26.0979021 C33.0390625,23.6579784 34.9140625,22.5588048 35.0195312,22.474253 C33.7773438,20.6382708 31.890625,20.5899555 31.375,20.5899555 C29.9804688,20.5899555 28.84375,21.4596313 28.1289062,21.4596313 C27.3554688,21.4596313 26.3359375,20.6382708 25.1289062,20.6382708 C22.8320312,20.6382708 20.5,22.5950413 20.5,26.2911634 C20.5,28.5861411 21.3671875,31.013986 22.4335938,32.5842339 C23.3476562,33.9129053 24.1445312,35 25.2929688,35 Z"
                              id=""
                              fill="#000"
                              fillRule="nonzero"
                            />
                          </g>
                        </svg>
                      </span>
                      <span>
                        Continue with <span className="font-semibold">Apple ID</span>
                      </span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Footer */}
              <p
                className="mt-18 mb-0 text-left text-[13px] leading-5 text-[rgba(1,20,53,0.6)]"
                style={{
                  fontFamily:
                    '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                }}
              >
                New to Airtable?{" "}
                <a
                  href="#"
                  className="font-medium text-[rgb(7,104,248)] underline underline-offset-auto hover:text-[rgb(27,97,201)] hover:no-underline active:text-[rgb(37,79,173)] active:underline"
                  style={{
                    textDecorationThickness: "auto",
                    textUnderlineOffset: "auto",
                    textDecorationSkipInk: "none",
                  }}
                >
                  Create an account
                </a>{" "}
                instead
              </p>
            </div>
          </div>

          {/* Right: Omni marketing image */}
          <div className="hidden lg:flex lg:justify-center lg:items-center lg:pt-12">
            <div
              tabIndex={0}
              role="button"
              className="focus-visible:outline-none cursor-pointer"
            >
              <div
                className="bg-cover bg-center bg-no-repeat rounded-[12px] transition-transform duration-200 ease-in-out hover:scale-[1.02] md:w-[300px] md:h-[580px] lg:w-[395px] lg:h-[580px]"
                style={{
                  backgroundImage:
                    "url('https://static.airtable.com/images/sign_in_page/omni_signin_large@2x.png')",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
