type NutriAgentLogoProps = {
  className?: string;
  title?: string;
  variant?: 'full' | 'icon';
};

const LOGO_FILTER = 'hue-rotate(108deg) saturate(1.3) brightness(0.9) contrast(1.05)';
const WHITE_ICON_FILTER = 'grayscale(1) brightness(4.6) contrast(1.15)';
const HEADER_ICON_FILTER = 'grayscale(1) brightness(0.42) contrast(1.1)';

export default function NutriAgentLogo({
  className = '',
  title = 'NutriAgent logo',
  variant = 'full',
}: NutriAgentLogoProps) {
  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center ${className}`.trim()}>
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
          <img
            src="/nutriagent-logo-source.png"
            alt={title}
            className="relative h-[126%] w-[126%] max-w-none object-cover"
            style={{
              filter: HEADER_ICON_FILTER,
              clipPath: 'inset(2% 0 33% 0)',
              transform: 'translate(-9%, 3%)',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`.trim()}>
      <div className="relative w-full max-w-[340px]">
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-green-50 via-white to-green-100/70 blur-2xl" />
        <img
          src="/nutriagent-logo-source.png"
          alt={title}
          className="relative mx-auto h-auto w-full object-contain"
          style={{ filter: LOGO_FILTER }}
        />
      </div>
    </div>
  );
}
