import React, { useEffect, useRef } from 'react';

const GradientBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    let animationFrameId;
    let gradientOffset = 0;

    // Set canvas size with extra padding for rotation
    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Make canvas larger to accommodate rotation
      canvas.width = Math.ceil(Math.sqrt(2) * Math.max(width, height));
      canvas.height = canvas.width;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create gradient animation
    const animate = () => {
      // Slow down the animation
      gradientOffset += 0;
      if (gradientOffset >= 1) gradientOffset = 0;

      // Clear the canvas
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Set the transform
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((150 * Math.PI) / 180);
      context.scale(2, 2);
      context.translate(-window.innerWidth / 2, -window.innerHeight / 1);

      const gradient = context.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
      
      // Add color stops with offset animation
      gradient.addColorStop((0 + gradientOffset) % 1, '#ff0000'); // Red
      gradient.addColorStop((0.2 + gradientOffset) % 1, '#000000'); // Black
      gradient.addColorStop((0.4 + gradientOffset) % 1, '#0000ff'); // Blue
      gradient.addColorStop((0.6 + gradientOffset) % 1, '#ff0000'); // Red again
      gradient.addColorStop((0.8 + gradientOffset) % 1, '#000000'); // Black again

      // Draw gradient
      context.fillStyle = gradient;
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="background--custom">
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          zIndex: -1,
          background: 'black',
        }}
      
      />
      <style>
        {`
          .bg {
            background: linear-gradient(135deg, rgb(30, 30, 47) 0%, rgb(30, 30, 36) 100%);
          }
        `}
      </style>
    </div>

  );
};

export default GradientBackground;