"use client";
import Image from "next/image";
import { motion } from "motion/react";

export function DashboardPreview() {
  return (
    <section
      id='dashboard'
      className='relative mx-auto max-w-7xl px-6 mt-6 pb-16'
    >
      {/* Bottom emerald glow - reduced further */}
      <div className='absolute bottom-0 left-1/2 h-[150px] md:w-[500px] -translate-x-1/2 bg-linear-to-t from-primary/10 via-primary/3 to-transparent blur-xl pointer-events-none z-0' />

      {/* Left subtle emerald glow - reduced */}
      <div className='absolute left-0 top-1/2 h-[250px] w-[100px] -translate-y-1/2 bg-linear-to-r from-primary/8 via-primary/2 to-transparent blur-xl pointer-events-none z-0' />

      {/* Right subtle emerald glow - reduced */}
      <div className='absolute right-0 top-1/2 h-[250px] w-[100px] -translate-y-1/2 bg-linear-to-l from-primary/8 via-primary/2 to-transparent blur-xl pointer-events-none z-0' />

      {/* Card with default border */}
      <div className='relative z-10 border border-border/50 bg-background shadow-sm'>
        <motion.div
          initial={{
            opacity: 0,
            filter: "blur(10px)",
            y: 10,
          }}
          whileInView={{
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
          }}
          transition={{
            duration: 0.3,
            delay: 0.1,
            ease: "easeInOut",
          }}
          className='group'
        >
          <div className='overflow-hidden p-6'>
            <div className='relative overflow-hidden bg-background'>
              <Image
                src='/dashboard-preview.png'
                alt='SnackDesk Dashboard'
                width={1600}
                height={900}
                priority
                className='h-auto w-full dark:hidden'
              />

              <Image
                src='/dashboard-preview-dark.png'
                alt='SnackDesk Dashboard'
                width={1600}
                height={900}
                priority
                className='hidden h-auto w-full dark:block'
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
