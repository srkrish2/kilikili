import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PathPage } from './pages/PathPage';
import { LessonPage } from './pages/LessonPage';
import { BooksPage } from './pages/BooksPage';
import { BookReader } from './pages/BookReader';
import { ChartPage } from './pages/ChartPage';
import { ParentPage } from './pages/ParentPage';

const TABS = [
  { to: '/', icon: '🗺️', label: 'பாடங்கள்' },
  { to: '/letters', icon: '🔤', label: 'எழுத்துகள்' },
  { to: '/books', icon: '📚', label: 'புத்தகங்கள்' },
  { to: '/parents', icon: '👪', label: 'பெற்றோர்' },
];

function TabBar() {
  const { pathname } = useLocation();
  // Lessons and books are full-screen.
  if (pathname.startsWith('/lesson/') || /^\/books\/.+/.test(pathname)) return null;
  return (
    <nav className="tab-bar">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>
          <span className="tab-icon">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// HashRouter so the app works from any static host (e.g. GitHub Pages) without rewrites.
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PathPage />} />
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="/letters" element={<ChartPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:id" element={<BookReader />} />
        <Route path="/parents" element={<ParentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBar />
    </HashRouter>
  );
}
