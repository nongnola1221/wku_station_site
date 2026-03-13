import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useHashRoute } from './hooks/useHashRoute'
import { pageVariants } from './animations/motion'
import { HomePage } from './pages/HomePage'
import { AdminPage } from './pages/AdminPage'
import './App.css'

function App() {
  const route = useHashRoute()
  const isAdmin = route === 'admin'
  const MotionDiv = motion.div

  useEffect(() => {
    document.title = isAdmin ? '스테이션 관리자 대쉬보드' : '스테이션 예약 사이트'
  }, [isAdmin])

  return (
    <div className="app-shell">
      <AnimatePresence mode="wait">
        <MotionDiv
          key={route}
          className="app-shell__page"
          initial="initial"
          animate="enter"
          exit="exit"
          variants={pageVariants}
        >
          {isAdmin ? <AdminPage /> : <HomePage />}
        </MotionDiv>
      </AnimatePresence>
    </div>
  )
}

export default App
