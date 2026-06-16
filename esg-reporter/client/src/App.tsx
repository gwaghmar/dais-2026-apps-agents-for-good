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
import { Menu } from 'lucide-react';
import { DashboardPage } from './pages/esg/DashboardPage';
import { IngestionPage } from './pages/esg/IngestionPage';
import { AssistantPage } from './pages/esg/AssistantPage';
import { ReportPage } from './pages/esg/ReportPage';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

type NavLinkClassFn = (props: { isActive: boolean }) => string;

function NavLinks({ className, linkClass, onClick }: { className?: string; linkClass: NavLinkClassFn; onClick?: () => void }) {
  return (
    <nav className={className}>
      <NavLink to="/" end className={linkClass} onClick={onClick}>Dashboard</NavLink>
      <NavLink to="/ingest" className={linkClass} onClick={onClick}>Data Ingestion</NavLink>
      <NavLink to="/assistant" className={linkClass} onClick={onClick}>ESG Assistant</NavLink>
      <NavLink to="/report" className={linkClass} onClick={onClick}>CSR Report</NavLink>
    </nav>
  );
}

function Layout() {
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-4 md:px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-emerald-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">ESG</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Carbon Reporter</h1>
        </div>
        <NavLinks className="hidden md:flex gap-1 ml-4" linkClass={navLinkClass} />
        <div className="ml-auto md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(true)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <NavLinks className="flex flex-col gap-1 mt-4" linkClass={mobileNavLinkClass} onClick={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden md:flex ml-auto items-center gap-2">
          <span className="text-xs text-muted-foreground px-2 py-1 rounded-full border">
            Databricks Apps · Lakebase · Agent Bricks
          </span>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/ingest', element: <IngestionPage /> },
      { path: '/assistant', element: <AssistantPage /> },
      { path: '/report', element: <ReportPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
