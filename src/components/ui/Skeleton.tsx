interface SkeletonProps {
  variant?: 'text' | 'title' | 'card' | 'circle';
  width?: string;
  height?: string;
  className?: string;
}

const variantStyles = {
  text: 'h-4 w-full rounded-md',
  title: 'h-7 w-3/4 rounded-md',
  card: 'h-32 w-full rounded-xl',
  circle: 'h-10 w-10 rounded-full',
};

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`
        bg-bg-tertiary
        ${variantStyles[variant]}
        ${className}
      `}
      style={{
        width: width,
        height: height,
        backgroundImage:
          'linear-gradient(90deg, transparent 0%, rgba(240,246,252,0.05) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
      role="status"
      aria-label="로딩 중"
    />
  );
}
