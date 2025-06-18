
"use client";

import { useState, useEffect } from 'react';

interface TypingEffectProps {
  text: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

const TypingEffect: React.FC<TypingEffectProps> = ({
  text,
  typingSpeed = 70, // Faster typing
  deletingSpeed = 40, // Faster deleting
  pauseDuration = 1500, // Little interval
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0); 

  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;

    const handleTyping = () => {
      const fullText = text;

      if (isDeleting) {
        setDisplayedText((prev) => prev.substring(0, prev.length - 1));
      } else {
        setDisplayedText((prev) => fullText.substring(0, prev.length + 1));
      }

      if (!isDeleting && displayedText === fullText) {
        // Finished typing
        typingTimeout = setTimeout(() => setIsDeleting(true), pauseDuration);
      } else if (isDeleting && displayedText === '') {
        // Finished deleting
        setIsDeleting(false);
        typingTimeout = setTimeout(() => { // Add a small pause before re-typing
             setLoopNum((prev) => prev + 1);
        }, pauseDuration / 2);
      } else {
        // Continue typing or deleting
        typingTimeout = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);
      }
    };

    // Start the typing effect
    typingTimeout = setTimeout(handleTyping, typingSpeed);

    return () => clearTimeout(typingTimeout);
  }, [displayedText, isDeleting, text, typingSpeed, deletingSpeed, pauseDuration, loopNum]);

  // Add a blinking cursor effect and ensure stable height
  return (
    <span className="relative inline-block min-h-[1.2em]">
      {displayedText}
      <span className="animate-ping absolute -right-1 top-0.5 h-full w-0.5 bg-primary opacity-75"></span>
      <span className="absolute -right-1 top-0.5 h-full w-0.5 bg-primary"></span>
    </span>
  );
};

export default TypingEffect;
