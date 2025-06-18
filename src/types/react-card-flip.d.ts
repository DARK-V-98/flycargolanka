
declare module 'react-card-flip' {
  import type { CSSProperties, ReactNode } from 'react';

  export interface ReactCardFlipProps {
    isFlipped: boolean;
    flipDirection?: 'horizontal' | 'vertical';
    flipSpeedBackToFront?: number;
    flipSpeedFrontToBack?: number;
    cardStyles?: {
      front?: CSSProperties;
      back?: CSSProperties;
    };
    containerStyle?: CSSProperties;
    containerClassName?: string;
    cardZIndex?: string;
    infinite?: boolean;
    children: [ReactNode, ReactNode];
  }

  const ReactCardFlip: React.FC<ReactCardFlipProps>;
  export default ReactCardFlip;
}
