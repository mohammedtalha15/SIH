'use client'

/**
 * Cherry Blossom Decorative Element - Rachata Design Theme
 * Floating cherry blossom trees for aesthetic
 */

export function CherryBlossoms() {
  const blossoms = [
    { left: '5%', top: '15%', delay: '0s', scale: 1 },
    { left: '8%', top: '25%', delay: '1s', scale: 0.8 },
    { left: '12%', top: '35%', delay: '2s', scale: 0.9 },
    { left: '85%', top: '20%', delay: '0.5s', scale: 1.1 },
    { left: '90%', top: '30%', delay: '1.5s', scale: 0.85 },
  ]
  
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {blossoms.map((blossom, idx) => (
        <div
          key={idx}
          className="absolute cherry-float"
          style={{
            left: blossom.left,
            top: blossom.top,
            animationDelay: blossom.delay,
            transform: `scale(${blossom.scale})`,
          }}
        >
          <svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cherry blossom petals */}
            <g opacity="0.4">
              {/* Flowers */}
              <circle cx="25" cy="30" r="8" fill="#FFB7C5" />
              <circle cx="35" cy="28" r="6" fill="#FFC8D3" />
              <circle cx="45" cy="32" r="7" fill="#FFB7C5" />
              <circle cx="55" cy="35" r="8" fill="#FFC8D3" />
              
              <circle cx="20" cy="45" r="7" fill="#FFC8D3" />
              <circle cx="30" cy="48" r="9" fill="#FFB7C5" />
              <circle cx="40" cy="46" r="6" fill="#FFC8D3" />
              <circle cx="50" cy="50" r="8" fill="#FFB7C5" />
              <circle cx="60" cy="48" r="7" fill="#FFC8D3" />
              
              <circle cx="25" cy="62" r="8" fill="#FFB7C5" />
              <circle cx="35" cy="65" r="7" fill="#FFC8D3" />
              <circle cx="45" cy="60" r="9" fill="#FFB7C5" />
              <circle cx="55" cy="63" r="6" fill="#FFC8D3" />
            </g>
            
            {/* Trunk */}
            <rect x="38" y="70" width="4" height="50" fill="#8B4513" opacity="0.5" />
          </svg>
        </div>
      ))}
    </div>
  )
}
