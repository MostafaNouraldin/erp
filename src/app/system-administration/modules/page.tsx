
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

const initialModulesData: Module[] = [
    { id: "MOD002", key: "Accounting", name: "الحسابات", description: "إدارة الحسابات العامة والقيود", isRentable: true, prices: { SAR: { monthly: 100, yearly: 1000 }, EGP: { monthly: 800, yearly: 8000 }, USD: { monthly: 27, yearly: 270 } } },
    { id: "MOD003", key: "Inventory", name: "المخزون", description: "إدارة المنتجات والمستودعات", isRentable: true, prices: { SAR: { monthly: 80, yearly: 800 }, EGP: { monthly: 650, yearly: 6500 }, USD: { monthly: 22, yearly: 220 } } },
    { id: "MOD004", key: "Sales", name: "المبيعات", description: "إدارة عروض الأسعار والفواتير", isRentable: true, prices: { SAR: { monthly: 90, yearly: 900 }, EGP: { monthly: 720, yearly: 7200 }, USD: { monthly: 24, yearly: 240 } } },
    { id: "MOD005", key: "Purchases", name: "المشتريات", description: "إدارة أوامر الشراء والموردين", isRentable: true, prices: { SAR: { monthly: 70, yearly: 700 }, EGP: { monthly: 560, yearly: 5600 }, USD: { monthly: 19, yearly: 190 } } },
    { id: "MOD006", key: "HR", name: "الموارد البشرية", description: "إدارة الموظفين والرواتب", isRentable: true, prices: { SAR: { monthly: 120, yearly: 1200 }, EGP: { monthly: 960, yearly: 9600 }, USD: { monthly: 32, yearly: 320 } } },
    { id: "MOD007", key: "Production", name: "الإنتاج", description: "إدارة عمليات التصنيع", isRentable: true, prices: { SAR: { monthly: 150, yearly: 1500 }, EGP: { monthly: 1200, yearly: 12000 }, USD: { monthly: 40, yearly: 400 } } },
    { id: "MOD008", key: "Projects", name: "المشاريع", description: "إدارة المشاريع والمهام", isRentable: true, prices: { SAR: { monthly: 110, yearly: 1100 }, EGP: { monthly: 880, yearly: 8800 }, USD: { monthly: 29, yearly: 290 } } },
    { id: "MOD009", key: "POS", name: "نقاط البيع", description: "نظام نقاط البيع بالتجزئة", isRentable: true, prices: { SAR: { monthly: 50, yearly: 500 }, EGP: { monthly: 400, yearly: 4000 }, USD: { monthly: 14, yearly: 140 } } },
    { id: "MOD010", key: "BI", name: "التقارير والتحليل", description: "تقارير مجمعة وتحليلات", isRentable: true, prices: { SAR: { monthly: 60, yearly: 600 }, EGP: { monthly: 480, yearly: 4800 }, USD: { monthly: 16, yearly: 160 } } },
    { id: "MOD001", key: "Dashboard", name: "لوحة التحكم", description: "عرض ملخصات وأداء النظام", isRentable: false, prices: { SAR: { monthly: 0, yearly: 0 }, EGP: { monthly: 0, yearly: 0 }, USD: { monthly: 0, yearly: 0 } } },
    { id: "MOD011", key: "Settings", name: "الإعدادات العامة", description: "إعدادات النظام الأساسية", isRentable: false, prices: { SAR: { monthly: 0, yearly: 0 }, EGP: { monthly: 0, yearly: 0 }, USD: { monthly: 0, yearly: 0 } } },
    { id: "MOD012", key: "Help", name: "المساعدة", description: "مركز المساعدة والدعم", isRentable: false, prices: { SAR: { monthly: 0, yearly: 0 }, EGP: { monthly: 0, yearly: 0 }, USD: { monthly: 0, yearly: 0 } } },
    { id: "MOD013", key: "SystemAdministration", name: "إدارة النظام", description: "إدارة الشركات والاشتراكات", isRentable: false, prices: { SAR: { monthly: 0, yearly: 0 }, EGP: { monthly: 0, yearly: 0 }, USD: { monthly: 0, yearly: 0 } } },
];

const pricesSchema = z.object({
  monthly: z.coerce.number().min(0),
  yearly: z.coerce.number().min(0),
});

const moduleConfigSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isRentable: z.boolean(),
  prices: z.object({
    SAR: pricesSchema,
    EGP: pricesSchema,
    USD: pricesSchema,
  }),
});

const modulesFormSchema = z.object({
  modules: z.array(moduleConfigSchema),
});

type ModulesFormValues = z.infer<typeof modulesFormSchema>;

export default function ModulesConfigPage() {
  const [modulesConfig, setModulesConfig] = useState<Module[]>(initialModulesData);
  const { toast } = useToast();

  const form = useForm<ModulesFormValues>({
    resolver: zodResolver(modulesFormSchema),
    defaultValues: { modules: modulesConfig },
  });

  const { fields } = useFieldArray({
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
            تحديد الوحدات المتاحة للتأجير، أسعارها الشهرية والسنوية لمختلف العملات.
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
                      <TableHead className="w-[180px]">اسم الوحدة</TableHead>
                      <TableHead className="w-[100px] text-center">متاحة للتأجير؟</TableHead>
                      <TableHead className="w-[150px]">السعر (SAR)</TableHead>
                      <TableHead className="w-[150px]">السعر (EGP)</TableHead>
                      <TableHead className="w-[150px]">السعر (USD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                            <p>{form.getValues(`modules.${index}.name`)}</p>
                            <p className="text-xs text-muted-foreground">{form.getValues(`modules.${index}.description`)}</p>
                             <input type="hidden" {...form.register(`modules.${index}.id`)} />
                             <input type="hidden" {...form.register(`modules.${index}.key`)} />
                             <input type="hidden" {...form.register(`modules.${index}.name`)} />
                             <input type="hidden" {...form.register(`modules.${index}.description`)} />
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
                        {(['SAR', 'EGP', 'USD'] as const).map(currency => (
                            <TableCell key={currency}>
                                <div className="space-y-2">
                                     <FormField
                                        control={form.control}
                                        name={`modules.${index}.prices.${currency}.monthly`}
                                        render={({ field: inputField }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">شهري</FormLabel>
                                            <FormControl>
                                            <Input type="number" {...inputField} className="bg-background h-8" disabled={!form.watch(`modules.${index}.isRentable`)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`modules.${index}.prices.${currency}.yearly`}
                                        render={({ field: inputField }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">سنوي</FormLabel>
                                            <FormControl>
                                            <Input type="number" {...inputField} className="bg-background h-8" disabled={!form.watch(`modules.${index}.isRentable`)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                            </TableCell>
                        ))}
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
