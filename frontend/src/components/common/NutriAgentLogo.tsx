type NutriAgentLogoProps = {
  className?: string;
  title?: string;
};

const LOGO_FILTER = 'hue-rotate(108deg) saturate(1.3) brightness(0.9) contrast(1.05)';

export default function NutriAgentLogo({
  className = '',
  title = 'NutriAgent logo',
}: NutriAgentLogoProps) {
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
