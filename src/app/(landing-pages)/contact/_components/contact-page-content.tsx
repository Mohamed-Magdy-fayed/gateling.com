import type { LucideIcon } from "lucide-react";
import {
    ArrowRight,
    Calendar,
    CheckCircle,
    Clock,
    Globe,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Users,
    Zap,
} from "lucide-react";
import { LinkButton } from "@/components/general/link-button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { H1, H2, H3, Lead, P } from "@/components/ui/typography";
import { getT } from "@/features/core/i18n/server";

import { ContactFormCard } from "./contact-form-card";

type Props = {
    isSignedIn: boolean;
    initialTab: "message" | "book";
    rescheduleId: string | null;
};

function contactFormHref(tab: "message" | "book") {
    return `/contact?tab=${tab}#contact-form`;
}

export async function ContactPageContent({ isSignedIn, initialTab, rescheduleId }: Props) {
    const { t } = await getT();

    type ContactMethod = {
        icon: LucideIcon;
        title: string;
        description: string;
        value: string;
        action: string;
        color: string;
        external?: boolean;
    } & (
        | { link: string; tab?: never }
        | { tab: "message" | "book"; link?: never }
    );

    const contactMethods: ContactMethod[] = [
        {
            icon: Mail,
            title: t('publicPages.contact.methods.email.title'),
            description: t('publicPages.contact.methods.email.description'),
            value: 'info@gateling.com',
            action: t('publicPages.contact.methods.email.action'),
            tab: 'message',
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
        },
        {
            icon: Phone,
            title: t('publicPages.contact.methods.phone.title'),
            description: t('publicPages.contact.methods.phone.description'),
            value: '+201123862218',
            action: t('publicPages.contact.methods.phone.action'),
            tab: 'book',
            color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
        },
        {
            icon: MessageSquare,
            title: t('publicPages.contact.methods.chat.title'),
            description: t('publicPages.contact.methods.chat.description'),
            value: t('publicPages.contact.methods.chat.value'),
            action: t('publicPages.contact.methods.chat.action'),
            link: 'https://wa.me/201123862218',
            external: true,
            color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
        },
        {
            icon: Calendar,
            title: t('publicPages.contact.methods.meeting.title'),
            description: t('publicPages.contact.methods.meeting.description'),
            value: t('publicPages.contact.methods.meeting.value'),
            action: t('publicPages.contact.methods.meeting.action'),
            tab: 'book',
            color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
        }
    ];

    type QuickAction = {
        icon: LucideIcon;
        title: string;
        description: string;
        badge: string;
        color: string;
    } & ({ link: string; tab?: never } | { tab: "message" | "book"; link?: never });

    const quickActions: QuickAction[] = [
        {
            icon: Users,
            title: t('publicPages.contact.quickActions.demo.title'),
            description: t('publicPages.contact.quickActions.demo.description'),
            badge: t('publicPages.contact.quickActions.demo.badge'),
            link: '/work',
            color: 'border-orange-200 hover:border-orange-300'
        },
        {
            icon: Zap,
            title: t('publicPages.contact.quickActions.trial.title'),
            description: t('publicPages.contact.quickActions.trial.description'),
            badge: t('publicPages.contact.quickActions.trial.badge'),
            tab: 'message' as const,
            color: 'border-green-200 hover:border-green-300'
        },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="py-20 bg-linear-to-br from-orange-50 to-white dark:from-stone-900 dark:to-stone-800">
                <div className="container mx-auto px-4 text-center scroll-reveal">
                    <Badge variant="secondary" className="mb-4 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                        {t('publicPages.contact.hero.badge')}
                    </Badge>
                    <H1 className="mb-6 max-w-4xl mx-auto">
                        {t('publicPages.contact.hero.title')}
                    </H1>
                    <Lead className="mb-8 max-w-2xl mx-auto text-muted-foreground">
                        {t('publicPages.contact.hero.description')}
                    </Lead>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {t('publicPages.contact.hero.responseTime')}
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            {t('publicPages.contact.hero.availability')}
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Methods */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 scroll-reveal">
                        <H2 className="mb-4">{t('publicPages.contact.methods.title')}</H2>
                        <P className="text-muted-foreground max-w-2xl mx-auto">
                            {t('publicPages.contact.methods.description')}
                        </P>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 scroll-reveal">
                        {contactMethods.map((method, index) => {
                            const isExternal = Boolean(method.external);

                            return (
                                <Card key={`${index}-${method.title}`} className="text-center hover:shadow-lg hover:-translate-y-2 transition-all duration-300 group">
                                    <CardHeader>
                                        <div className={`w-16 h-16 rounded-full ${method.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                            <method.icon className="w-8 h-8" />
                                        </div>
                                        <CardTitle className="text-lg">{method.title}</CardTitle>
                                        <CardDescription>{method.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <P className="font-semibold mb-4">{method.value}</P>
                                        <LinkButton
                                            href={method.link ?? contactFormHref(method.tab)}
                                            prefetch={false}
                                            target={isExternal ? '_blank' : undefined}
                                            rel={isExternal ? 'noopener noreferrer' : undefined}
                                            variant="outline"
                                            className="w-full group-hover:bg-orange-50 dark:group-hover:bg-orange-900/10 transition-colors duration-300"
                                        >
                                            {method.action}
                                            <ArrowRight className="w-4 h-4 ms-2 rtl:-scale-x-100 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform duration-300" />
                                        </LinkButton>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Contact Form */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900/50" id="contact-form">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Form */}
                        <div className="scroll-reveal">
                            <ContactFormCard
                                isSignedIn={isSignedIn}
                                initialTab={initialTab}
                                rescheduleId={rescheduleId}
                                formTitle={t('publicPages.contact.form.title')}
                                formDescription={t('publicPages.contact.form.description')}
                            />
                        </div>

                        {/* Contact Info & Quick Actions */}
                        <div className="space-y-8 scroll-reveal">
                            {/* Contact Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('publicPages.contact.info.title')}</CardTitle>
                                    <CardDescription>{t('publicPages.contact.info.description')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-orange-500" />
                                        <div>
                                            <P className="font-medium">{t('publicPages.contact.info.location.title')}</P>
                                            <P className="text-sm text-muted-foreground">{t('publicPages.contact.info.location.value')}</P>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-orange-500" />
                                        <div>
                                            <P className="font-medium">{t('publicPages.contact.info.hours.title')}</P>
                                            <P className="text-sm text-muted-foreground">{t('publicPages.contact.info.hours.value')}</P>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-orange-500" />
                                        <div>
                                            <P className="font-medium">{t('publicPages.contact.info.languages.title')}</P>
                                            <P className="text-sm text-muted-foreground">{t('publicPages.contact.info.languages.value')}</P>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <div className="scroll-reveal">
                                <H3 className="mb-4">{t('publicPages.contact.quickActions.title')}</H3>
                                <div className="space-y-4">
                                    {quickActions.map((action, index) => (
                                        <Card key={`${index}-${action.title}`} className={`hover:shadow-md transition-all duration-300 ${action.color} group`}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                            <action.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                                        </div>
                                                        <div>
                                                            <P className="font-medium">{action.title}</P>
                                                            <P className="text-sm text-muted-foreground">{action.description}</P>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary">{action.badge}</Badge>
                                                        <LinkButton
                                                            href={action.link ?? contactFormHref(action.tab)}
                                                            size="sm"
                                                            variant="ghost"
                                                        >
                                                            <ArrowRight className="w-4 h-4" />
                                                        </LinkButton>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 scroll-reveal">
                        <H2 className="mb-4">{t('publicPages.contact.faq.title')}</H2>
                        <P className="text-muted-foreground max-w-2xl mx-auto">
                            {t('publicPages.contact.faq.description')}
                        </P>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-6 scroll-reveal">
                        {([1, 2, 3, 4] as const).map((faqIndex) => (
                            <Card key={faqIndex} className="hover:shadow-md transition-shadow duration-300">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        {t(`publicPages.contact.faq.questions.q${faqIndex}.question`)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <P className="text-muted-foreground">{t(`publicPages.contact.faq.questions.q${faqIndex}.answer`)}</P>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
