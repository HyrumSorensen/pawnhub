export default function TileValid({
  width = 100,
  height = 100,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0H100V100H0V0Z" fill="#D9D9D9" />
      <path
        d="M20 5L5 20"
        stroke="#C7C7C7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M95 80L80 95"
        stroke="#C7C7C7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M45 5L5 45"
        stroke="#C7C7C7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M70 5L5 70"
        stroke="#C7C7C7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M95 5L5 95"
        stroke="#C7C7C7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M95 30L30 95"
        stroke="#C7C7C7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M95 55L55 95"
        stroke="#C7C7C7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50.5" cy="49.5" r="17.5" fill="#828282" />
    </svg>
  );
}
