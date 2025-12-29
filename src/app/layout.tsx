import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escondido Home Remodeling | BNC Builders Inc.",
  description: "Want to transform your home or landscaping? Call us for superior services backed by 30+ years of experience. Request a free consultation and estimate today.",
  openGraph: {
    type: "website",
    siteName: "BNC Builders Inc.",
    url: "https://www.bncbuildersinc.com/",
    title: "Escondido Home Remodeling | BNC Builders Inc.",
    description: "Want to transform your home or landscaping? Call us for superior services backed by 30+ years of experience. Request a free consultation and estimate today.",
    images: ["/images/Social-Share.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Escondido Home Remodeling | BNC Builders Inc.",
    description: "Want to transform your home or landscaping? Call us for superior services backed by 30+ years of experience. Request a free consultation and estimate today.",
    images: ["/images/Social-Share.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-anim="1"
      data-prlx="1"
      data-flr="1"
      data-i="x37dc20xp4z"
      data-is="ud6eyi8x1gh"
      data-gmap="AIzaSyCiXQZzANUps01JOhBxJ15Pa72ma5s69ok"
    >
      <head>
        <link rel="canonical" href="https://www.bncbuildersinc.com/" />
        <link rel="icon" type="image/x-icon" href="/images/brand/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
