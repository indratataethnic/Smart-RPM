import React from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

export interface QRCodeProps {
  value: string;
  renderAs?: 'svg' | 'canvas';
  level?: 'L' | 'M' | 'Q' | 'H';
  size?: number;
  marginSize?: number;
  bgColor?: string;
  fgColor?: string;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

/**
 * Standard QR Code component powered by qrcode.react
 * Default config: renderAs='svg', level='M' (Medium Error Correction 15%)
 * Produces crisp, chunky modules with maximum contrast for instant smartphone scanning
 */
export const QRCode: React.FC<QRCodeProps> = ({
  value,
  renderAs = 'svg',
  level = 'M',
  size = 128,
  marginSize = 3,
  bgColor = '#ffffff',
  fgColor = '#000000',
  className = '',
  title,
  style,
}) => {
  if (!value) return null;

  if (renderAs === 'canvas') {
    return (
      <QRCodeCanvas
        value={value}
        size={size}
        level={level}
        marginSize={marginSize}
        bgColor={bgColor}
        fgColor={fgColor}
        className={className}
        title={title}
        style={style}
      />
    );
  }

  return (
    <QRCodeSVG
      value={value}
      size={size}
      level={level}
      marginSize={marginSize}
      bgColor={bgColor}
      fgColor={fgColor}
      className={className}
      title={title}
      style={style}
    />
  );
};

export default QRCode;

