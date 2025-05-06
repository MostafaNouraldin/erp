
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function HRPayrollPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="me-2 h-6 w-6 text-primary" />
            الموارد البشرية والرواتب
          </CardTitle>
          <CardDescription>إدارة بيانات الموظفين، الحضور والانصراف، مسيرات الرواتب، والإجازات.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>محتوى صفحة الموارد البشرية والرواتب سيتم إضافته هنا.</p>
          <p className="mt-4 text-muted-foreground">هذه الصفحة قيد الإنشاء حاليًا.</p>
        </CardContent>
      </Card>
    </div>
  );
}
