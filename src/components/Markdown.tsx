import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './Markdown.module.less'

/** Testo in markdown (grassetto, elenchi, tabelle…). L'HTML grezzo non viene interpretato. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={`${styles.markdown} ${className ?? ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
