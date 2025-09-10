import * as React from "react"

interface VisuallyHiddenProps {
  children: React.ReactNode
  asChild?: boolean
}

const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  VisuallyHiddenProps
>(({ children, asChild = false, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "span"
  
  if (asChild) {
    return <>{children}</>
  }

  return (
    <span
      ref={ref}
      {...props}
      style={{
        position: "absolute",
        border: 0,
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        wordWrap: "normal",
      }}
    >
      {children}
    </span>
  )
})

VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }