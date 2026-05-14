import SessionHeartbeat from "../components/SessionHeartbeat";

export default function RootLayout({
  children,
}: {
  children: any
}) {
  return (
    <html lang="en">
      <body>
        <SessionHeartbeat />
        {children}
      </body>
    </html>
  )
}
