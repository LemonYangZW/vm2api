import type { ReactNode } from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

type AppHeaderProps = {
  actions?: ReactNode
}

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <Header fixed>
      <Search placeholder='搜索页面…' />
      <div className='ms-auto flex items-center space-x-2'>
        {actions}
        <ConfigDrawer />
        <ThemeSwitch />
        <ProfileDropdown />
      </div>
    </Header>
  )
}
