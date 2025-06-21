'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { FaRobot, FaCubes, FaUsers, FaUserPlus, FaBrain, FaChalkboardTeacher, FaCertificate, FaUserTie, FaCogs, FaCheckCircle, FaHourglassHalf, FaCube } from 'react-icons/fa';

// New Mock Data reflecting the updated narrative
const communityStories = [
  { 
    id: 1, 
    name: 'Alice, Verified Teacher', 
    story: 'Built her global reputation and doubled her students through our transparent, on-chain review system.',
    imageUrl: 'https://via.placeholder.com/150/818cf8/ffffff?text=A'
  },
  { 
    id: 2, 
    name: 'Ben, Fluent Learner', 
    story: 'Landed his dream tech job by showcasing his blockchain-verified English proficiency certificate.',
    imageUrl: 'https://via.placeholder.com/150/a78bfa/ffffff?text=B'
  },
];

const testimonials = [
  { 
    id: 1, 
    quote: 'The AI practice partner is a game-changer. My on-chain certificate helped me get into my dream university.', 
    author: 'Chen Wei, Student' 
  },
  { 
    id: 2, 
    quote: 'The transparent feedback system boosted my credibility and connected me with students worldwide. A true open market for skills.', 
    author: 'Maria, Teacher'
  },
];

// --- Reusable Hook for Scroll Animations ---
const useInView = (options?: IntersectionObserverInit) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    const callbackFunction = (entries: IntersectionObserverEntry[]) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
            setIsInView(true);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(callbackFunction, options);
        const currentRef = containerRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [containerRef, options]);

    return [containerRef, isInView];
};

// --- Wrapper Component for Animating Sections on Scroll ---
const AnimateOnScroll = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => {
    const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });
    
    return (
        <div 
            ref={ref} 
            className={`${className} transition-all duration-1000 ease-out ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// --- Interactive AI Demo Component ---
const AIDemo = () => {
  const [text, setText] = useState("I has been to London last year for visit my uncle.");
  const [analysis, setAnalysis] = useState<{fluency: number, grammar: number, clarity: number} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setTimeout(() => {
      setAnalysis({ fluency: 78, grammar: 65, clarity: 85 });
      setIsAnalyzing(false);
    }, 2000);
  };

  const AnalysisBar = ({ score, label }: { score: number, label: string }) => (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-gray-300">{label}</span>
        <span className="text-sm font-medium text-white">{score}%</span>
      </div>
      <div className="w-full bg-gray-600 rounded-full h-2.5">
        <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `0%`, transition: 'width 1s ease-in-out 0.5s' }} ref={(el) => el && setTimeout(() => el.style.width = `${score}%`, 100)}></div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl">
      <h3 className="text-3xl font-bold text-white text-center mb-6">See Your AI Co-Pilot in Action</h3>
      <div className="bg-gray-900 p-4 rounded-lg">
        <textarea
          className="w-full bg-transparent text-gray-300 p-2 border-2 border-gray-600 rounded-md focus:border-cyan-400 focus:outline-none"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="text-center mt-6">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="bg-cyan-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-cyan-400 transition-all duration-300 disabled:bg-gray-500 transform hover:scale-105"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze My Sentence'}
        </button>
      </div>
      {(isAnalyzing || analysis) && (
        <div className="mt-8 border-t border-gray-700 pt-6">
          <h4 className="text-xl font-semibold text-white mb-4">Analysis Results:</h4>
          {isAnalyzing && <p className="text-center text-cyan-300 animate-pulse">Running advanced linguistics model...</p>}
          {analysis && (
            <div className="space-y-4 animate-fadeInUp">
               <div className="p-4 bg-gray-700 rounded-lg">
                 <p className="text-lg text-white">
                    I <span className="bg-red-500/30 text-red-300 rounded px-1">has been</span> to London last year <span className="bg-yellow-500/30 text-yellow-300 rounded px-1">for visit</span> my uncle.
                 </p>
               </div>
              <AnalysisBar score={analysis.fluency} label="Fluency" />
              <AnalysisBar score={analysis.grammar} label="Grammar" />
              <AnalysisBar score={analysis.clarity} label="Clarity" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Home Component ---
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timelineRef, timelineInView] = useInView({ threshold: 0.2, triggerOnce: true });

  // --- Particle Animation Effect ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[];
    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    const mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
        mouse.x = -1000;
        mouse.y = -1000;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number;
      constructor(x: number, y: number, size: number) {
        this.x = x; this.y = y; this.size = size;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.speedY = Math.random() * 0.4 - 0.2;
      }
      update() {
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
        this.x += this.speedX;
        this.y += this.speedY;
      }
      draw() {
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.closePath();
        ctx!.fill();
      }
    }

    const init = () => {
      particles = [];
      const numberOfParticles = (canvas.height * canvas.width) / 9000;
      for (let i = 0; i < numberOfParticles; i++) {
        let size = Math.random() * 1.5 + 0.5;
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particles.push(new Particle(x, y, size));
      }
    };

    const connect = () => {
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let distance = Math.sqrt(
            (particles[a].x - particles[b].x) * (particles[a].x - particles[b].x) +
            (particles[a].y - particles[b].y) * (particles[a].y - particles[b].y)
          );
          if (distance < 100) {
            opacityValue = 1 - (distance / 100);
            ctx!.strokeStyle = `rgba(127, 255, 212, ${opacityValue * 0.3})`; // Aquamarine color
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(particles[a].x, particles[a].y);
            ctx!.lineTo(particles[b].x, particles[b].y);
            ctx!.stroke();
          }
        }
      }
      for (let i = 0; i < particles.length; i++) {
        let distance = Math.sqrt(
          (particles[i].x - mouse.x) * (particles[i].x - mouse.x) +
          (particles[i].y - mouse.y) * (particles[i].y - mouse.y)
        );
        if (distance < 150) {
          ctx!.strokeStyle = `rgba(173, 216, 230, ${1 - distance / 150})`; // LightBlue
          ctx!.lineWidth = 0.5;
          ctx!.beginPath();
          ctx!.moveTo(particles[i].x, mouse.y);
          ctx!.lineTo(mouse.x, particles[i].y);
          ctx!.stroke();
        }
      }
    };

    const animate = () => {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="bg-gray-900 text-white">
      {/* --- Hero Section --- */}
      <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 bg-gray-900" />
        <div className="relative z-10 p-6">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight animate-fadeInDown">
            Speak English Confidently. Faster.
          </h1>
          <p className="text-xl max-w-3xl mx-auto mb-10 text-gray-300 animate-fadeInUp">
            LangBridge pairs you with elite educators and a personal AI co-pilot that analyzes your speech, pinpoints your weaknesses, and creates your unique path to fluency.
          </p>
          <button className="bg-cyan-500 text-white px-10 py-4 rounded-full text-lg font-bold shadow-xl hover:bg-cyan-400 transform hover:scale-105 transition-all duration-300">
            Find Your Perfect Teacher
          </button>
        </div>
      </section>

      <div className="space-y-32 py-24 bg-gray-900 overflow-x-hidden">
        {/* --- Platform Strengths --- */}
        <section className="container mx-auto px-6">
           <AnimateOnScroll><h2 className="text-4xl font-bold text-center mb-16">The Most Effective Way to Fluency</h2></AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <AnimateOnScroll delay={0}>
                  <div className="bg-gray-800 p-8 rounded-2xl text-center h-full">
                      <div className="text-cyan-400 mb-5 inline-block"><FaUserTie size={40} /></div>
                      <h3 className="text-2xl font-bold mb-3">Elite Educators</h3>
                      <p className="text-gray-400">We connect you with the world's best teachers, vetted for experience and teaching excellence.</p>
                  </div>
                </AnimateOnScroll>
                <AnimateOnScroll delay={200}>
                  <div className="bg-gray-800 p-8 rounded-2xl text-center h-full">
                      <div className="text-cyan-400 mb-5 inline-block"><FaBrain size={40} /></div>
                      <h3 className="text-2xl font-bold mb-3">AI Learning Co-Pilot</h3>
                      <p className="text-gray-400">Your AI partner provides instant feedback, personalized drills, and tracks every step of your progress.</p>
                  </div>
                </AnimateOnScroll>
                <AnimateOnScroll delay={400}>
                  <div className="bg-gray-800 p-8 rounded-2xl text-center h-full">
                      <div className="text-cyan-400 mb-5 inline-block"><FaCogs size={40} /></div>
                      <h3 className="text-2xl font-bold mb-3">Seamless Management</h3>
                      <p className="text-gray-400">Focus on learning, not logistics. We handle scheduling, progress reports, and payments effortlessly.</p>
                  </div>
                </AnimateOnScroll>
            </div>
        </section>

        {/* --- Interactive AI Demo --- */}
        <AnimateOnScroll className="container mx-auto px-6">
          <AIDemo />
        </AnimateOnScroll>

        {/* --- The Roadmap Section --- */}
        <section className="container mx-auto px-6">
            <AnimateOnScroll><h2 className="text-4xl font-bold text-center mb-20">Our Vision for the Future</h2></AnimateOnScroll>
            <div ref={timelineRef} className="relative">
                {/* The vertical line - animated */}
                <div className={`absolute left-1/2 -translate-x-1/2 h-full w-1 bg-gray-700 rounded-full transition-transform duration-1000 ease-in-out origin-top ${timelineInView ? 'scale-y-100' : 'scale-y-0'}`}></div>
                
                <div className="space-y-24">
                    {/* Step 1 */}
                    <AnimateOnScroll delay={200} className="relative flex items-center justify-end">
                       <div className="md:w-1/2 md:pr-8 text-right">
                           <h3 className="text-2xl font-bold text-cyan-400">AI-Enhanced Learning</h3>
                           <p className="text-gray-400 mt-2">Master English with your personal AI co-pilot and expert human tutors.</p>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center ring-8 ring-gray-900">
                            <FaCheckCircle size={24} />
                        </div>
                        <div className="md:w-1/2 pl-8 hidden md:block"><span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full font-semibold">Live Now</span></div>
                    </AnimateOnScroll>
                     {/* Step 2 */}
                    <AnimateOnScroll delay={400} className="relative flex items-center">
                        <div className="md:w-1/2 pr-8 text-right hidden md:block"><span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full font-semibold">In Development</span></div>
                         <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center ring-8 ring-gray-900">
                            <FaHourglassHalf size={24} className="text-yellow-400"/>
                        </div>
                        <div className="md:w-1/2 md:pl-8">
                           <h3 className="text-2xl font-bold">The Open Platform</h3>
                           <p className="text-gray-400 mt-2">A vibrant marketplace where anyone can register to teach, share their skills, and earn.</p>
                        </div>
                    </AnimateOnScroll>
                     {/* Step 3 */}
                    <AnimateOnScroll delay={600} className="relative flex items-center justify-end">
                        <div className="md:w-1/2 md:pr-8 text-right">
                           <h3 className="text-2xl font-bold">Web3 Credentials</h3>
                           <p className="text-gray-400 mt-2">Own your learning journey with a verifiable, on-chain portfolio of your achievements.</p>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center ring-8 ring-gray-900">
                            <FaCube size={24} className="text-purple-400"/>
                        </div>
                        <div className="md:w-1/2 pl-8 hidden md:block"><span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full font-semibold">Planned</span></div>
                    </AnimateOnScroll>
                </div>
            </div>
        </section>

        {/* --- Final CTA --- */}
        <AnimateOnScroll className="container mx-auto px-6 text-center">
           <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-12 rounded-2xl transform hover:scale-[1.02] transition-transform duration-500">
              <h2 className="text-4xl font-bold mb-4">Ready to Begin?</h2>
              <p className="text-xl max-w-2xl mx-auto mb-8 text-gray-200">Your journey to fluency starts with a single step. Let's find the perfect teacher for you.</p>
              <button className="bg-white text-blue-700 px-10 py-4 rounded-full text-lg font-bold shadow-xl hover:bg-gray-200 transform hover:scale-105 transition-all duration-300">
                Start Your Journey
              </button>
           </div>
        </AnimateOnScroll>
      </div>

       {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 border-t border-gray-700">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">&copy; 2024 LangBridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
