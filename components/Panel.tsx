export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-[#E2E2DE] bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}
