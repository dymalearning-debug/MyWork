// Authentication pages: white background with the studio light at the top,
// everything centered in a column of about 400 px.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-spotlight px-4 py-16">
      <main className="flex w-full max-w-[400px] flex-col gap-8">{children}</main>
    </div>
  );
}
