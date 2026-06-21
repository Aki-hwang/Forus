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
  "강남·명동·홍대 피부과의 광고·인스타 마케팅 트렌드를 한눈에. 어떤 시술·콘텐츠가 뜨는지 한국어·일본어·중국어·영어로 확인하세요.";
const OG_IMAGE =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3FDm7Jme3gywkEGkRnH7TQ3XFzh/hf_20260621_072446_c4228c56-221c-4c92-958f-c9e0ab5b2987.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://dermaradar.kr"),
  title: SITE_TITLE,
  description: SITE_DESC,
  applicationName: "DermaRadar",
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    siteName: "DermaRadar",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 675, alt: SITE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [OG_IMAGE],
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
