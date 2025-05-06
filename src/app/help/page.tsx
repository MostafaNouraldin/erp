
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CircleHelp } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CircleHelp className="me-2 h-6 w-6 text-primary" />
            المساعدة والدعم
          </CardTitle>
          <CardDescription>الوصول إلى وثائق المساعدة، الأسئلة الشائعة، ومعلومات الاتصال بالدعم الفني.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>محتوى صفحة المساعدة والدعم سيتم إضافته هنا.</p>
          <p className="mt-4 text-muted-foreground">هذه الصفحة قيد الإنشاء حاليًا.</p>
        </CardContent>
      </Card>
    </div>
  );
}
