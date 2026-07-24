export function ArticleBody({ body }: { body: string }) {
  const lines = body.split('\n')
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return null
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={i} className="font-heading text-base font-semibold">
              {trimmed.slice(3)}
            </h2>
          )
        }
        const ordered = /^\d+\.\s/.test(trimmed)
        if (ordered) {
          return (
            <p key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span className="font-mono text-xs text-primary">{trimmed.match(/^\d+/)?.[0]}.</span>
              <span>{trimmed.replace(/^\d+\.\s/, '')}</span>
            </p>
          )
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}
