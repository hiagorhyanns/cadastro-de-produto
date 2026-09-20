import { motion } from "framer-motion";

export function EcommerceTeamLogo({ className = "w-9 h-9 lg:w-10 lg:h-10" }: { className?: string }) {
  return (
    <motion.div 
      className={`relative flex items-center justify-center shrink-0 cursor-pointer select-none ${className}`}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <svg 
        viewBox="0 0 44 44" 
        className="w-full h-full drop-shadow-md overflow-visible"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ecomLogoOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA62B" />
            <stop offset="45%" stopColor="#FF7A00" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>
          <radialGradient id="ecomLogoBlue" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#1E5BF0" />
            <stop offset="60%" stopColor="#1446C9" />
            <stop offset="100%" stopColor="#0B349E" />
          </radialGradient>
        </defs>

        {/* Circular Deep Blue Background */}
        <circle 
          cx="22" 
          cy="22" 
          r="21" 
          fill="url(#ecomLogoBlue)" 
          stroke="#3B82F6" 
          strokeWidth="0.8" 
        />

        {/* 3 Petal Triskelion Symbol */}
        <motion.g
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          style={{ transformOrigin: "22px 22px" }}
        >
          {/* Bottom lobe pointing downwards */}
          <path 
            d="M 19.8 26.2 C 17.5 29.2 16.5 33.2 18.4 36.2 C 19.8 38.4 24.2 38.4 25.6 36.2 C 27.5 33.2 26.5 29.2 24.2 26.2 C 23.3 25.1 20.7 25.1 19.8 26.2 Z" 
            fill="url(#ecomLogoOrange)" 
          />
          {/* Top-right lobe pointing towards ~2 o'clock */}
          <path 
            d="M 19.8 26.2 C 17.5 29.2 16.5 33.2 18.4 36.2 C 19.8 38.4 24.2 38.4 25.6 36.2 C 27.5 33.2 26.5 29.2 24.2 26.2 C 23.3 25.1 20.7 25.1 19.8 26.2 Z" 
            fill="url(#ecomLogoOrange)" 
            transform="rotate(120 22 22)" 
          />
          {/* Top-left lobe pointing towards ~10 o'clock */}
          <path 
            d="M 19.8 26.2 C 17.5 29.2 16.5 33.2 18.4 36.2 C 19.8 38.4 24.2 38.4 25.6 36.2 C 27.5 33.2 26.5 29.2 24.2 26.2 C 23.3 25.1 20.7 25.1 19.8 26.2 Z" 
            fill="url(#ecomLogoOrange)" 
            transform="rotate(240 22 22)" 
          />
        </motion.g>

        {/* Center core accent */}
        <circle cx="22" cy="22" r="2.5" fill="#FFA62B" opacity="0.3" />
      </svg>
    </motion.div>
  );
}
