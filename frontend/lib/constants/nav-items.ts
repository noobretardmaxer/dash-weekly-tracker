import {
  Globe,
  TrendingUp,
  Search,
  AtSign,
  MessagesSquare,
  Radar,
  Trophy,
  FileBarChart,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavChildItem = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChildItem[];
  locked?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Website",
    href: "/website",
    icon: Globe,
    children: [
      { label: "Overview", href: "/website/overview" },
      { label: "Metrics", href: "/website/metrics" },
      { label: "Blog Activity", href: "/website/blog-activity" },
      { label: "UTM/Campaigns", href: "/website/utm-campaigns" },
      { label: "UTM Link Search", href: "/website/utm-link-search" },
    ],
  },
  {
    label: "SEO",
    href: "/seo",
    icon: TrendingUp,
    children: [
      { label: "Overview", href: "/seo/overview" },
      { label: "Keywords", href: "/seo/keywords" },
      { label: "Backlinks", href: "/seo/backlinks" },
      { label: "Competitors", href: "/seo/competitors" },
    ],
  },
  { label: "Search Console", href: "/search-console", icon: Search },
  { label: "Twitter/X", href: "/twitter", icon: AtSign, locked: true },
  { label: "Discord", href: "/discord", icon: MessagesSquare, locked: true },
  { label: "Reddit Intelligence", href: "/reddit", icon: Radar, locked: true },
  { label: "Social Leaderboard", href: "/social-leaderboard", icon: Trophy },
  { label: "Reports", href: "/reports", icon: FileBarChart, locked: true },
  { label: "Settings", href: "/settings", icon: Settings },
];
