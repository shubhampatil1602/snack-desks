export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='relative min-h-screen w-full bg-[#f9fafb] dark:bg-zinc-950'>
      <div
        className='pointer-events-none absolute inset-0 z-0
      bg-[linear-gradient(to_right,var(--grid-color)_0.5px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_0.5px,transparent_1px)]
      bg-size-[48px_48px]
      [--grid-color:rgb(209_213_219/0.6)]
      dark:[--grid-color:rgb(63_63_70/0.5)]'
        style={{
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
        }}
      />

      <div className='relative z-10'>{children}</div>
    </div>
  );
}
