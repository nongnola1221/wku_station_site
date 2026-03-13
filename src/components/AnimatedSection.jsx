import { motion } from 'framer-motion'
import { fadeUpVariants } from '../animations/motion'

export function AnimatedSection({ children, className, delay = 0, id }) {
  const MotionSection = motion.section

  return (
    <MotionSection
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      custom={delay}
      variants={fadeUpVariants}
    >
      {children}
    </MotionSection>
  )
}
