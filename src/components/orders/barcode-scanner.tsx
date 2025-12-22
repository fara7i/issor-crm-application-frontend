"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Barcode, Camera, Keyboard, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function BarcodeScanner({
  onScan,
  isLoading,
  placeholder = "Enter or scan barcode...",
}: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [mode, setMode] = useState<"input" | "camera">("input");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "input" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode.trim());
      setBarcode("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Barcode className="h-4 w-4" />
            Barcode Scanner
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={mode === "input" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("input")}
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button
              variant={mode === "camera" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("camera")}
              disabled
              title="Camera scanning coming soon"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "input" ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="barcode">Product Barcode</Label>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  id="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  autoComplete="off"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={!barcode.trim() || isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Scan"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use a USB barcode scanner or enter the barcode manually
              </p>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Camera scanning will be available soon
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              For now, please use the keyboard input mode
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
