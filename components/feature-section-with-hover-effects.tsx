import { cn } from "@/lib/utils";
import {
  IconAdjustmentsBolt,
  IconAnalyze,
  IconCloud,
  IconCurrencyDollar,
  IconDownload,
  IconEaseInOut,
  IconHeart,
  IconHelp,
  IconRouteAltLeft,
  IconShield,
  IconTerminal2,
} from "@tabler/icons-react";
import { Icon } from "lucide-react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Built for developers",
      description:
        "Built for engineers, developers, dreamers, thinkers and doers.",
      icon: <IconTerminal2 />,
    },
    {
      title: "Zero-Cost Publishing",
      description:
        "Eliminate the barrier to entry. Unlike the $25 Google Play fee or $99 Apple App Store subscription, Appflux allows developers to create accounts and publish unlimited applications completely free of charge.",
      icon: <IconCurrencyDollar />,
    },
    {
      title: "Instant Deployment",
      description:
        "Bypass the frustrating week-long review processes. Your apps go live immediately after passing our automated security checks, allowing you to push updates, hotfixes, and beta versions to your users instantly.",
      icon: <IconCloud />,
    },
    {
      title: "Automated Security Scanning",
      description: "Trust is paramount. Every uploaded file undergoes a rigorous automated malware scan before publishing.",
      icon: <IconShield />,
    },
    {
      title: "Advanced Developer Analytics",
      description: "Gain actionable insights with a dedicated dashboard. Track real-time performance including total downloads.",
      icon: <IconAnalyze />,
    },
    {
      title: "Multi-Platform Distribution",
      description:
        "DevStore isn't limited to mobile. We support a universal range of formats including Android APKs, Progressive Web Apps (PWAs), Windows executables (.exe), macOS applications (.dmg), and Linux packages.",
      icon: <IconRouteAltLeft />,
    },
    {
      title: "Frictionless One-Click Downloads",
      description:
        "We prioritize user experience over ad revenue. Users get direct download links and QR codes without annoying redirect loops, countdown timers, or intrusive pop-up ads found on typical third-party sites.",
      icon: <IconDownload />,
    },
    {
      title: "Community-Driven Quality Control",
      description: "Build credibility through transparency. Our robust review system allows users to rate apps, write detailed feedback.",
      icon: <IconHeart />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r  py-10 relative group/feature dark:border-zinc-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-zinc-800",
        index < 4 && "lg:border-b dark:border-zinc-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-zinc-100 dark:from-zinc-900 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-zinc-100 dark:from-zinc-900 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-zinc-600 dark:text-zinc-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1.5 rounded-tr-full rounded-br-full bg-zinc-300 dark:bg-zinc-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-zinc-800 dark:text-zinc-300">
          {title}
        </span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
