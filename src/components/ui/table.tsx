
"use client"

import * as React from "react"
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./dropdown-menu";
import { Button } from "./button";

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
          size === "sm" && "text-xs",
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
  TableCellProps
>(({ className, size, ...props }, ref) => {
  const parentTable = React.useContext(TableContext);
  const effectiveSize = size || parentTable.size || "default";
  return (
    <th
      ref={ref}
      className={cn(
        "h-12 text-right align-middle font-medium text-muted-foreground rtl:[&:has([role=checkbox])]:pl-0 ltr:[&:has([role=checkbox])]:pr-0",
        effectiveSize === "sm" ? "px-2 py-2" : "px-4 py-3", 
        className
      )}
      {...props}
    />
  )
})
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  TableCellProps & { children?: React.ReactNode }
>(({ className, size, children, ...props }, ref) => {
  const parentTable = React.useContext(TableContext);
  const effectiveSize = size || parentTable.size || "default";

  const childrenArray = React.Children.toArray(children);
  const isActionCell = childrenArray.length > 1 && childrenArray.every(child => React.isValidElement(child) && child.type === Button);

  return (
    <td
      ref={ref}
      className={cn(
        "align-middle rtl:[&:has([role=checkbox])]:pl-0 ltr:[&:has([role=checkbox])]:pr-0",
        effectiveSize === "sm" ? "p-2" : "p-4", 
        isActionCell ? "md:text-center" : "text-right",
        className
      )}
      {...props}
    >
        {isActionCell ? (
            <>
              <div className="hidden md:flex items-center md:justify-center gap-1">
                {children}
              </div>
              <div className="md:hidden">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {React.Children.map(children, (child, index) => (
                           <DropdownMenuItem key={index} asChild>{React.cloneElement(child as React.ReactElement, { className: 'w-full justify-start' })}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </>
        ) : children}
    </td>
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


export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableContext
}
