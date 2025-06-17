import { Github } from 'lucide-react'
import React from 'react'
import Link from 'next/link'

function Header() {
  return (
    <nav className="sticky top-0 z-10 p-5 md:p-6 flex flex-row justify-between bg-slate-950/80 backdrop-blur-md drop-shadow-md">
      <header className="font-bold flex flex-col">
        <div className="text-lg md:text-2xl">
          <span className="text-green-400">▲</span>
          <span className="text-red-400">▼</span>
          <span className="ml-2">Tradix</span>
        </div>
        <div className="text-sm md:text-md text-slate-400">
          Backtesting made easy!
        </div>
      </header>
      <Link 
        className="text-lg md:text-2xl p-3 md:px-5 flex flex-row justify-between items-center gap-3 rounded-full md:rounded-xl bg-slate-800 text-slate-200 cursor-pointer" 
        href="https://github.com/janav-cloud/tradix/blob/main/README.md"
      >
        <Github width={30} height={30}></Github>
        <p className="font-bold text-xl hidden md:flex">Get Tradix!</p>
      </Link>
    </nav>
  )
}

export default Header
