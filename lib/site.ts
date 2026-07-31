const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

export const site = {
  name: "Long Story Short",
  legalName: "Long Story Short LLC",
  domain: "longstoryshortllc.com",
  finalUrl: "https://longstoryshortllc.com",
  url: configuredUrl || "https://longstoryshort.giltunnel.org",
  supportEmail: "team@longstoryshort.com",
  price: "$29.99",
  priceCents: 2999,
  currency: "usd",
  delivery: "about 45 minutes",
  n8nUrl:
    "https://longstoryshortabc.app.n8n.cloud/webhook/d3f19be1-4a1a-4fa6-abd4-f58e0dddae24",
};

export const navItems = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/samples", label: "Samples" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const genres = [
  "Romance",
  "Mystery",
  "Fantasy",
  "Science Fiction",
  "Thriller",
  "Historical Fiction",
  "Young Adult",
  "Literary Fiction",
  "Horror",
  "Adventure",
];
