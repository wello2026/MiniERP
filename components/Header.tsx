'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/treasury': 'Treasury Management',
  '/transfers': 'Money Transfers',
  '/suppliers': 'Supplier Management',
  '/purchases': 'Purchase Invoices',
  '/inventory': 'Inventory Management',
  '/production': 'Production Orders',
  '/expenses': 'Expense Tracking',
  '/reports': 'Business Reports',
  '/settings': 'System Settings',
}

export default function Header() {
  const pathname = usePathname()
  const title = pageTitles[pathname] || 'Mini ERP Pro'

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  )
}