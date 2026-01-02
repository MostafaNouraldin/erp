
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CircleHelp, BookOpen, Users, Package, ShoppingCart, Briefcase, Cog, GanttChartSquare, CreditCardIcon, BarChart2, Settings } from "lucide-react";
import documentationItems from './documentation.json';

const iconMap: { [key: string]: React.ElementType } = {
    BookOpen,
    Users,
    Package,
    ShoppingCart,
    Briefcase,
    Cog,
    GanttChartSquare,
    CreditCardIcon,
    BarChart2,
    Settings,
};


export default function HelpPage() {
  return (
    <div className="container mx-auto py-6 space-y-8" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <CircleHelp className="me-3 h-8 w-8 text-primary" />
            دليل استخدام النظام
          </CardTitle>
          <CardDescription>مرجعك الشامل لفهم واستخدام جميع وحدات وميزات نظام المستقبل ERP.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            أقسام الدليل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {documentationItems.map((item, index) => {
                const IconComponent = iconMap[item.icon] || BookOpen;
                return (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-lg hover:no-underline text-right">
                        <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5 text-primary"/>
                            {item.title}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-right prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
                  </AccordionItem>
                )
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
