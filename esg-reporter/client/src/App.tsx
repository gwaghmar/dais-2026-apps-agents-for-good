import { createBrowserRouter, RouterProvider, NavLink, Outlet } from 'react-router';
import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Button,
  useIsMobile,
} from '@databricks/appkit-ui/react';
import { Menu, Search, Bookmark, BarChart2, Bot } from 'lucide-react';
import { SearchPage } from './pages/referral/SearchPage';
import { ShortlistPage } from './pages/referral/ShortlistPage';
import { OverviewPage } from './pages/referral/OverviewPage';
import { AIPage } from './pages/referral/AIPage';

const NAV = [
  { to: '/', label: 'Find Facilities', icon: Search, end: true },
  { to: '/shortlist', label: 'Shortlist', icon: Bookmark, end: false },
  { to: '/overview', label: 'Dataset Overview', icon: BarChart2, end: false },
  { to: '/ai', label: 'AI Copilot', icon: Bot, end: false },
];

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

const mobileNavCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

type NLFn = (p: { isActive: boolean }) => string;

function NavLinks({ mobile, onClick }: { mobile?: boolean; onClick?: () => void }) {
  const cls: NLFn = mobile ? mobileNavCls : navCls;
  return (
    <nav className={mobile ? 'flex flex-col gap-1' : 'flex gap-1'}>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={cls} onClick={onClick}>
          <Icon className="h-3.5 w-3.5 flex-shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Layout() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!isMobile) setOpen(false); }, [isMobile]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
              <span className="text-white text-[9px] font-black tracking-tight">RC</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-sm tracking-tight">Referral Copilot</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Virtue Foundation · India</span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex ml-4">
            <NavLinks />
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-[10px] text-muted-foreground border rounded-full px-2.5 py-1 bg-muted/30">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>10,000 facilities</span>
              <span className="text-muted-foreground/50">·</span>
              <span>Lakebase</span>
              <span className="text-muted-foreground/50">·</span>
              <span>Agent Bricks</span>
            </div>
            {/* Mobile hamburger */}
            <div className="md:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
                <SheetContent side="left" className="w-64">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-sm">
                      <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-[8px] font-black">RC</span>
                      </div>
                      Referral Copilot
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <NavLinks mobile onClick={() => setOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t px-6 py-3 text-center text-[10px] text-muted-foreground">
        Virtue Foundation Dataset · DAIS 2026 Hackathon · Track 3: Referral Copilot · Powered by Databricks
      </footer>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <SearchPage /> },
      { path: '/shortlist', element: <ShortlistPage /> },
      { path: '/overview', element: <OverviewPage /> },
      { path: '/ai', element: <AIPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
