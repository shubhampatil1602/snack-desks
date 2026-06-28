export function GradientPatternEffect() {
  return (
    <div>
      <div className='absolute inset-0 pointer-events-none'>
        {/* Top gradient glow */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-primary),transparent_80%)] opacity-[0.06]' />

        {/* Bottom gradient glow */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_bottom,var(--color-primary),transparent_85%)] opacity-[0.04]' />

        {/* Top subtle glow */}
        <div className='absolute left-1/2 top-0 h-[300px] sm:w-[500px] -translate-x-1/2 rounded-full bg-primary/8 blur-[60px]' />

        {/* Bottom subtle glow */}
        <div className='absolute bottom-0 left-1/2 h-[250px] sm:w-[450px] -translate-x-1/2 rounded-full bg-primary/6 blur-[70px]' />
      </div>

      {/*  grid pattern */}
      <div
        className='absolute inset-0 opacity-25
  bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)]
  bg-[size:50px_50px]'
      />
    </div>
  );
}
