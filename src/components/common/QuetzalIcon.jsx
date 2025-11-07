/**
 * @author Alexander Echeverria
 * @file QuetzalIcon.jsx
 * @description Componente de icono personalizado para el símbolo de Quetzal (Q)
 * @location /src/components/common/QuetzalIcon.jsx
 */

const QuetzalIcon = ({ className = "", size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Círculo exterior */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Letra Q estilizada */}
      <path
        d="M 9 8 Q 9 7 10 7 L 14 7 Q 15 7 15 8 L 15 14 Q 15 15 14 15 L 13 15 L 14.5 17 M 9 8 L 9 14 Q 9 15 10 15 L 12 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Línea horizontal del Q */}
      <line
        x1="9"
        y1="11"
        x2="15"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default QuetzalIcon;
