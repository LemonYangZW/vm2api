import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * 展示一段纯文本正文（研报归档 md / 单轮对话正文），镜像 index.html
 * `openLoadtestReport`/`openLoadtestTurn` 的 `<pre class="lt-pre">` 弹层。
 */
export function LoadtestTextDialog({
  open,
  title,
  subtitle,
  text,
  onOpenChange,
}: {
  open: boolean
  title: string
  subtitle?: string
  text: string
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle ? (
            <p className='font-mono text-xs text-muted-foreground'>
              {subtitle}
            </p>
          ) : null}
        </DialogHeader>
        <pre className='max-h-[62vh] overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap'>
          {text || '尚无正文'}
        </pre>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
