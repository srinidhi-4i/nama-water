import React from "react"

interface BranchIconProps {
  className?: string
}

export const BranchIcon: React.FC<BranchIconProps> = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="21.743" height="26.35" viewBox="0 0 21.743 26.35" className="stroke-current fill-none">
            <g transform="translate(-3.25 -0.741)">
              <circle cx="5" cy="5" r="5" transform="translate(7.543 1.491)" strokeLinejoin="round" strokeWidth="1.5" />
              <path d="M18.21,17.3A8.426,8.426,0,0,0,4,23.426v3.83h7.66" transform="translate(0 -3.275)" strokeLinejoin="round" strokeWidth="1.5" />
              <circle cx="3" cy="3" r="3" transform="translate(15.543 18.491)" strokeLinejoin="round" strokeWidth="1.5" />
              <line x2="4" y2="3" transform="translate(20.543 23.491)" strokeLinejoin="round" strokeWidth="1.5" />
            </g>
          </svg>
  )
}
