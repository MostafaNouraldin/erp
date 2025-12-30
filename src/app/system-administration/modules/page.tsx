
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SlidersHorizontal, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Module } from '@/types/saas';
import { useCurrency } from '@/hooks/use-currency';

// Initial module data (could be derived from navItems or a central config)
const initialModulesData: Module[] = [
  { id: "MOD001", key: "Dashboard", name: "لوحة التحكم", description: "عرض ملخصات وأداء النظام", isRentable: false, priceMonthly: 0, priceYearly: 0 },
  { id: "MOD002", key: "Accounting", name: "الحسابات", description: "إدارة الحسابات العامة والقيود", isRentable: true, priceMonthly: 100, priceYearly: 1000 },
  { id: "MOD003", key: "Inventory", name: "المخزون", description: "إدارة المنتجات والمستودعات", isRentable: true, priceMonthly: 80, priceYearly: 800 },
  { id: "MOD004", key: "Sales", name: "المبيعات", description: "إدارة عروض الأسعار والفواتير", isRentable: true, priceMonthly: 90, priceYearly: 900 },
  { id: "MOD005", key: "Purchases", name: "المشتريات", description: "إدارة أوامر الشراء والموردين", isRentable: true, priceMonthly: 70, priceYearly: 700 },
  { id: "MOD006", key: "HR", name: "الموارد البشرية", description: "إدارة الموظفين والرواتب", isRentable: true, priceMonthly: 120, priceYearly: 1200 },
  { id: "MOD007", key: "Production", name: "الإنتاج", description: "إدارة عمليات التصنيع", isRentable: true, priceMonthly: 150, priceYearly: 1500 },
  { id: "MOD008", key: "Projects", name: "المشاريع", description: "إدارة المشاريع والمهام", isRentable: true, priceMonthly: 110, priceYearly: 1100 },
  { id: "MOD009", key: "POS", name: "نقاط البيع", description: "نظام نقاط البيع بالتجزئة", isRentable: true, priceMonthly: 50, priceYearly: 500 },
  { id: "MOD010", key: "BI", name: "التقارير والتحليل", description: "تقارير مجمعة وتحليلات", isRentable: true, priceMonthly: 60, priceYearly: 600 },
  { id: "MOD011", key: "Settings", name: "الإعدادات العامة", description: "إعدادات النظام الأساسية", isRentable: false, priceMonthly: 0, priceYearly: 0 },
  { id: "MOD012", key: "Help", name: "المساعدة", description: "مركز المساعدة والدعم", isRentable: false, priceMonthly: 0, priceYearly: 0 },
  { id: "MOD013", key: "SystemAdministration", name: "إدارة النظام", description: "إدارة الشركات والاشتراكات", isRentable: false, priceMonthly: 0, priceYearly: 0 },
];

const moduleConfigSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isRentable: z.boolean(),
  priceMonthly: z.coerce.number().min(0, "السعر يجب أن يكون إيجابياً"),
  priceYearly: z.coerce.number().min(0, "السعر يجب أن يكون إيجابياً"),
});

const modulesFormSchema = z.object({
  modules: z.array(moduleConfigSchema),
});

type ModulesFormValues = z.infer<typeof modulesFormSchema>;

export default function ModulesConfigPage() {
  const [modulesConfig, setModulesConfig] = useState<Module[]>(initialModulesData);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  const form = useForm<ModulesFormValues>({
    resolver: zodResolver(modulesFormSchema),
    defaultValues: { modules: modulesConfig },
  });

  const { fields, update } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  useEffect(() => {
    form.reset({ modules: modulesConfig });
  }, [modulesConfig, form]);

  const handleConfigSubmit = (values: ModulesFormValues) => {
    setModulesConfig(values.modules);
    toast({ title: "تم الحفظ", description: "تم حفظ إعدادات الوحدات والأسعار بنجاح." });
    console.log("Updated Modules Configuration:", values.modules);
    // Here, you would typically save this data to your backend/database
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <SlidersHorizontal className="me-2 h-8 w-8 text-primary" />
            إعدادات الوحدات (Modules) والاشتراكات
          </CardTitle>
          <CardDescription>
            تحديد الوحدات المتاحة للتأجير، أسعارها الشهرية والسنوية، وإدارة إعدادات الاشتراك.
          </CardDescription>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleConfigSubmit)} className="space-y-6 mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>تكوين الوحدات وأسعارها</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">اسم الوحدة (Module)</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead className="w-[120px] text-center">متاحة للتأجير؟</TableHead>
                      <TableHead className="w-[150px]">السعر الشهري</TableHead>
                      <TableHead className="w-[150px]">السعر السنوي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                            {/* Display module name, not editable here but shown for context */}
                            {form.getValues(`modules.${index}.name`)}
                             <input type="hidden" {...form.register(`modules.${index}.id`)} />
                             <input type="hidden" {...form.register(`modules.${index}.key`)} />
                             <input type="hidden" {...form.register(`modules.${index}.name`)} />
                             <input type="hidden" {...form.register(`modules.${index}.description`)} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                             {form.getValues(`modules.${index}.description`)}
                        </TableCell>
                        <TableCell className="text-center">
                          <FormField
                            control={form.control}
                            name={`modules.${index}.isRentable`}
                            render={({ field: switchField }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={switchField.value}
                                    onCheckedChange={switchField.onChange}
                                    disabled={!initialModulesData.find(m => m.id === form.getValues(`modules.${index}.id`))?.isRentable}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`modules.${index}.priceMonthly`}
                            render={({ field: inputField }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" {...inputField} className="bg-background h-9" disabled={!form.watch(`modules.${index}.isRentable`)} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`modules.${index}.priceYearly`}
                            render={({ field: inputField }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" {...inputField} className="bg-background h-9" disabled={!form.watch(`modules.${index}.isRentable`)} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-start mt-6">
            <Button type="submit" className="shadow-md hover:shadow-lg transition-shadow">
              <Save className="me-2 h-4 w-4" /> حفظ الإعدادات
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
