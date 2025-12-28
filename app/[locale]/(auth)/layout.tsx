export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-8">
        {children}
      </div>
    </div>
  );
}
