import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Columns3,
  LayoutGrid,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Avatar } from './task-meta';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import type { Member } from '../types/task';
import { useAuth } from '../features/auth/auth-context';
import { Tooltip } from './ui/tooltip';
import { SampleDataControls } from '../features/demo/sample-data-controls';

export function AppShell({
  children,
  currentUser,
  myTaskCount,
  contained = false,
  focusMode = false,
  viewLinks,
}: {
  children: ReactNode;
  currentUser?: Member;
  myTaskCount: number;
  contained?: boolean;
  focusMode?: boolean;
  viewLinks: { board: string; myTasks: string };
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { signOut } = useAuth();

  return (
    <div className={`app-shell ${focusMode ? 'app-shell-focus' : ''}`}>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <NavLink
          to={viewLinks.board}
          className="brand"
          onClick={() => setMobileOpen(false)}
          aria-label="SprintBoard home"
        >
          <span className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </span>
          SprintBoard<span className="brand-period">.</span>
        </NavLink>
        <div className="workspace-chip">
          <span className="workspace-avatar">S</span>
          <div>
            <strong>Studio workspace</strong>
          </div>
          <span className="workspace-indicator" />
        </div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation" className="main-nav">
          <NavLink to={viewLinks.board} onClick={() => setMobileOpen(false)}>
            <Columns3 size={17} />
            Board
          </NavLink>
          <NavLink to={viewLinks.myTasks} onClick={() => setMobileOpen(false)}>
            <CheckCheck size={17} />
            My Tasks<span className="nav-count">{myTaskCount}</span>
          </NavLink>
        </nav>
        <div className="sidebar-section-heading">
          <span className="sidebar-label">YOUR PROJECT</span>
          <span className="project-count">01</span>
        </div>
        <NavLink
          to={viewLinks.board}
          className="project-link"
          onClick={() => setMobileOpen(false)}
        >
          <span className="project-dot" />
          Platform launch
          <ChevronRight size={14} />
        </NavLink>
        <div className="sidebar-bottom">
          <SampleDataControls />
          <button className="help-button" onClick={() => setHelpOpen(true)}>
            <CircleHelp size={16} />
            Help
            <ArrowUpRight size={14} />
          </button>
          <div className="user-profile">
            <Avatar member={currentUser} />
            <div>
              <strong>Alex Morgan</strong>
              <span>Personal demo account</span>
            </div>
            <Tooltip label="Sign out of the demo workspace">
              <Button
                variant="ghost"
                size="icon"
                className="profile-sign-out"
                aria-label="Sign out"
                onClick={signOut}
              >
                <LogOut size={15} />
              </Button>
            </Tooltip>
          </div>
        </div>
      </aside>
      <div className={`main-shell ${contained ? 'main-shell-contained' : ''}`}>
        <header className="topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
            <LayoutGrid size={15} className="topbar-workspace-icon" />
            <span className="topbar-workspace">Workspace</span>
            <ChevronRight size={13} />
            <span className="topbar-project">Platform launch</span>
          </div>
          <span className="local-indicator">
            <span className="local-dot" />
            Local demo
          </span>
        </header>
        {children}
        <footer className="app-footer">
          <span>
            <span className="local-dot" />
            Changes kept in memory
          </span>
        </footer>
      </div>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="small-dialog">
          <span className="dialog-symbol">
            <CircleHelp size={23} />
          </span>
          <DialogTitle>Help</DialogTitle>
          <DialogDescription>Using SprintBoard.</DialogDescription>
          <ul className="help-list">
            <li>
              <strong>Create tasks</strong>
              <span>Use New task or the + in any board column.</span>
            </li>
            <li>
              <strong>Edit tasks</strong>
              <span>Open a card to edit its details, assignee, priority, or status.</span>
            </li>
            <li>
              <strong>My Tasks</strong>
              <span>
                My Tasks shows everything assigned to Alex. Search and filters work in
                both views.
              </span>
            </li>
            <li>
              <strong>Demo data</strong>
              <span>
                Tasks and edits stay in memory. Reload the page or use Reload samples to
                restore the original data.
              </span>
            </li>
          </ul>
          <Button className="help-close" onClick={() => setHelpOpen(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
