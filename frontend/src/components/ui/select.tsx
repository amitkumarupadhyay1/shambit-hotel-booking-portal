import * as React from "react"
import { cn } from "@/lib/utils"

const Select = ({ children, defaultValue, onValueChange, ...props }: any) => {
    return (
        <select
            defaultValue={defaultValue}
            onChange={(e) => onValueChange && onValueChange(e.target.value)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                props.className
            )}
            {...props}
        >
            {children}
        </select>
    )
}

const SelectTrigger = ({ children, className }: any) => <>{children}</>
const SelectValue = ({ placeholder }: any) => <option value="" disabled>{placeholder}</option>
const SelectContent = ({ children }: any) => <>{children}</>
const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
