"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  size?: "default" | "sm";
}

const TableContext = React.createContext<{ size?: "default" | "sm" }>({});

const Table = React.forwardRef<
  HTMLTableElement,
  TableProps
>(({ className, size = "default", children, ...props }, ref) => (
  <TableContext.Provider value={{ size }}>
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm",
          size === "sm" && "text-xs", // Smaller text for "sm" size
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  </TableContext.Provider>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  size?: "default" | "sm";
}

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  TableCellProps // Use TableCellProps for size consistency
>(({ className, size, ...props }, ref) => {
  const parentTable = React.useContext(TableContext);
  const effectiveSize = size || parentTable.size || "default";
  return (
    <th
      ref={ref}
      className={cn(
        "h-12 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        effectiveSize === "sm" ? "px-2 py-2" : "px-4", // Adjusted padding for "sm"
        className
      )}
      {...props}
    />
  )
})
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  TableCellProps
>(({ className, size, ...props }, ref) => {
  const parentTable = React.useContext(TableContext);
  const effectiveSize = size || parentTable.size || "default";
  return (
    <td
      ref={ref}
      className={cn(
        "align-middle [&:has([role=checkbox])]:pr-0",
        effectiveSize === "sm" ? "p-2" : "p-4", // Adjusted padding for "sm"
        className
      )}
      {...props}
    />
  )
})
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// Context to pass table size down - already defined at the top.
// const TableContext = React.createContext<{ size?: "default" | "sm" }>({});

const TableContextProvider = ({ size, children }: { size?: "default" | "sm", children: React.ReactNode }) => (
  <TableContext.Provider value={{ size }}>
    {children}
  </TableContext.Provider>
);


export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableContextProvider,
  TableContext
}
