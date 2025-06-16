import { DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"]
});

export const metadata = {
  title: "Tradix",
  description: "Backtesting made easy.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={dmSans.className}
      >
        <Header/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
