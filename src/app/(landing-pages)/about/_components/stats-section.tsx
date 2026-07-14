import {
    Award,
    BookOpen,
    Building,
    Globe,
    type LucideIcon,
    Users,
} from "lucide-react";
import { H3, P } from "@/components/ui/typography";
import { getT } from "@/features/core/i18n/server";

const statIcons: LucideIcon[] = [Building, Users, BookOpen, Globe, Award];

export async function AboutStatsSection() {
    const { t } = await getT();

    const stats = [
        {
            label: t("about.stats.launches.label"),
            value: t("about.stats.launches.value"),
        },
        {
            label: t("about.stats.clients.label"),
            value: t("about.stats.clients.value"),
        },
        {
            label: t("about.stats.disciplines.label"),
            value: t("about.stats.disciplines.value"),
        },
        {
            label: t("about.stats.timeZones.label"),
            value: t("about.stats.timeZones.value"),
        },
        {
            label: t("about.stats.buildCycle.label"),
            value: t("about.stats.buildCycle.value"),
        },
    ];

    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 scroll-reveal">
                    {stats.map((stat, index) => {
                        const Icon = statIcons[index] ?? Building;
                        return (
                            <div
                                key={stat.label}
                                className="text-center group hover:scale-105 transition-transform duration-300"
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors duration-300">
                                    <Icon className="w-8 h-8 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <H3 className="text-3xl font-bold mb-2">{stat.value}</H3>
                                <P className="text-muted-foreground">{stat.label}</P>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
