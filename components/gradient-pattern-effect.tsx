export function GradientPatternEffect() {
  return (
    <div>
      <div className='absolute inset-0 pointer-events-none'>
        {/* Top gradient glow */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_80%)]' />

        {/* Bottom gradient glow */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.04),transparent_85%)]' />

        {/* Top subtle glow */}
        <div className='absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/8 blur-[60px]' />

        {/* Bottom subtle glow */}
        <div className='absolute bottom-0 left-1/2 h-[250px] w-[450px] -translate-x-1/2 rounded-full bg-emerald-500/6 blur-[70px]' />
      </div>

      {/*  grid pattern */}
      <div
        className='absolute inset-0 opacity-25
  bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)]
  dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)]
  bg-size-[50px_50px]'
      />
    </div>
  );
}
