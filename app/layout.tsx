import type { Metadata } from "next";
import { Bricolage_Grotesque, Outfit } from "next/font/google";
import "./globals.css";
import PageLoader from "./components/PageLoader";
import Nav from "./components/Nav";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "emo — Notice how you feel, before it becomes too much",
  description:
    "EMO is a pedometer for mental health. Check in, capture, community, talk & exercises.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080B12] text-white">
        <PageLoader />
        <Nav />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
