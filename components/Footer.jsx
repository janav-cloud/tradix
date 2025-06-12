import React from 'react';

function Footer() {
  return (
    <footer className="sticky bottom-0 z-10 p-4 flex flex-row justify-center bg-slate-950/80 backdrop-blur-lg drop-shadow-md">
      <div className="text-slate-300 text-lg flex items-center gap-2">
        Made with <span className="text-red-400 text-xl">❤️</span> by <span className="font-bold text-green-400">Janav Dua</span>
      </div>
    </footer>
  );
}

export default Footer;