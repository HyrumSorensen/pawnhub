export default function TilePlayer4({
    width = 100,
    height = 100,
  }: {
    width?: number;
    height?: number;
  }) {
    return (
        <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0H100V100H0V0Z" fill="#D9D9D9"/>
        <path d="M20 5L5 20" stroke="#C7C7C7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M95 80L80 95" stroke="#C7C7C7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M45 5L5 45" stroke="#C7C7C7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M70 5L5 70" stroke="#C7C7C7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M95 5L5 95" stroke="#C7C7C7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M95 30L30 95" stroke="#C7C7C7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M95 55L55 95" stroke="#C7C7C7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <g filter="url(#filter0_d_16_12)">
        <path d="M67.4562 72.8568V80.0003H33V72.8568H67.4562ZM37.787 70.3125H62.6698V63.1693H37.787V70.3125ZM41.5689 42.4899V60.5198H58.8884V42.4899C61.5015 40.1281 63.1494 36.7196 63.1494 32.9221C63.1494 25.7853 57.3669 20 50.2284 20C43.0899 20 37.3063 25.7856 37.3063 32.9224C37.3063 36.7213 38.9566 40.1281 41.5689 42.4899Z" fill="#8400E3"/>
        <path d="M42.5689 42.4899V42.0459L42.2396 41.7482C39.8263 39.5663 38.3063 36.4245 38.3063 32.9224C38.3063 26.3377 43.6423 21 50.2284 21C56.8144 21 62.1494 26.3374 62.1494 32.9221C62.1494 36.4234 60.6315 39.5666 58.2179 41.7481L57.8884 42.0458V42.4899V59.5198H42.5689V42.4899ZM66.4562 73.8568V79.0003H34V73.8568H66.4562ZM61.6698 64.1693V69.3125H38.787V64.1693H61.6698Z" stroke="black" stroke-width="2"/>
        </g>
        <defs>
        <filter id="filter0_d_16_12" x="29" y="20" width="42.4562" height="68.0005" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_16_12"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_16_12" result="shape"/>
        </filter>
        </defs>
        </svg>
        
    );
  }
  