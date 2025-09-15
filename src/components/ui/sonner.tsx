// Sonner toast component removed - using console logging instead
// This file is kept for compatibility but the component is disabled

// "use client";

// import { useTheme } from "next-themes";
// import { Toaster as Sonner, ToasterProps } from "sonner";

// const Toaster = ({ ...props }: ToasterProps) => {
//   const { theme = "system" } = useTheme();

//   return (
//     <Sonner
//       theme={theme as ToasterProps["theme"]}
//       className="toaster group"
//       style={
//         {
//           "--normal-bg": "var(--popover)",
//           "--normal-text": "var(--popover-foreground)",
//           "--normal-border": "var(--border)",
//         } as React.CSSProperties
//       }
//       {...props}
//     />
//   );
// };

// Placeholder export to prevent import errors
const Toaster = () => null;

export { Toaster };
