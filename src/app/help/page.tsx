
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea component exists
import { Label } from "@/components/ui/label";
import { CircleHelp, Mail, Phone, MessageSquare } from "lucide-react";

const faqs = [
  {
    question: "كيف يمكنني إعادة تعيين كلمة المرور الخاصة بي؟",
    answer: "يمكنك إعادة تعيين كلمة المرور من خلال صفحة تسجيل الدخول بالنقر على 'هل نسيت كلمة المرور؟' واتباع التعليمات."
  },
  {
    question: "أين أجد دليل المستخدم للنظام؟",
    answer: "يمكن العثور على دليل المستخدم الكامل في قسم 'المستندات' ضمن هذه الصفحة. كما يمكنك تحميله بصيغة PDF."
  },
  {
    question: "كيف أقوم بإضافة مستخدم جديد للنظام؟",
    answer: "لإضافة مستخدم جديد، يرجى الذهاب إلى قسم الإعدادات > إدارة المستخدمين، ثم النقر على زر 'إضافة مستخدم جديد'."
  },
  {
    question: "ما هي متطلبات النظام لتشغيل البرنامج؟",
    answer: "يعمل النظام على معظم المتصفحات الحديثة مثل جوجل كروم، فايرفوكس، وسفاري. لا توجد متطلبات خاصة للجهاز."
  },
  {
    question: "كيف يمكنني التواصل مع الدعم الفني؟",
    answer: "يمكنك التواصل مع الدعم الفني عبر نموذج الاتصال في هذه الصفحة، أو عبر البريد الإلكتروني support@almustaqbal-erp.com، أو بالاتصال على الرقم 9200XXXXX."
  }
];

export default function HelpPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <CircleHelp className="ms-2 h-8 w-8 text-primary" />
            المساعدة والدعم
          </CardTitle>
          <CardDescription>الوصول إلى وثائق المساعدة، الأسئلة الشائعة، ومعلومات الاتصال بالدعم الفني.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="ms-2 h-6 w-6 text-primary" />
            الأسئلة الشائعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg hover:no-underline text-right">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="ms-2 h-6 w-6 text-primary" />
            تواصل مع الدعم الفني
          </CardTitle>
          <CardDescription>إذا لم تجد إجابة لسؤالك، يمكنك مراسلتنا مباشرة.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input id="name" placeholder="أدخل اسمك الكامل" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="أدخل بريدك الإلكتروني" className="bg-background" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">الموضوع</Label>
              <Input id="subject" placeholder="أدخل موضوع الرسالة" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">الرسالة</Label>
              <Textarea id="message" placeholder="اكتب رسالتك هنا..." rows={5} className="bg-background" />
            </div>
            <Button type="submit" className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow">
              <Mail className="ms-2 h-4 w-4" /> إرسال الرسالة
            </Button>
          </form>
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-2">معلومات الاتصال الأخرى:</h3>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-5 w-5 text-primary" /> support@almustaqbal-erp.com
            </p>
            <p className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Phone className="h-5 w-5 text-primary" /> 9200XXXXX (متاح من الأحد إلى الخميس، 9 صباحًا - 5 مساءً)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
