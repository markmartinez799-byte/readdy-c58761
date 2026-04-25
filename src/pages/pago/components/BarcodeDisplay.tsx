import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
  className?: string;
}

export default function BarcodeDisplay({
  value,
  width = 2,
  height = 60,
  fontSize = 12,
  displayValue = true,
  className = '',
}: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width,
        height,
        fontSize,
        displayValue,
        margin: 4,
        background: '#ffffff',
        lineColor: '#1e293b',
        fontOptions: 'bold',
        font: 'monospace',
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 4,
      });
    } catch {
      // Si el valor no es válido, no renderizar
    }
  }, [value, width, height, fontSize, displayValue]);

  return <svg ref={svgRef} className={className} />;
}
