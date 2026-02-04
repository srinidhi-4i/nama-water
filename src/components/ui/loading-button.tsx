"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, isLoading, loadingText, className, disabled, ...props }, ref) => {
    // Generate automatic loading text if not provided
    const getLoadingText = () => {
      if (loadingText) return loadingText;
      if (typeof children === "string") {
        if (children.toLowerCase().includes("save")) return "Saving...";
        if (children.toLowerCase().includes("submit")) return "Submitting...";
        if (children.toLowerCase().includes("delete")) return "Deleting...";
        if (children.toLowerCase().includes("update")) return "Updating...";
        if (children.toLowerCase().includes("create")) return "Creating...";
        if (children.toLowerCase().includes("send")) return "Sending...";
        if (children.toLowerCase().includes("search")) return "Searching...";
        return `${children}...`;
      }
      return "Loading...";
    };

    return (
      <Button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn("relative transition-all", className)}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
        )}
        {isLoading ? getLoadingText() : children}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
