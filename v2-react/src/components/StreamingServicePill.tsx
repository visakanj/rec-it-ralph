interface StreamingServicePillProps {
  name: string
  logo: string
}

export function StreamingServicePill({ name, logo }: StreamingServicePillProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border">
      <img src={logo} alt={name} className="w-5 h-5 rounded" />
      <span className="text-sm text-text-primary">{name}</span>
    </div>
  )
}
