import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[1240px] px-5 py-24 text-center">
      <h1 className="text-3xl font-bold">Lost in the flow?</h1>
      <p className="mt-2 text-white/55">That page isn&apos;t part of the check-in.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black">
        Back Home
      </Link>
    </main>
  );
}
