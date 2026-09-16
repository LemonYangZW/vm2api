import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { VIEW_TITLES } from '@/config/nav'
import type { PanelRole } from '@/types/panel-auth'
import type { PanelUser } from '@/types/panel-users'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { TableSkeleton } from '@/components/page-skeletons'
import { QueryGate } from '@/components/query-gate'
import { usersQueryOptions } from '@/features/users/queries'

export function UsersPage() {
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.me)
  const q = useQuery(usersQueryOptions())
  const items = q.data?.items || []
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<PanelUser | null>(null)
  const [del, setDel] = useState<PanelUser | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<PanelRole>('user')
  const [quota, setQuota] = useState(0)
  const [enabled, setEnabled] = useState(true)
  const refresh = () =>
    qc.invalidateQueries({ queryKey: usersQueryOptions().queryKey })

  const create = useMutation({
    mutationFn: () =>
      api('/api/panel/users', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          role,
          enabled,
          vm_create_quota: quota,
        }),
      }),
    onSuccess: async () => {
      toast.success('已创建')
      setPassword('')
      setOpen(false)
      await refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const patch = useMutation({
    mutationFn: () =>
      api(`/api/panel/users/${encodeURIComponent(edit!.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: edit?.role,
          enabled: edit?.enabled,
          vm_create_quota: edit?.vm_create_quota,
          ...(password ? { password } : {}),
        }),
      }),
    onSuccess: async () => {
      toast.success(password ? '已更新（改密会踢其它会话）' : '已更新')
      setPassword('')
      setEdit(null)
      await refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <PageHeader
      title={VIEW_TITLES.users}
      extra={
        <Button
          onClick={() => {
            setUsername('')
            setPassword('')
            setRole('user')
            setQuota(0)
            setEnabled(true)
            setOpen(true)
          }}
        >
          新建
        </Button>
      }
    >
      <QueryGate
        loading={q.isLoading}
        error={q.error}
        skeleton={<TableSkeleton rows={8} columns={4} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>自建配额</TableHead>
              <TableHead>启用</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.vm_create_quota ?? 0}</TableCell>
                <TableCell>{u.enabled === false ? '停用' : '启用'}</TableCell>
                <TableCell className='space-x-1'>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => {
                      setEdit(u)
                      setPassword('')
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    size='sm'
                    variant='destructive'
                    disabled={u.username === me?.user}
                    onClick={() => setDel(u)}
                  >
                    删除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryGate>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建用户</DialogTitle>
          </DialogHeader>
          <Field label='用户名'>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete='off'
            />
          </Field>
          <Field label='密码'>
            <Input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='new-password'
            />
          </Field>
          <RoleFields
            role={role}
            setRole={setRole}
            enabled={enabled}
            setEnabled={setEnabled}
            quota={quota}
            setQuota={setQuota}
          />
          <DialogFooter>
            <Button
              onClick={() => create.mutate()}
              disabled={!username.trim() || !password || create.isPending}
              loading={create.isPending}
            >
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!edit}
        onOpenChange={() => {
          setEdit(null)
          setPassword('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑 {edit?.username}</DialogTitle>
          </DialogHeader>
          <RoleFields
            role={edit?.role || 'user'}
            setRole={(r) => setEdit((cur) => (cur ? { ...cur, role: r } : cur))}
            enabled={edit?.enabled !== false}
            setEnabled={(on) =>
              setEdit((cur) => (cur ? { ...cur, enabled: on } : cur))
            }
            quota={edit?.vm_create_quota ?? 0}
            setQuota={(n) =>
              setEdit((cur) => (cur ? { ...cur, vm_create_quota: n } : cur))
            }
            lockSelf={!!edit && edit.username === me?.user}
          />
          <Field label='新密码（可选，不回显）'>
            <Input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='new-password'
            />
          </Field>
          <DialogFooter>
            <Button
              onClick={() => patch.mutate()}
              disabled={patch.isPending}
              loading={patch.isPending}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!del}
        onOpenChange={() => setDel(null)}
        title={`删除 ${del?.username}`}
        desc='不能删除最后一个 admin，也不能删除自己。'
        confirmText='删除'
        cancelBtnText='取消'
        destructive
        handleConfirm={() => {
          if (!del) return
          api(`/api/panel/users/${encodeURIComponent(del.id)}`, {
            method: 'DELETE',
          })
            .then(() => {
              toast.success('已删除')
              setDel(null)
              return refresh()
            })
            .catch((e: Error) => toast.error(e.message))
        }}
      />
    </PageHeader>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-1'>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function RoleFields({
  role,
  setRole,
  enabled,
  setEnabled,
  quota = 0,
  setQuota,
  lockSelf,
}: {
  role: PanelRole
  setRole: (role: PanelRole) => void
  enabled: boolean
  setEnabled: (on: boolean) => void
  quota?: number
  setQuota?: (n: number) => void
  lockSelf?: boolean
}) {
  return (
    <>
      <Field label='角色'>
        <Select
          value={role}
          onValueChange={(v) => setRole(v as PanelRole)}
          disabled={lockSelf}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='admin'>admin</SelectItem>
            <SelectItem value='super'>super</SelectItem>
            <SelectItem value='user'>user</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {setQuota ? (
        <Field label='自建 VM 配额 (0–100)'>
          <Input
            type='number'
            min={0}
            max={100}
            value={quota}
            onChange={(e) =>
              setQuota(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
            }
          />
        </Field>
      ) : null}
      <div className='flex items-center justify-between'>
        <Label>启用</Label>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={lockSelf}
        />
      </div>
      {lockSelf ? (
        <p className='text-xs text-muted-foreground'>
          不能修改自己的角色或停用自己 ——
          保存后会立刻失去访问权限，且无法自助恢复。
        </p>
      ) : null}
    </>
  )
}
