import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const notoKR = Noto_Sans_KR({
  variable: "--font-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const notoJP = Noto_Sans_JP({
  variable: "--font-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const SITE_TITLE = "DermaRadar — 피부과 광고 트렌드 레이더";
const SITE_DESC =
  "강남·명동·홍대 피부과의 일본/중국인 관광객 대상 광고를 조회수순으로 한눈에. 카드를 누르면 원본 인스타그램으로 이동합니다.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESC,
  applicationName: "DermaRadar",
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    siteName: "DermaRadar",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoKR.variable} ${notoJP.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
