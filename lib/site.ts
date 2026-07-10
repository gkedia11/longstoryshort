const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

export const site = {
  name: "Longstory Short Story",
  legalName: "Long Story Short LLC",
  domain: "longstoryshortllc.com",
  finalUrl: "https://longstoryshortllc.com",
  url: configuredUrl || "https://longstoryshort.giltunnel.org",
  supportEmail: "support@longstoryshortllc.com",
  price: "$29.99",
  priceCents: 2999,
  currency: "usd",
  delivery: "about 45 minutes",
  n8nUrl:
    "https://n8n.srv822882.hstgr.cloud/webhook/de6ee764-0eb3-41b0-9172-16ea4f8e31c7",
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
