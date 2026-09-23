"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(
  () => import("react-hot-toast").then((m) => m.Toaster),
  { ssr: false },
);

type Props = {
  children: React.ReactNode;
};

export function ToastProvider({ children }: Props) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
        }}
      />
    </>
  );
}
