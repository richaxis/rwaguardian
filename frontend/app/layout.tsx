import "./globals.css";

export const metadata = {
  title: "RWA Guardian",
  description: "Intelligent verification for real-world assets, powered by GenLayer."
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
