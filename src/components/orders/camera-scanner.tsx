"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, Loader2, ScanLine } from "lucide-react";

interface CameraScannerProps {
  onScan: (code: string) => void;
  isProcessing?: boolean;
  title?: string;
}

export function CameraScanner({
  onScan,
  isProcessing = false,
  title = "Camera Scanner",
}: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanning = async () => {
    setError(null);

    try {
      // Create scanner instance
      const scannerId = "camera-scanner-" + Date.now();

      // Add the scanner element to the container
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div id="${scannerId}" style="width: 100%;"></div>`;
      }

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Don't stop scanner, just call onScan
          onScan(decodedText);
        },
        () => {
          // QR Code scanning errors (ignore)
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start camera:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to access camera. Please ensure camera permissions are granted."
      );
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    } finally {
      setIsScanning(false);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          scannerRef.current.stop().catch(console.error);
        }
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {title}
          </CardTitle>
          {isScanning && (
            <Button
              variant="destructive"
              size="sm"
              onClick={stopScanning}
            >
              <X className="h-4 w-4 mr-1" />
              Close Camera
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isScanning ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              Click to start scanning barcodes with your camera
            </p>
            <Button onClick={startScanning}>
              <ScanLine className="h-4 w-4 mr-2" />
              Start Camera Scanning
            </Button>
            {error && (
              <p className="text-sm text-destructive mt-4">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Camera viewport */}
            <div
              ref={containerRef}
              className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
            />

            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing scan...</span>
              </div>
            )}

            {/* Instructions */}
            <p className="text-xs text-muted-foreground text-center">
              Point your camera at a barcode to scan. Camera stays open for continuous scanning.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
