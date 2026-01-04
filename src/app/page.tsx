
"use client";

import React, { Suspense } from 'react';
import DashboardClient from "./DashboardClient";
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <DashboardClient />
    </Suspense>
  );
}
