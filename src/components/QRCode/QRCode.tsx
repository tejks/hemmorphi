'use client';

import QRCodeStyling, { Options } from 'qr-code-styling';
import { useEffect, useRef, useState } from 'react';
import { defaultQRCodeOptions } from '.';

interface QRCodeProps {
  data: string;
}

export const QRCode = ({ data }: QRCodeProps) => {
  const [options] = useState<Options>({
    width: 300,
    height: 300,
    data,
    ...defaultQRCodeOptions,
  });
  const [qrCode, setQrCode] = useState<QRCodeStyling>();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQrCode(new QRCodeStyling(options));
  }, [options]);

  useEffect(() => {
    if (ref.current && qrCode) qrCode.append(ref.current);
  }, [qrCode, ref]);

  useEffect(() => {
    if (qrCode) qrCode.update(options);
  }, [qrCode, options]);

  return <div ref={ref} />;
};
