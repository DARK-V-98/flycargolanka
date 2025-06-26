export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en">
        <body className={`${ptSans.className} font-body antialiased`}>
          <ClientLayout>{children}</ClientLayout>
        </body>
      </html>
    );
  }