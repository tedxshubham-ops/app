import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Switch } from './components/ui/switch';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Separator } from './components/ui/separator';
import { ScrollArea } from './components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Mic, MicOff, Play, Download, ExternalLink, Github, 
  Zap, Cpu, Activity, Code, Palette, Database, 
  Shield, TestTube, Rocket, Sun, Moon, Users, 
  BarChart3, Sparkles, Globe, Brain, Network,
  Settings, ChevronRight, Clock, CheckCircle,
  AlertCircle, Loader2, Eye, Copy, Star,
  Wand2, Fire, Atom, Hexagon,
  Command, Layers, Gauge, Wifi, Radio,
  Target, Crosshair, Radar, Orbit, Satellite,
  Fingerprint, Scan, Waves, Signal
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PHASE_ICONS = {
  analysis: BarChart3,
  design: Palette,
  frontend: Code,
  backend: Database,
  testing: TestTube,
  deployment: Rocket
};

const PHASE_COLORS = {
  analysis: 'from-cyan-400 via-blue-500 to-indigo-600',
  design: 'from-purple-400 via-pink-500 to-rose-600',
  frontend: 'from-green-400 via-emerald-500 to-teal-600',
  backend: 'from-orange-400 via-red-500 to-pink-600',
  testing: 'from-yellow-400 via-orange-500 to-red-600',
  deployment: 'from-indigo-400 via-purple-500 to-pink-600'
};

const PHASE_GLOW_COLORS = {
  analysis: 'rgba(59, 130, 246, 0.4)',
  design: 'rgba(168, 85, 247, 0.4)',
  frontend: 'rgba(16, 185, 129, 0.4)',
  backend: 'rgba(239, 68, 68, 0.4)',
  testing: 'rgba(251, 191, 36, 0.4)',
  deployment: 'rgba(139, 92, 246, 0.4)'
};

// Particle system component for crazy effects
const ParticleSystem = ({ isActive, phase }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    const createParticles = () => {
      const particles = [];
      const count = isActive ? 150 : 50;
      
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          color: isActive ? PHASE_GLOW_COLORS[phase] || 'rgba(59, 130, 246, 0.4)' : 'rgba(100, 100, 100, 0.2)'
        });
      }
      return particles;
    };

    particlesRef.current = createParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Boundary check
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        // Pulsing effect for active state
        if (isActive) {
          particle.size = Math.sin(Date.now() * 0.001 + index) * 2 + 3;
          particle.opacity = Math.sin(Date.now() * 0.002 + index) * 0.5 + 0.5;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace('0.4', particle.opacity.toString());
        ctx.fill();
        
        // Draw connections between nearby particles
        particlesRef.current.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = particle.color.replace('0.4', (0.1 * (1 - distance / 100)).toString());
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, phase]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-30"
      style={{ 
        background: isActive 
          ? `radial-gradient(circle at 50% 50%, ${PHASE_GLOW_COLORS[phase] || 'rgba(59, 130, 246, 0.1)'}, transparent 70%)`
          : 'transparent'
      }}
    />
  );
};

// Crazy agent card with mind-blowing effects
const AgentCard = ({ agent, isActive, progress, index }) => {
  const Icon = PHASE_ICONS[agent.phase] || Activity;
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  return (
    <div 
      ref={cardRef}
      className={`
        agent-card relative p-4 rounded-2xl border transition-all duration-700 cursor-pointer
        ${isActive 
          ? 'bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 border-blue-400/50 dark:border-blue-600/50 shadow-2xl shadow-blue-500/25 scale-105 animate-pulse-glow' 
          : 'bg-white/60 dark:bg-gray-800/60 border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:scale-102 hover:bg-white/80 dark:hover:bg-gray-800/80'
        }
        backdrop-blur-xl overflow-hidden group
      `}
      onMouseMove={handleMouseMove}
      style={{
        animationDelay: `${index * 50}ms`,
        transform: `perspective(1000px) rotateX(${isActive ? Math.sin(Date.now() * 0.001 + index) * 2 : 0}deg) rotateY(${isActive ? Math.cos(Date.now() * 0.001 + index) * 2 : 0}deg)`
      }}
    >
      {/* Crazy mouse tracking spotlight effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle 150px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1), transparent)`
        }}
      />
      
      {/* Active agent energy field */}
      {isActive && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent animate-slide-x"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-400/10 to-transparent animate-slide-y"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-20 animate-spin-slow"></div>
        </>
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`
            p-3 rounded-xl transition-all duration-500
            ${isActive 
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50 animate-float' 
              : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-300'
            }
          `}>
            <Icon size={20} className={isActive ? 'animate-spin-slow' : ''} />
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isActive ? "default" : "secondary"} 
              className={`
                transition-all duration-500 
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white animate-pulse-glow shadow-lg' 
                  : ''
                }
              `}
            >
              {agent.status}
            </Badge>
            {isActive && (
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
            )}
          </div>
        </div>
        
        <h4 className="font-bold text-sm mb-2 text-gray-900 dark:text-gray-100 leading-tight">
          {agent.name}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          {agent.specialization}
        </p>
        
        {isActive && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Activity size={12} className="animate-pulse" />
              <span className="animate-text-shimmer">Processing neural pathways...</span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-700">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-progress-glow transition-all duration-500" />
            </Progress>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Neural Activity</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">{progress}%</span>
            </div>
          </div>
        )}
        
        {agent.status === 'complete' && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mt-2">
            <CheckCircle size={12} />
            <span>Task completed successfully</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Insane phase section with crazy effects
const PhaseSection = ({ phase, agents, activeAgents, currentPhase, completedCount, totalCount }) => {
  const Icon = PHASE_ICONS[phase];
  const isCurrentPhase = currentPhase === phase;
  const phaseAgents = agents.filter(agent => agent.phase === phase);
  const phaseRef = useRef(null);
  
  return (
    <div 
      ref={phaseRef}
      className={`
        phase-section relative p-8 rounded-3xl border transition-all duration-1000 overflow-hidden
        ${isCurrentPhase 
          ? 'bg-gradient-to-br from-white/90 via-blue-50/90 to-indigo-50/90 dark:from-gray-800/90 dark:via-blue-950/50 dark:to-indigo-950/50 border-blue-400/50 dark:border-blue-600/50 shadow-2xl shadow-blue-500/20 animate-phase-glow' 
          : 'bg-white/50 dark:bg-gray-800/50 border-gray-200/30 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-800/70'
        }
        backdrop-blur-2xl
      `}
    >
      {/* Crazy background effects for active phase */}
      {isCurrentPhase && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-pulse-wave"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-pulse-wave-reverse"></div>
          <div className={`absolute -inset-2 bg-gradient-to-r ${PHASE_COLORS[phase]} rounded-3xl opacity-10 animate-spin-very-slow`}></div>
        </>
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`
              relative p-4 rounded-2xl bg-gradient-to-r ${PHASE_COLORS[phase]} shadow-xl
              ${isCurrentPhase ? 'animate-float shadow-2xl' : 'shadow-lg'}
            `}>
              <Icon className="text-white" size={32} />
              {isCurrentPhase && (
                <>
                  <div className="absolute inset-0 rounded-2xl animate-ping bg-white/30"></div>
                  <div className="absolute -inset-1 rounded-2xl animate-pulse bg-gradient-to-r from-white/20 to-transparent"></div>
                </>
              )}
            </div>
            <div>
              <h3 className="font-black text-2xl capitalize text-gray-900 dark:text-gray-100 mb-1">
                {phase} Phase
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span>{completedCount}/{phaseAgents.length} agents completed</span>
                {isCurrentPhase && (
                  <Badge className="bg-green-500 text-white animate-pulse">
                    <Activity size={12} className="mr-1" />
                    ACTIVE
                  </Badge>
                )}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-black text-gray-900 dark:text-gray-100">
              {Math.round((completedCount / phaseAgents.length) * 100)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Complete</div>
          </div>
        </div>
        
        {/* Phase progress bar with crazy effects */}
        <div className="mb-6">
          <Progress 
            value={(completedCount / phaseAgents.length) * 100} 
            className={`h-3 ${isCurrentPhase ? 'animate-pulse-glow' : ''}`}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {phaseAgents.map((agent, index) => (
            <AgentCard 
              key={agent.id}
              agent={agent}
              isActive={activeAgents.includes(agent.id)}
              progress={agent.progress || 0}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Live preview component with insane effects
const LivePreview = ({ projectId, previewHtml, isGenerating }) => {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (previewHtml && iframeRef.current) {
      setIsLoading(true);
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(previewHtml);
      doc.close();
      
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, [previewHtml]);
  
  return (
    <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl overflow-hidden">
      <CardHeader className="pb-4 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
              <Eye className="text-white" size={20} />
            </div>
            Live Preview
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </div>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white animate-pulse">
              <Radio size={12} className="mr-1" />
              LIVE
            </Badge>
          </div>
        </div>
        
        {isGenerating && !previewHtml && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-slide-x"></div>
        )}
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <div className="relative aspect-video bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 rounded-lg overflow-hidden border">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
              <div className="text-center space-y-4">
                <Loader2 size={32} className="animate-spin text-blue-500 mx-auto" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading preview...</p>
              </div>
            </div>
          )}
          
          {!previewHtml && !isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center">
                  <Globe size={32} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">No Preview Yet</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Start generating your website to see the live preview here
                  </p>
                </div>
              </div>
            </div>
          ) : !previewHtml && isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-6 p-8">
                <div className="relative">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center animate-float">
                    <Wand2 size={48} className="text-white animate-pulse" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl animate-ping opacity-20"></div>
                </div>
                <div>
                  <h4 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-2">
                    ✨ AI Magic in Progress
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    88 AI agents are crafting your amazing website...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0 rounded-lg"
              title="Website Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [currentProject, setCurrentProject] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agents, setAgents] = useState([]);
  const [activeAgents, setActiveAgents] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('initializing');
  const [progress, setProgress] = useState(0);
  const [previewHtml, setPreviewHtml] = useState(null);
  
  const [prompt, setPrompt] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [includeAuth, setIncludeAuth] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef(null);
  const wsRef = useRef(null);

  // Initialize agents data
  useEffect(() => {
    const agentsData = [
      // Analysis Phase (22 agents)
      {id: "agent_001", name: "Business Model Analyzer", phase: "analysis", specialization: "Business strategy and revenue models", status: "idle", progress: 0},
      {id: "agent_002", name: "Target Audience Researcher", phase: "analysis", specialization: "User personas and demographics", status: "idle", progress: 0},
      {id: "agent_003", name: "Competitor Analysis Specialist", phase: "analysis", specialization: "Market positioning and competitive landscape", status: "idle", progress: 0},
      {id: "agent_004", name: "Brand Identity Extractor", phase: "analysis", specialization: "Brand voice and visual identity", status: "idle", progress: 0},
      {id: "agent_005", name: "Content Strategy Planner", phase: "analysis", specialization: "Content architecture and messaging", status: "idle", progress: 0},
      {id: "agent_006", name: "User Journey Mapper", phase: "analysis", specialization: "Customer experience pathways", status: "idle", progress: 0},
      {id: "agent_007", name: "Value Proposition Designer", phase: "analysis", specialization: "Core value and differentiation", status: "idle", progress: 0},
      {id: "agent_008", name: "Market Trends Analyst", phase: "analysis", specialization: "Industry trends and opportunities", status: "idle", progress: 0},
      {id: "agent_009", name: "Pain Point Identifier", phase: "analysis", specialization: "Customer problems and solutions", status: "idle", progress: 0},
      {id: "agent_010", name: "Feature Prioritizer", phase: "analysis", specialization: "Feature importance and roadmap", status: "idle", progress: 0},
      {id: "agent_011", name: "Conversion Goal Setter", phase: "analysis", specialization: "KPI definition and optimization", status: "idle", progress: 0},
      {id: "agent_012", name: "Technical Requirements Analyzer", phase: "analysis", specialization: "Platform and integration needs", status: "idle", progress: 0},
      {id: "agent_013", name: "SEO Strategy Consultant", phase: "analysis", specialization: "Search optimization planning", status: "idle", progress: 0},
      {id: "agent_014", name: "Mobile Strategy Planner", phase: "analysis", specialization: "Mobile-first considerations", status: "idle", progress: 0},
      {id: "agent_015", name: "Performance Requirements Analyst", phase: "analysis", specialization: "Speed and scalability needs", status: "idle", progress: 0},
      {id: "agent_016", name: "Security Assessment Specialist", phase: "analysis", specialization: "Security requirements and compliance", status: "idle", progress: 0},
      {id: "agent_017", name: "Analytics Requirements Planner", phase: "analysis", specialization: "Tracking and measurement setup", status: "idle", progress: 0},
      {id: "agent_018", name: "Accessibility Consultant", phase: "analysis", specialization: "WCAG compliance and inclusion", status: "idle", progress: 0},
      {id: "agent_019", name: "Integration Requirements Analyst", phase: "analysis", specialization: "Third-party service planning", status: "idle", progress: 0},
      {id: "agent_020", name: "Content Management Strategist", phase: "analysis", specialization: "CMS and content workflow needs", status: "idle", progress: 0},
      {id: "agent_021", name: "User Testing Planner", phase: "analysis", specialization: "Testing strategy and validation", status: "idle", progress: 0},
      {id: "agent_022", name: "Growth Strategy Consultant", phase: "analysis", specialization: "Scalability and expansion planning", status: "idle", progress: 0},
      
      // Design Phase (22 agents)
      {id: "agent_023", name: "Color Palette Generator", phase: "design", specialization: "Brand colors and psychology", status: "idle", progress: 0},
      {id: "agent_024", name: "Typography Curator", phase: "design", specialization: "Font selection and hierarchy", status: "idle", progress: 0},
      {id: "agent_025", name: "Layout Architect", phase: "design", specialization: "Grid systems and spatial design", status: "idle", progress: 0},
      {id: "agent_026", name: "UI Component Designer", phase: "design", specialization: "Interface elements and patterns", status: "idle", progress: 0},
      {id: "agent_027", name: "Brand Consistency Checker", phase: "design", specialization: "Visual identity alignment", status: "idle", progress: 0},
      {id: "agent_028", name: "Visual Hierarchy Specialist", phase: "design", specialization: "Information architecture design", status: "idle", progress: 0},
      {id: "agent_029", name: "Icon Library Curator", phase: "design", specialization: "Icon system and visual language", status: "idle", progress: 0},
      {id: "agent_030", name: "Responsive Design Engineer", phase: "design", specialization: "Multi-device layout adaptation", status: "idle", progress: 0},
      {id: "agent_031", name: "Animation Director", phase: "design", specialization: "Micro-interactions and motion", status: "idle", progress: 0},
      {id: "agent_032", name: "Image Style Coordinator", phase: "design", specialization: "Photography and imagery curation", status: "idle", progress: 0},
      {id: "agent_033", name: "Whitespace Optimizer", phase: "design", specialization: "Spacing and breathing room", status: "idle", progress: 0},
      {id: "agent_034", name: "Visual Flow Designer", phase: "design", specialization: "User journey visualization", status: "idle", progress: 0},
      {id: "agent_035", name: "Accessibility Design Consultant", phase: "design", specialization: "Inclusive design patterns", status: "idle", progress: 0},
      {id: "agent_036", name: "Mobile UI Specialist", phase: "design", specialization: "Touch-first interface design", status: "idle", progress: 0},
      {id: "agent_037", name: "Dark Mode Designer", phase: "design", specialization: "Theme variations and adaptability", status: "idle", progress: 0},
      {id: "agent_038", name: "Loading State Designer", phase: "design", specialization: "Progressive enhancement visuals", status: "idle", progress: 0},
      {id: "agent_039", name: "Error State Designer", phase: "design", specialization: "Error handling and messaging", status: "idle", progress: 0},
      {id: "agent_040", name: "Form Design Specialist", phase: "design", specialization: "Input patterns and validation", status: "idle", progress: 0},
      {id: "agent_041", name: "Navigation Designer", phase: "design", specialization: "Menu systems and wayfinding", status: "idle", progress: 0},
      {id: "agent_042", name: "CTA Optimization Expert", phase: "design", specialization: "Call-to-action design and placement", status: "idle", progress: 0},
      {id: "agent_043", name: "Visual Storytelling Designer", phase: "design", specialization: "Narrative flow and engagement", status: "idle", progress: 0},
      {id: "agent_044", name: "Brand Asset Creator", phase: "design", specialization: "Logo adaptation and brand elements", status: "idle", progress: 0},
      
      // Frontend Phase (22 agents)
      {id: "agent_045", name: "React Component Architect", phase: "frontend", specialization: "Component structure and patterns", status: "idle", progress: 0},
      {id: "agent_046", name: "CSS Framework Engineer", phase: "frontend", specialization: "Styling architecture and optimization", status: "idle", progress: 0},
      {id: "agent_047", name: "Animation Implementation Specialist", phase: "frontend", specialization: "CSS and JavaScript animations", status: "idle", progress: 0},
      {id: "agent_048", name: "Responsive Code Engineer", phase: "frontend", specialization: "Breakpoint management and flexibility", status: "idle", progress: 0},
      {id: "agent_049", name: "Performance Optimization Expert", phase: "frontend", specialization: "Bundle size and load time optimization", status: "idle", progress: 0},
      {id: "agent_050", name: "Accessibility Implementation Engineer", phase: "frontend", specialization: "ARIA patterns and keyboard navigation", status: "idle", progress: 0},
      {id: "agent_051", name: "SEO Implementation Specialist", phase: "frontend", specialization: "Meta tags and structured data", status: "idle", progress: 0},
      {id: "agent_052", name: "Form Validation Engineer", phase: "frontend", specialization: "Client-side validation and UX", status: "idle", progress: 0},
      {id: "agent_053", name: "State Management Architect", phase: "frontend", specialization: "Application state and data flow", status: "idle", progress: 0},
      {id: "agent_054", name: "API Integration Specialist", phase: "frontend", specialization: "Backend communication and error handling", status: "idle", progress: 0},
      {id: "agent_055", name: "Routing Implementation Engineer", phase: "frontend", specialization: "Navigation and URL management", status: "idle", progress: 0},
      {id: "agent_056", name: "Image Optimization Specialist", phase: "frontend", specialization: "Asset loading and compression", status: "idle", progress: 0},
      {id: "agent_057", name: "Progressive Enhancement Engineer", phase: "frontend", specialization: "Graceful degradation and fallbacks", status: "idle", progress: 0},
      {id: "agent_058", name: "Cross-Browser Compatibility Specialist", phase: "frontend", specialization: "Browser testing and polyfills", status: "idle", progress: 0},
      {id: "agent_059", name: "Security Implementation Engineer", phase: "frontend", specialization: "XSS prevention and secure patterns", status: "idle", progress: 0},
      {id: "agent_060", name: "Error Boundary Engineer", phase: "frontend", specialization: "Error handling and recovery", status: "idle", progress: 0},
      {id: "agent_061", name: "Testing Implementation Specialist", phase: "frontend", specialization: "Unit and integration testing", status: "idle", progress: 0},
      {id: "agent_062", name: "PWA Implementation Engineer", phase: "frontend", specialization: "Service workers and offline capability", status: "idle", progress: 0},
      {id: "agent_063", name: "Analytics Integration Specialist", phase: "frontend", specialization: "Tracking code and event management", status: "idle", progress: 0},
      {id: "agent_064", name: "Third-Party Integration Engineer", phase: "frontend", specialization: "External service integration", status: "idle", progress: 0},
      {id: "agent_065", name: "Build System Optimizer", phase: "frontend", specialization: "Webpack and build configuration", status: "idle", progress: 0},
      {id: "agent_066", name: "Code Splitting Specialist", phase: "frontend", specialization: "Dynamic imports and lazy loading", status: "idle", progress: 0},
      
      // Backend Phase (11 agents)
      {id: "agent_067", name: "API Architecture Designer", phase: "backend", specialization: "RESTful design and endpoint structure", status: "idle", progress: 0},
      {id: "agent_068", name: "Database Schema Engineer", phase: "backend", specialization: "Data modeling and relationships", status: "idle", progress: 0},
      {id: "agent_069", name: "Authentication Implementation Specialist", phase: "backend", specialization: "User management and security", status: "idle", progress: 0},
      {id: "agent_070", name: "Security Implementation Engineer", phase: "backend", specialization: "Data protection and validation", status: "idle", progress: 0},
      {id: "agent_071", name: "Performance Optimization Specialist", phase: "backend", specialization: "Query optimization and caching", status: "idle", progress: 0},
      {id: "agent_072", name: "Error Handling Engineer", phase: "backend", specialization: "Exception management and logging", status: "idle", progress: 0},
      {id: "agent_073", name: "API Documentation Specialist", phase: "backend", specialization: "OpenAPI and developer experience", status: "idle", progress: 0},
      {id: "agent_074", name: "Data Validation Engineer", phase: "backend", specialization: "Input sanitization and validation", status: "idle", progress: 0},
      {id: "agent_075", name: "File Upload Specialist", phase: "backend", specialization: "Media handling and storage", status: "idle", progress: 0},
      {id: "agent_076", name: "Email Integration Engineer", phase: "backend", specialization: "Notification and communication systems", status: "idle", progress: 0},
      {id: "agent_077", name: "Background Task Processor", phase: "backend", specialization: "Async job processing and queues", status: "idle", progress: 0},
      
      // Testing Phase (6 agents)
      {id: "agent_078", name: "Security Penetration Tester", phase: "testing", specialization: "Vulnerability assessment and protection", status: "idle", progress: 0},
      {id: "agent_079", name: "Performance Testing Specialist", phase: "testing", specialization: "Load testing and optimization", status: "idle", progress: 0},
      {id: "agent_080", name: "Cross-Browser Testing Engineer", phase: "testing", specialization: "Compatibility validation and fixes", status: "idle", progress: 0},
      {id: "agent_081", name: "Accessibility Testing Specialist", phase: "testing", specialization: "WCAG compliance verification", status: "idle", progress: 0},
      {id: "agent_082", name: "SEO Audit Specialist", phase: "testing", specialization: "Search optimization validation", status: "idle", progress: 0},
      {id: "agent_083", name: "Mobile Testing Engineer", phase: "testing", specialization: "Device compatibility and responsive testing", status: "idle", progress: 0},
      
      // Deployment Phase (5 agents)
      {id: "agent_084", name: "GitHub Repository Manager", phase: "deployment", specialization: "Version control and repository setup", status: "idle", progress: 0},
      {id: "agent_085", name: "CI/CD Pipeline Engineer", phase: "deployment", specialization: "Automated deployment and testing", status: "idle", progress: 0},
      {id: "agent_086", name: "Domain Configuration Specialist", phase: "deployment", specialization: "DNS and SSL setup", status: "idle", progress: 0},
      {id: "agent_087", name: "Performance Monitoring Setup Engineer", phase: "deployment", specialization: "Analytics and monitoring configuration", status: "idle", progress: 0},
      {id: "agent_088", name: "Production Optimization Specialist", phase: "deployment", specialization: "Live site optimization and maintenance", status: "idle", progress: 0}
    ];
    setAgents(agentsData);
  }, []);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
        setIsListening(false);
        toast.success('🎤 Voice input captured!', {
          description: transcript
        });
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice recognition failed');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info('🎤 Listening for voice input...', {
        description: 'Speak your website requirements clearly'
      });
    }
  };

  const generateWebsite = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a website description');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCurrentPhase('analysis');
    setPreviewHtml(null);
    setActiveAgents([]);
    
    // Reset all agents
    setAgents(prev => prev.map(agent => ({
      ...agent,
      status: 'idle',
      progress: 0
    })));
    
    try {
      const response = await fetch(`${API}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          business_type: businessType || null,
          target_audience: targetAudience || null,
          include_auth: includeAuth
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start generation');
      }

      const data = await response.json();
      setCurrentProject(data.project_id);
      
      // Connect to WebSocket for real-time updates
      connectWebSocket(data.project_id);
      
      toast.success('🚀 Website generation started!', {
        description: `88 AI agents activated! Project ID: ${data.project_id.slice(0, 8)}...`
      });
      
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to start website generation');
      setIsGenerating(false);
    }
  };

  const connectWebSocket = (projectId) => {
    const wsUrl = `${BACKEND_URL}/api/ws/${projectId}`.replace(/^http/, 'ws');
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('🔌 WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'agent_update':
          setAgents(prev => prev.map(agent => 
            agent.id === data.agent.id 
              ? { ...agent, status: data.status, progress: data.agent.progress || 0 }
              : agent
          ));
          if (data.status === 'active') {
            setActiveAgents(prev => [...new Set([...prev, data.agent.id])]);
          } else if (data.status === 'complete') {
            setActiveAgents(prev => prev.filter(id => id !== data.agent.id));
          }
          break;
          
        case 'phase_update':
          setCurrentPhase(data.phase);
          setProgress(data.progress);
          break;
          
        case 'preview_ready':
          setPreviewHtml(data.preview_html);
          toast.success('✨ Live preview ready!', {
            description: 'Your website is being generated in real-time'
          });
          break;
          
        case 'generation_complete':
          setIsGenerating(false);
          setProgress(100);
          setActiveAgents([]);
          setProjectStatus({
            github_repo: data.github_repo,
            deployment_url: data.deployment_url
          });
          toast.success('🎉 Website generation complete!', {
            description: 'Your amazing website is ready for download and deployment!'
          });
          break;
          
        case 'generation_error':
          setIsGenerating(false);
          setActiveAgents([]);
          toast.error('💥 Generation failed', {
            description: data.error
          });
          break;
      }
    };

    wsRef.current.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const downloadCode = async () => {
    if (!currentProject) return;
    
    try {
      const response = await fetch(`${API}/project/${currentProject}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowforge-${currentProject.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('📦 Code downloaded successfully!', {
        description: 'Your complete website package is ready'
      });
    } catch (error) {
      toast.error('Failed to download code');
    }
  };

  const phases = ['analysis', 'design', 'frontend', 'backend', 'testing', 'deployment'];
  const currentPhaseIndex = phases.indexOf(currentPhase);

  // Calculate phase completion stats
  const phaseStats = useMemo(() => {
    return phases.map(phase => {
      const phaseAgents = agents.filter(agent => agent.phase === phase);
      const completedCount = phaseAgents.filter(agent => agent.status === 'complete').length;
      return {
        phase,
        completed: completedCount,
        total: phaseAgents.length,
        percentage: Math.round((completedCount / phaseAgents.length) * 100)
      };
    });
  }, [agents, phases]);

  return (
    <div className={`min-h-screen relative transition-all duration-500 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 text-gray-900'
    }`}>
      {/* Crazy particle system background */}
      <ParticleSystem isActive={isGenerating} phase={currentPhase} />
      
      {/* Insane header with crazy effects */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/30 dark:border-gray-700/30 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float group-hover:animate-spin-slow">
                  <Zap className="text-white" size={32} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl animate-ping opacity-20"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full animate-pulse flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-text-shimmer">
                  FlowForge
                </h1>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  ⚡ 88 AI Specialists • Ultra-Fast Generator • Live Preview
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Sun size={20} className="text-gray-500" />
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
                />
                <Moon size={20} className="text-gray-500" />
              </div>
              
              <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 px-4 py-2 text-sm font-semibold">
                <Activity size={16} className="mr-2 animate-pulse" />
                v3.0.0 ULTRA
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Sidebar - Controls with INSANE styling */}
          <div className="xl:col-span-1 space-y-6">
            {/* Website Generator Card with crazy effects */}
            <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border-0 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-shift"></div>
              
              <CardHeader className="pb-4 relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                    <Code size={24} className="text-white" />
                  </div>
                  Website Generator
                </CardTitle>
                <CardDescription className="text-base">
                  Describe your vision and watch 88 AI agents create magic ✨
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 relative z-10">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Button
                      variant={isVoiceMode ? "default" : "outline"}
                      size="lg"
                      onClick={() => setIsVoiceMode(!isVoiceMode)}
                      className={`flex-1 transition-all duration-500 ${
                        isVoiceMode 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
                          : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950 dark:hover:to-purple-950'
                      }`}
                    >
                      <Mic size={18} className="mr-2" />
                      Voice Mode
                    </Button>
                    <Button
                      variant={isListening ? "destructive" : "outline"}
                      size="lg"
                      onClick={toggleVoiceInput}
                      disabled={!isVoiceMode || isGenerating}
                      className={`px-4 ${isListening ? 'animate-pulse' : ''}`}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </Button>
                  </div>
                  
                  <Textarea
                    placeholder="Describe your dream website... (e.g., 'Create a stunning portfolio for a creative agency with bold animations and immersive galleries')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-none text-base border-2 focus:border-blue-400 dark:focus:border-blue-600 transition-all duration-300"
                    disabled={isGenerating}
                  />
                  
                  <div className="grid grid-cols-1 gap-4">
                    <Select value={businessType} onValueChange={setBusinessType} disabled={isGenerating}>
                      <SelectTrigger className="border-2 focus:border-blue-400 dark:focus:border-blue-600 transition-all duration-300">
                        <SelectValue placeholder="🏢 Business Type (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saas">🚀 SaaS Platform</SelectItem>
                        <SelectItem value="ecommerce">🛍️ E-commerce</SelectItem>
                        <SelectItem value="portfolio">🎨 Portfolio</SelectItem>
                        <SelectItem value="blog">📝 Blog/News</SelectItem>
                        <SelectItem value="landing">📄 Landing Page</SelectItem>
                        <SelectItem value="corporate">🏢 Corporate</SelectItem>
                        <SelectItem value="creative">✨ Creative Agency</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder="🎯 Target Audience (Optional)"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      disabled={isGenerating}
                      className="border-2 focus:border-blue-400 dark:focus:border-blue-600 transition-all duration-300"
                    />
                    
                    <div className="flex items-center justify-between p-4 rounded-xl border-2 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">🔐 Include Authentication</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Add complete user management system</p>
                      </div>
                      <Switch
                        checked={includeAuth}
                        onCheckedChange={setIncludeAuth}
                        disabled={isGenerating}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={generateWebsite}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={24} className="mr-3 animate-spin" />
                        <span className="font-bold">⚡ AI Magic in Progress...</span>
                      </>
                    ) : (
                      <>
                        <Play size={24} className="mr-3" />
                        <span className="font-bold">🚀 Generate Website</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ultra Progress Card */}
            {isGenerating && (
              <Card className="bg-gradient-to-br from-white/90 to-blue-50/90 dark:from-gray-800/90 dark:to-blue-950/90 backdrop-blur-2xl border-0 shadow-2xl animate-float">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse">
                      <Activity size={24} className="text-white animate-spin" />
                    </div>
                    ⚡ Ultra Generation Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="capitalize font-bold text-lg">{currentPhase}</span>
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-4 bg-gray-200 dark:bg-gray-700">
                      <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-progress-glow transition-all duration-1000" />
                    </Progress>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900">
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{activeAgents.length}</p>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Active Agents</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
                      <p className="text-2xl font-black text-green-600 dark:text-green-400">
                        {agents.filter(a => a.status === 'complete').length}
                      </p>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Completed</p>
                    </div>
                  </div>
                  
                  {/* Phase Progress Pills */}
                  <div className="grid grid-cols-2 gap-2">
                    {phaseStats.map((stat, index) => (
                      <div
                        key={stat.phase}
                        className={`
                          text-center p-3 rounded-xl text-xs transition-all duration-500
                          ${index <= currentPhaseIndex
                            ? 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                          }
                          ${index === currentPhaseIndex ? 'ring-4 ring-blue-400/50 animate-pulse scale-105' : ''}
                        `}
                      >
                        <div className="capitalize font-bold">{stat.phase}</div>
                        <div className="text-xs mt-1">{stat.completed}/{stat.total}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Card with crazy styling */}
            {projectStatus && (
              <Card className="bg-gradient-to-br from-green-50/90 to-emerald-50/90 dark:from-green-900/50 dark:to-emerald-900/50 backdrop-blur-2xl border-0 shadow-2xl animate-bounce-in">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse">
                      <CheckCircle size={24} className="text-white" />
                    </div>
                    🎉 Website Ready!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={downloadCode}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
                    size="lg"
                  >
                    <Download size={20} className="mr-3" />
                    📦 Download Complete Code
                  </Button>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {projectStatus.github_repo && (
                      <Button
                        variant="outline"
                        className="w-full border-2 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800 dark:hover:to-blue-950 transition-all duration-300"
                        onClick={() => window.open(projectStatus.github_repo, '_blank')}
                      >
                        <Github size={18} className="mr-2" />
                        🔗 View GitHub Repository
                      </Button>
                    )}
                    
                    {projectStatus.deployment_url && (
                      <Button
                        variant="outline"
                        className="w-full border-2 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900 dark:hover:to-emerald-900 transition-all duration-300"
                        onClick={() => window.open(projectStatus.deployment_url, '_blank')}
                      >
                        <ExternalLink size={18} className="mr-2" />
                        🌐 View Live Website
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Preview Card */}
            <LivePreview 
              projectId={currentProject} 
              previewHtml={previewHtml} 
              isGenerating={isGenerating} 
            />
          </div>

          {/* Main Content - INSANE Agent Dashboard */}
          <div className="xl:col-span-2">
            <div className="space-y-8">
              {/* Crazy Header */}
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-text-shimmer">
                  AI Agent Orchestration
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  ⚡ 88 Specialized AI Agents Working in Perfect Harmony at Lightning Speed
                </p>
                
                <div className="flex items-center justify-center gap-6">
                  <Badge 
                    variant={isGenerating ? "default" : "secondary"} 
                    className={`${isGenerating ? 'animate-pulse bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg' : ''} px-6 py-3 text-lg`}
                  >
                    {isGenerating ? (
                      <>
                        <Zap size={20} className="mr-2 animate-spin" />
                        ⚡ ULTRA ACTIVE
                      </>
                    ) : (
                      <>
                        <Cpu size={20} className="mr-2" />
                        🔋 Ready for Action
                      </>
                    )}
                  </Badge>
                  
                  <div className="text-center">
                    <p className="text-3xl font-black text-gray-900 dark:text-gray-100">
                      {agents.filter(a => a.status === 'complete').length}/88
                    </p>
                    <p className="text-sm text-gray-500">Agents Complete</p>
                  </div>
                </div>
              </div>

              {/* Agent Phases with INSANE styling */}
              <div className="space-y-8">
                {phases.map(phase => {
                  const phaseAgents = agents.filter(agent => agent.phase === phase);
                  const completedCount = phaseAgents.filter(agent => agent.status === 'complete').length;
                  
                  return (
                    <PhaseSection
                      key={phase}
                      phase={phase}
                      agents={agents}
                      activeAgents={activeAgents}
                      currentPhase={currentPhase}
                      completedCount={completedCount}
                      totalCount={phaseAgents.length}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;