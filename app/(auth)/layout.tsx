import { GradientPatternEffect } from "@/components/gradient-pattern-effect";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='relative min-h-screen w-full bg-[#f9fafb] dark:bg-zinc-950'>
      <GradientPatternEffect />
      <div className='relative z-10'>{children}</div>
    </div>
  );
}
