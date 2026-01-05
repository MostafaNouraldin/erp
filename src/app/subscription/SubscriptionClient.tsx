
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, Clock, CalendarDays, ShoppingBag, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Tenant, Module } from '@/types/saas';
import { useCurrency } from '@/hooks/use-currency';

interface SubscriptionClientProps {
  initialData: {
    tenant: Tenant;
    subscribedModules: Module[];
    allAvailableModules: Module[];
  }
}

export default function SubscriptionClient({ initialData }: SubscriptionClientProps) {
  const { tenant, subscribedModules, allAvailableModules } = initialData;
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedNewModules, setSelectedNewModules] = useState<string[]>([]);
  
  const availableForSubscription = allAvailableModules.filter(mod => mod.isRentable && !subscribedModules.some(sub => sub.key === mod.key));

  const calculateRemainingDays = () => {
    if (!tenant.subscriptionEndDate) return "غير محدد";
    const endDate = new Date(tenant.subscriptionEndDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} يوم` : "منتهي";
  };

  const handleModuleSelectionChange = (moduleKey: string, checked: boolean | string) => {
    const isChecked = typeof checked === 'string' ? checked === 'true' : !!checked;
    setSelectedNewModules(prev => {
        if (isChecked) {
            return [...prev, moduleKey];
        } else {
            return prev.filter(key => key !== moduleKey);
        }
    });
  };
  
  const calculateUpgradeCost = () => {
    const selectedModulesData = availableForSubscription.filter(mod => selectedNewModules.includes(mod.key));
    const totalCost = selectedModulesData.reduce((sum, mod) => {
        const prices = mod.prices[formatCurrency(0).symbol as keyof typeof mod.prices] || mod.prices.USD;
        return sum + (billingCycle === 'monthly' ? prices.monthly : prices.yearly);
    }, 0);
    return totalCost;
  };

  const handleRenewalSubmit = () => {
    // In a real application, this would trigger a backend process
    // to create an invoice and handle payment.
    toast({
        title: "تم إرسال طلب الترقية",
        description: `سيتم إنشاء فاتورة بالمبلغ المطلوب: ${formatCurrency(calculateUpgradeCost()).amount}`,
    });
    setSelectedNewModules([]); // Reset selection
  };

  return (
    <div className="container mx-auto py-6 space-y-8" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <Shield className="me-3 h-8 w-8 text-primary" />
            الاشتراك والفوترة
          </CardTitle>
          <CardDescription>
            عرض تفاصيل اشتراكك الحالي، إدارة الوحدات، وتجديد الاشتراك.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Shield className="h-6 w-6"/>
                </div>
                <div>
                    <CardTitle className="text-lg">حالة الاشتراك</CardTitle>
                    <CardDescription>
                       {tenant.isActive ? <span className="text-green-600 font-semibold">نشط</span> : <span className="text-destructive font-semibold">غير نشط</span>}
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
         <Card className="shadow-md">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CalendarDays className="h-6 w-6"/>
                </div>
                <div>
                    <CardTitle className="text-lg">تاريخ انتهاء الاشتراك</CardTitle>
                    <CardDescription className="font-semibold">
                       {tenant.subscriptionEndDate ? new Date(tenant.subscriptionEndDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }) : "غير محدد"}
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
         <Card className="shadow-md">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock className="h-6 w-6"/>
                </div>
                <div>
                    <CardTitle className="text-lg">الأيام المتبقية</CardTitle>
                    <CardDescription className="font-semibold text-primary">
                        {calculateRemainingDays()}
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>الوحدات المشترك بها حالياً</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subscribedModules.map(mod => (
              <div key={mod.key} className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="h-5 w-5"/>
                </div>
                <span className="font-medium text-sm">{mod.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>تجديد أو ترقية الاشتراك</CardTitle>
          <CardDescription>أضف وحدات جديدة إلى اشتراكك أو قم بتجديد اشتراكك الحالي.</CardDescription>
        </CardHeader>
        <CardContent>
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="shadow-md hover:shadow-lg transition-shadow">
                        <PlusCircle className="me-2 h-4 w-4" />
                        تجديد أو ترقية الاشتراك
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تجديد / ترقية الاشتراك</DialogTitle>
                        <DialogDescription>اختر الوحدات الجديدة ودورة الفوترة.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div>
                            <Label className="font-semibold mb-2 block">اختر دورة الفوترة:</Label>
                            <RadioGroup defaultValue="yearly" value={billingCycle} onValueChange={(val: 'monthly' | 'yearly') => setBillingCycle(val)} className="flex gap-4">
                                <Label htmlFor="monthly" className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                    <RadioGroupItem value="monthly" id="monthly" />
                                    شهري
                                </Label>
                                <Label htmlFor="yearly" className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                    <RadioGroupItem value="yearly" id="yearly" />
                                    سنوي (خصم 15%)
                                </Label>
                            </RadioGroup>
                        </div>
                        <div>
                            <Label className="font-semibold mb-2 block">اختر الوحدات الجديدة للإضافة:</Label>
                             <div className="space-y-2">
                                {availableForSubscription.length > 0 ? availableForSubscription.map(mod => {
                                    const prices = mod.prices[formatCurrency(0).symbol as keyof typeof mod.prices] || mod.prices.USD;
                                    return (
                                        <div key={mod.key} className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                                <Checkbox 
                                                    id={`module-${mod.key}`}
                                                    onCheckedChange={(checked) => handleModuleSelectionChange(mod.key, checked)}
                                                />
                                                <div className="space-y-0.5">
                                                    <Label htmlFor={`module-${mod.key}`} className="font-medium cursor-pointer">{mod.name}</Label>
                                                    <p className="text-xs text-muted-foreground">{mod.description}</p>
                                                </div>
                                            </div>
                                            <div className="text-sm font-semibold" dangerouslySetInnerHTML={{ __html: formatCurrency(billingCycle === 'monthly' ? prices.monthly : prices.yearly).amount }}></div>
                                        </div>
                                    )
                                }) : (
                                    <p className="text-muted-foreground text-center p-4">أنت مشترك في جميع الوحدات المتاحة حالياً.</p>
                                )}
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <h3 className="text-lg font-bold flex justify-between">
                                <span>التكلفة الإجمالية للترقية:</span>
                                <span className="text-primary" dangerouslySetInnerHTML={{ __html: formatCurrency(calculateUpgradeCost()).amount }}></span>
                            </h3>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={handleRenewalSubmit} disabled={selectedNewModules.length === 0}>
                            <ShoppingBag className="me-2 h-4 w-4" />
                            تأكيد وإصدار فاتورة
                        </Button>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">إلغاء</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
