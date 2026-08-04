import {
  LayoutDashboard,
  Globe,
  TrendingUp,
  Search,
  FileText,
  AtSign,
  MessagesSquare,
  Radar,
  Trophy,
  FileBarChart,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Website", href: "/website", icon: Globe },
  { label: "SEO", href: "/seo", icon: TrendingUp },
  { label: "Search Console", href: "/search-console", icon: Search },
  { label: "Content", href: "/content", icon: FileText },
  { label: "Twitter/X", href: "/twitter", icon: AtSign },
  { label: "Discord", href: "/discord", icon: MessagesSquare },
  { label: "Reddit Intelligence", href: "/reddit", icon: Radar },
  { label: "Social Leaderboard", href: "/social-leaderboard", icon: Trophy },
  { label: "Reports", href: "/reports", icon: FileBarChart },
  { label: "Settings", href: "/settings", icon: Settings },
];
