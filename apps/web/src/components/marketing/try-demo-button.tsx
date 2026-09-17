import Link from "next/link";
import { Button } from "@/components/ui/button";

type TryDemoButtonProps = {
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
};

/** Routes to the sign-in form — credentials are entered there, not auto-filled. */
export function TryDemoButton({
  size = "lg",
  className,
  children = "Try the live demo",
}: TryDemoButtonProps) {
  return (
    <Button asChild size={size} className={className}>
      <Link href="/login?callbackUrl=/chat">{children}</Link>
    </Button>
  );
}
