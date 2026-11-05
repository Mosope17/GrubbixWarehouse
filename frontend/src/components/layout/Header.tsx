import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { buildWhatsAppUrl, generalEnquiryMessage } from '../../utils/whatsapp';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold transition-colors ${
    isActive ? 'text-brand' : 'text-neutral-600 hover:text-brand'
  }`;

export default function Header() {
  const [open, setOpen] = useState(false);
  const { settings } = useSettings();
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    generalEnquiryMessage(settings.business_name),
  );

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Grubbix Warehouse — home">
          <img
            src="/images/grubbix-logo.jpeg"
            alt="Grubbix Warehouse"
            width={576}
            height={480}
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/catalogue" className={navLinkClass}>
            Catalogue
          </NavLink>
          <Link to="/#contact" className="text-sm font-semibold text-neutral-600 hover:text-brand">
            Contact
          </Link>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              WhatsApp us
            </a>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 md:hidden"
        >
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile navigation" className="border-t border-neutral-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-700">
              Home
            </Link>
            <Link to="/catalogue" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-700">
              Catalogue
            </Link>
            <Link to="/#contact" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-semibold text-neutral-700">
              Contact
            </Link>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 rounded-lg bg-brand px-3 py-2.5 text-center text-sm font-semibold text-white"
              >
                WhatsApp us
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
