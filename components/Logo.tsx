type Variant = 'light' | 'dark' | 'onAccent'
type Size = 'sm' | 'md'

interface LogoProps {
  variant?: Variant
  size?: Size
  symbolOnly?: boolean
  className?: string
}

const RING_COLOR: Record<Variant, string> = {
  light: '#2563EB',
  dark: '#4F8DF9',
  onAccent: '#ffffff',
}

const TEXT_COLOR: Record<Variant, string> = {
  light: '#0F1B4D',
  dark: '#ffffff',
  onAccent: '#ffffff',
}

const SYM_PX: Record<Size, number> = { sm: 20, md: 24 }
const TEXT_SIZE: Record<Size, string> = { sm: 'text-[15px]', md: 'text-[17px]' }

export function Logo({ variant = 'light', size = 'md', symbolOnly = false, className = '' }: LogoProps) {
  const ring = RING_COLOR[variant]
  const px = SYM_PX[size]

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <circle cx="12" cy="12" r="10" stroke={ring} strokeWidth="1.8" />
        <circle cx="12" cy="12" r="5.5" stroke={ring} strokeWidth="1.8" />
        <circle cx="12" cy="12" r="2.5" fill="#D97706" />
      </svg>
      {!symbolOnly && (
        <span
          className={`font-fraunces font-bold ${TEXT_SIZE[size]} tracking-tight leading-none`}
          style={{ color: TEXT_COLOR[variant] }}
        >
          Stratly
        </span>
      )}
    </span>
  )
}
