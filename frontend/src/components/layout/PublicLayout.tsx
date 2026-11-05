import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
