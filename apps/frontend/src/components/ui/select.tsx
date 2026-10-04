import { Select as SelectPrimitive } from '@base-ui/react/select'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// shadcn "base-nova" Select on Base UI, trimmed to the parts the app uses. Colors come from the popover/accent tokens,
// which index.css maps to the app theme (light, dark, high contrast).
const Select = SelectPrimitive.Root

function SelectValue(props: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({ className, children, ...props }: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        'flex items-center gap-1.5 outline-none select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-link disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="transition-transform data-[popup-open]:rotate-180">
        <ChevronDownIcon size={16} aria-hidden />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({ className, children, ...props }: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-50 outline-none">
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            'max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          {...props}
        >
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl py-2 pr-9 pl-3 text-[15px] outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:font-semibold',
        'relative',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex items-center gap-2.5">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center">
        <CheckIcon size={16} aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
