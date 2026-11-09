import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Leaf, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { to: '/classify', label: 'Classify waste' },
  { to: '/guidance', label: 'Guidance' },
  { to: '/reports/new', label: 'Submit report' },
  { to: '/map', label: 'Community map' },
];

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  return <div className="min-h-screen bg-[#f7f9f5] text-slate-900">
    <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2" href="#main">Skip to content</a>
    <header className="sticky top-0 z-30 border-b border-emerald-950/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-emerald-950" onClick={() => setMenuOpen(false)}><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-700 text-white"><Leaf size={19} aria-hidden="true" /></span>RecycleIQ</Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `rounded-full px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-stone-100 hover:text-emerald-900'}`}>{item.label}</NavLink>)}
          {user?.is_staff && <NavLink to="/admin" className={({ isActive }) => `rounded-full px-3 py-2 text-sm font-medium ${isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-stone-100'}`}>Admin</NavLink>}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">{user ? <><span className="max-w-32 truncate text-sm text-slate-600">Hi, {user.username}</span><button className="btn-quiet" onClick={logout}><LogOut size={16} aria-hidden="true" /> Sign out</button></> : <Link className="btn-secondary" to="/login"><LogIn size={16} aria-hidden="true" /> Sign in</Link>}</div>
        <button className="rounded-xl p-2 text-emerald-900 hover:bg-emerald-50 lg:hidden" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
      </div>
      {menuOpen && <nav aria-label="Mobile navigation" className="border-t border-stone-200 bg-white px-4 py-3 lg:hidden"><div className="mx-auto grid max-w-7xl gap-1"><NavLink to="/" onClick={() => setMenuOpen(false)} className="mobile-link">Home</NavLink>{navItems.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="mobile-link">{item.label}</NavLink>)}{user?.is_staff && <NavLink to="/admin" onClick={() => setMenuOpen(false)} className="mobile-link">Admin dashboard</NavLink>}{user ? <button className="mobile-link text-left" onClick={() => { logout(); setMenuOpen(false); }}>Sign out</button> : <NavLink to="/login" onClick={() => setMenuOpen(false)} className="mobile-link">Sign in or create account</NavLink>}</div></nav>}
    </header>
    <main id="main" className="mx-auto min-h-[calc(100vh-160px)] max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"><Outlet /></main>
    <footer className="border-t border-stone-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span className="font-semibold text-emerald-900">RecycleIQ</span><span>Helping our community make informed waste decisions.</span></div></footer>
  </div>;
}