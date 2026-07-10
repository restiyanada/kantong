export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#EAEAE6] bg-white p-4 shadow-[0_1px_2px_rgba(26,27,30,0.04)] sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
