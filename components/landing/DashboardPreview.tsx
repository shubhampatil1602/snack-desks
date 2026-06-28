"use client";
import { motion } from "motion/react";
import { DummyDashboard } from "./DummyDashboard";

export function DashboardPreview() {
  return (
    <section
      id='dashboard'
      className='relative mx-auto max-w-7xl px-6 mt-6 pb-16'
    >
      <div className='absolute bottom-0 left-1/2 h-[150px] md:w-[500px] -translate-x-1/2 bg-linear-to-t from-primary/10 via-primary/3 to-transparent blur-xl pointer-events-none z-0' />

      <div className='absolute left-0 top-1/2 h-[250px] w-[100px] -translate-y-1/2 bg-linear-to-r from-primary/8 via-primary/2 to-transparent blur-xl pointer-events-none z-0' />

      <div className='absolute right-0 top-1/2 h-[250px] w-[100px] -translate-y-1/2 bg-linear-to-l from-primary/8 via-primary/2 to-transparent blur-xl pointer-events-none z-0' />

      <div className='relative z-10 border border-border/50 bg-background shadow-sm overflow-hidden'>
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
          <div className='overflow-hidden p-2 sm:p-4 bg-muted/20'>
            <div className='relative overflow-hidden bg-background ring-1 ring-border shadow-2xl'>
               <DummyDashboard />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
