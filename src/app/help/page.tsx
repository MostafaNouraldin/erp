
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CircleHelp, BookOpen, Users, Package, ShoppingCart, Briefcase, Cog, GanttChartSquare, CreditCardIcon, BarChart2, Settings, Settings2 } from "lucide-react";

const documentationItems = [
    {
        title: "مقدمة وبداية سريعة",
        icon: BookOpen,
        content: `
            <div class="space-y-2">
                <p>مرحباً بك في دليل استخدام نظام المستقبل ERP. هذا الدليل مصمم لمساعدتك على فهم واستخدام جميع ميزات النظام بفعالية.</p>
                <h4 class="font-semibold pt-2">التنقل في النظام:</h4>
                <ul class="list-disc pr-5 space-y-1">
                    <li><strong>القائمة الجانبية (Sidebar):</strong> هي بوابتك الرئيسية لجميع وحدات النظام. يمكنك طيها لتوسيع مساحة العمل.</li>
                    <li><strong>لوحة التحكم (Dashboard):</strong> توفر لك نظرة شاملة وفورية على أهم مؤشرات الأداء في عملك.</li>
                    <li><strong>الوحدات (Modules):</strong> كل وحدة (مثل الحسابات، المبيعات) مخصصة لإدارة جانب معين من أعمالك.</li>
                </ul>
            </div>
        `
    },
    {
        title: "وحدة الحسابات",
        icon: Users,
        content: `
            <div class="space-y-4">
                <p>وحدة الحسابات هي القلب المالي للنظام، حيث تتم إدارة جميع المعاملات المالية والقيود المحاسبية.</p>
                <ul class="list-disc pr-5 space-y-2">
                    <li><strong>الحسابات العامة:</strong> يمكنك من خلالها تعريف شجرة الحسابات، ومراجعة أرصدة الحسابات، وإنشاء القيود اليومية اليدوية.</li>
                    <li><strong>سندات القبض والصرف:</strong> لتسجيل المعاملات النقدية والبنكية التي تتم خارج نطاق الفواتير الرسمية.</li>
                    <li><strong>الحسابات المدينة والدائنة:</strong> لإدارة فواتير العملاء (المستحقات) وفواتير الموردين (الالتزامات) وتتبع حالات السداد.</li>
                    <li><strong>البنوك:</strong> لإدارة حسابات الشركة البنكية وأرصدتها.</li>
                    <li><strong>الأرصدة الافتتاحية:</strong> لإدخال الأرصدة الأولية للحسابات في بداية استخدام النظام.</li>
                </ul>
            </div>
        `
    },
    {
        title: "وحدة المخزون",
        icon: Package,
        content: `
             <div class="space-y-4">
                <p>إدارة شاملة للمنتجات، الأصناف، والمستودعات. تتيح لك هذه الوحدة تتبع حركة المخزون بدقة.</p>
                <ul class="list-disc pr-5 space-y-2">
                    <li><strong>قائمة المنتجات:</strong> تعريف جميع المنتجات والأصناف، أسعارها، كمياتها، وحدود إعادة الطلب.</li>
                    <li><strong>فئات الأصناف والمستودعات:</strong> تنظيم الأصناف في فئات وإدارة مواقع التخزين المختلفة.</li>
                    <li><strong>أذونات الصرف والإضافة:</strong> تسجيل خروج ودخول البضاعة من وإلى المستودعات بشكل رسمي.</li>
                    <li><strong>طلبات الصرف:</strong> تمكين الأقسام من طلب مواد من المستودعات.</li>
                    <li><strong>الجرد والتسويات:</strong> إجراء عمليات الجرد الدورية وتسجيل أي فروقات (زيادة أو نقص) في المخزون.</li>
                    <li><strong>تحويلات المخزون:</strong> إدارة نقل البضائع بين المستودعات المختلفة.</li>
                </ul>
            </div>
        `
    },
    {
        title: "وحدة المبيعات",
        icon: ShoppingCart,
        content: `
            <div class="space-y-4">
                <p>تغطية دورة المبيعات بالكامل، من عرض السعر وحتى إصدار الفاتورة ومتابعة التحصيل.</p>
                <ul class="list-disc pr-5 space-y-2">
                    <li><strong>عروض الأسعار:</strong> إنشاء وإرسال عروض أسعار احترافية للعملاء وتتبع حالتها (مقبول، مرفوض، إلخ).</li>
                    <li><strong>أوامر البيع:</strong> تحويل عروض الأسعار المقبولة إلى أوامر بيع مؤكدة لتجهيزها.</li>
                    <li><strong>فواتير المبيعات:</strong> إصدار فواتير ضريبية متكاملة بناءً على أوامر البيع أو بشكل مباشر.</li>
                    <li><strong>إدارة العملاء:</strong> سجل مركزي لجميع بيانات العملاء، معاملاتهم، وكشوف حساباتهم.</li>
                </ul>
            </div>
        `
    },
    {
        title: "وحدة المشتريات",
        icon: Briefcase,
        content: `
            <div class="space-y-4">
                <p>أتمتة دورة الشراء، من طلب المواد وحتى استلامها وسداد فواتير الموردين.</p>
                <ul class="list-disc pr-5 space-y-2">
                    <li><strong>إدارة الموردين:</strong> قاعدة بيانات مركزية لجميع الموردين وبياناتهم.</li>
                    <li><strong>أوامر الشراء (PO):</strong> إنشاء وإرسال أوامر شراء رسمية للموردين.</li>
                    <li><strong>فواتير الموردين:</strong> تسجيل فواتير الموردين ومتابعة استحقاقاتها.</li>
                    <li><strong>عمليات الاستلام (GRN):</strong> تسجيل استلام البضائع من الموردين وتحديث المخزون تلقائيًا.</li>
                    <li><strong>مرتجعات المشتريات:</strong> إدارة عمليات إرجاع البضائع للموردين وتأثيرها المالي والمخزني.</li>
                </ul>
            </div>
        `
    },
    {
        title: "وحدة الموارد البشرية",
        icon: Users,
        content: `
             <div class="space-y-4">
                <p>إدارة شاملة لشؤون الموظفين والرواتب والإجراءات الإدارية.</p>
                <ul class="list-disc pr-5 space-y-2">
                    <li><strong>إدارة الموظفين:</strong> سجل إلكتروني كامل لكل موظف يحتوي على بياناته الشخصية، الوظيفية، والمالية.</li>
                    <li><strong>مسيرات الرواتب:</strong> إنشاء ومعالجة مسيرات الرواتب الشهرية بشكل آلي.</li>
                    <li><strong>الحضور والانصراف:</strong> تسجيل ومتابعة أوقات حضور وانصراف الموظفين.</li>
                    <li><strong>طلبات الإجازات:</strong> نظام متكامل لتقديم وموافقة طلبات الإجازات.</li>
                    <li><strong>النماذج:</strong> توثيق وإدارة جميع الإجراءات الإدارية مثل لفت النظر، القرارات الإدارية، الاستقالات، والإنذارات التأديبية.</li>
                </ul>
            </div>
        `
    },
    {
        title: "وحدة الإنتاج",
        icon: Cog,
        content: `
            <div class="space-y-4">
                <p>تخطيط ومتابعة عمليات التصنيع من البداية إلى النهاية.</p>
                <ul class="list-disc pr-5 space-y-2">
                    <li><strong>أوامر العمل:</strong> إنشاء أوامر لتصنيع كميات محددة من المنتجات وتتبع تقدمها.</li>
                    <li><strong>قائمة المواد (BOM):</strong> تعريف المكونات والمواد الخام اللازمة لإنتاج كل منتج.</li>
                    <li><strong>تخطيط الإنتاج:</strong> جدولة عمليات الإنتاج بناءً على الطلب والسعة المتاحة.</li>
                    <li><strong>مراقبة الجودة:</strong> تسجيل نتائج فحوصات الجودة في مراحل الإنتاج المختلفة.</li>
                </ul>
            </div>
        `
    },
    {
        title: "وحدة المشاريع",
        icon: GanttChartSquare,
        content: `
            <div class="space-y-4">
                <p>إدارة المشاريع، المهام، الموارد، والميزانيات بشكل متكامل.</p>
                <ul class="list-disc pr-5 space-y-2">
                    <li><strong>نظرة عامة على المشاريع:</strong> تتبع جميع المشاريع وحالتها ونسبة إنجازها.</li>
                    <li><strong>المهام والجداول:</strong> إنشاء المهام، تعيينها للموظفين، وتحديد مواعيدها النهائية وأولوياتها.</li>
                    <li><strong>إدارة الموارد:</strong> تخصيص الموارد البشرية للمشاريع وتحديد نسبة مشاركتهم.</li>
                    <li><strong>الميزانية والتكاليف:</strong> تحديد ميزانية لكل مشروع وتتبع المصروفات الفعلية لكل بند.</li>
                </ul>
            </div>
        `
    },
    {
        title: "وحدة نقاط البيع (POS)",
        icon: CreditCardIcon,
        content: `
            <div class="space-y-4">
                <p>واجهة سهلة وسريعة لعمليات البيع بالتجزئة اليومية.</p>
                <ul class="list-disc pr-5 space-y-2">
                    <li><strong>واجهة بيع مرئية:</strong> إضافة المنتجات إلى السلة بسهولة عبر البحث أو اختيار الفئة.</li>
                    <li><strong>طرق دفع متعددة:</strong> دعم الدفع النقدي، البطاقات، والبيع الآجل للعملاء المسجلين.</li>
                    <li><strong>إغلاق اليومية:</strong> ترحيل إجمالي المبيعات اليومية إلى الحسابات العامة بقيد محاسبي واحد وموحد في نهاية اليوم.</li>
                </ul>
            </div>
        `
    },
    {
        title: "التقارير والتحليل",
        icon: BarChart2,
        content: `
            <div class="space-y-4">
                <p>تحويل بياناتك إلى رؤى قابلة للتنفيذ. توفر هذه الوحدة مجموعة شاملة من التقارير.</p>
                <ul class="list-disc pr-5 space-y-2">
                    <li><strong>التقارير المالية:</strong> الميزانية العمومية، قائمة الدخل، ميزان المراجعة، والتدفقات النقدية.</li>
                    <li><strong>تقارير المبيعات:</strong> تحليل المبيعات حسب المنتج والعميل.</li>
                    <li><strong>تقارير المخزون:</strong> تقارير تقييم المخزون وحركة الأصناف.</li>
                    <li><strong>تقارير الموارد البشرية:</strong> ملخصات كشوف المرتبات وسجلات الحضور.</li>
                </ul>
            </div>
        `
    },
     {
        title: "الإعدادات وإدارة النظام",
        icon: Settings,
        content: `
            <div class="space-y-4">
                <p>التحكم الكامل في إعدادات النظام والمستخدمين والاشتراكات.</p>
                <h4 class="font-semibold pt-2">الإعدادات العامة:</h4>
                <ul class="list-disc pr-5 space-y-1">
                    <li><strong>إدارة المستخدمين:</strong> إضافة وتعديل حسابات المستخدمين.</li>
                    <li><strong>إدارة الأدوار والصلاحيات:</strong> إنشاء أدوار مخصصة وتحديد الصلاحيات لكل دور بدقة.</li>
                    <li><strong>الاشتراك والفوترة:</strong> عرض تفاصيل اشتراكك الحالي وتجديده.</li>
                </ul>
                 <h4 class="font-semibold pt-2">إدارة النظام (لمدير النظام الخارق):</h4>
                <ul class="list-disc pr-5 space-y-1">
                    <li><strong>إدارة الشركات:</strong> إدارة حسابات الشركات المشتركة في النظام.</li>
                    <li><strong>إعدادات الوحدات:</strong> التحكم في الوحدات المتاحة للاشتراك وأسعارها.</li>
                    <li><strong>مراجعة الطلبات والفواتير:</strong> مراجعة طلبات الاشتراك الجديدة وفواتيرها.</li>
                </ul>
            </div>
        `
    },
];

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
            {documentationItems.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg hover:no-underline text-right">
                    <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-primary"/>
                        {item.title}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="text-base text-right prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

