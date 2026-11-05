import { Link } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';

export default function Footer() {
  const { settings } = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <img
              src="/images/grubbix-logo.jpeg"
              alt="Grubbix Warehouse"
              width={576}
              height={480}
              className="h-12 w-auto sm:h-14"
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600">
              Kitchenware and catering equipment supplied across Nigeria.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Explore
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700">
              <li>
                <Link to="/" className="transition-colors hover:text-brand">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/catalogue" className="transition-colors hover:text-brand">
                  Catalogue
                </Link>
              </li>
              <li>
                <Link to="/#contact" className="transition-colors hover:text-brand">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="transition-colors hover:text-brand">
                  Admin portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Contact
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700">
              {settings.phone_number && (
                <li>
                  <a href={`tel:${settings.phone_number.replace(/\s/g, '')}`} className="hover:text-brand">
                    {settings.phone_number}
                  </a>
                </li>
              )}
              {settings.contact_email && (
                <li>
                  <a href={`mailto:${settings.contact_email}`} className="break-all hover:text-brand">
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.address && <li className="text-neutral-600">{settings.address}</li>}
              <li className="flex gap-4 pt-1">
                {settings.instagram_url && (
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:text-brand"
                  >
                    Instagram
                  </a>
                )}
                {settings.facebook_url && (
                  <a
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:text-brand"
                  >
                    Facebook
                  </a>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-200 pt-6">
          <p className="text-xs text-neutral-500">
            © {year} {settings.business_name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
