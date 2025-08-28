import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle, Loader2, Eye, Copy
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
  analysis: 'from-blue-500 to-cyan-500',
  design: 'from-purple-500 to-pink-500',
  frontend: 'from-green-500 to-emerald-500',
  backend: 'from-orange-500 to-red-500',
  testing: 'from-yellow-500 to-orange-500',
  deployment: 'from-indigo-500 to-purple-500'
};

const AgentCard = ({ agent, isActive, progress }) => {
  const Icon = PHASE_ICONS[agent.phase] || Activity;
  
  return (
    <div className={`
      agent-card relative p-4 rounded-xl border transition-all duration-500
      ${isActive ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-300 dark:border-blue-700 shadow-lg scale-105' : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:shadow-md'}
      backdrop-blur-sm
    `}>
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-xl animate-pulse"></div>
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className={`
            p-2 rounded-lg 
            ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
          `}>
            <Icon size={16} />
          </div>
          <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "animate-pulse" : ""}>
            {agent.status}
          </Badge>
        </div>
        
        <h4 className="font-medium text-sm mb-1 text-gray-900 dark:text-gray-100">
          {agent.name}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
          {agent.specialization}
        </p>
        
        {isActive && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <Activity size={12} className="animate-spin" />
              Processing...
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
};

const PhaseSection = ({ phase, agents, activeAgents, currentPhase }) => {
  const Icon = PHASE_ICONS[phase];
  const isCurrentPhase = currentPhase === phase;
  const phaseAgents = agents.filter(agent => agent.phase === phase);
  const completedCount = phaseAgents.filter(agent => agent.status === 'complete').length;
  
  return (
    <div className={`
      phase-section p-6 rounded-2xl border transition-all duration-700
      ${isCurrentPhase ? 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-950/30 border-blue-300 dark:border-blue-700 shadow-xl' : 'bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'}
      backdrop-blur-sm
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            p-3 rounded-xl bg-gradient-to-r ${PHASE_COLORS[phase]}
            ${isCurrentPhase ? 'shadow-lg animate-pulse' : ''}
          `}>
            <Icon className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg capitalize text-gray-900 dark:text-gray-100">
              {phase} Phase
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {completedCount}/{phaseAgents.length} agents completed
            </p>
          </div>
        </div>
        
        {isCurrentPhase && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-medium">Active</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {phaseAgents.map(agent => (
          <AgentCard 
            key={agent.id}
            agent={agent}
            isActive={activeAgents.includes(agent.id)}
            progress={agent.progress || 0}
          />
        ))}
      </div>
    </div>
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
        toast.success('Voice input captured!', {
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
      toast.info('Listening for voice input...');
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
      
      toast.success('Website generation started!', {
        description: `Project ID: ${data.project_id}`
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
      console.log('WebSocket connected');
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
            setActiveAgents(prev => [...prev, data.agent.id]);
          } else if (data.status === 'complete') {
            setActiveAgents(prev => prev.filter(id => id !== data.agent.id));
          }
          break;
          
        case 'phase_update':
          setCurrentPhase(data.phase);
          setProgress(data.progress);
          break;
          
        case 'generation_complete':
          setIsGenerating(false);
          setProgress(100);
          setProjectStatus({
            github_repo: data.github_repo,
            deployment_url: data.deployment_url
          });
          toast.success('Website generation complete!', {
            description: 'Your website is ready for download and deployment.'
          });
          break;
          
        case 'generation_error':
          setIsGenerating(false);
          toast.error('Generation failed', {
            description: data.error
          });
          break;
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
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
      
      toast.success('Code downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download code');
    }
  };

  const phases = ['analysis', 'design', 'frontend', 'backend', 'testing', 'deployment'];
  const currentPhaseIndex = phases.indexOf(currentPhase);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="text-white" size={24} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  FlowForge
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  88 AI Specialists • Website Generator
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sun size={16} className="text-gray-500" />
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Moon size={16} className="text-gray-500" />
              </div>
              
              <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                <Activity size={12} className="mr-1" />
                v2.1.0
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Sidebar - Controls */}
          <div className="xl:col-span-1 space-y-6">
            {/* Website Generator Card */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Code size={20} className="text-blue-600" />
                  Website Generator
                </CardTitle>
                <CardDescription>
                  Describe your website and let 88 AI agents build it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant={isVoiceMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsVoiceMode(!isVoiceMode)}
                      className="flex-1"
                    >
                      <Mic size={16} className="mr-1" />
                      Voice
                    </Button>
                    <Button
                      variant={isListening ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleVoiceInput}
                      disabled={!isVoiceMode}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </Button>
                  </div>
                  
                  <Textarea
                    placeholder="Describe your website... (e.g., 'Create a modern SaaS landing page for a project management tool')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] resize-none"
                    disabled={isGenerating}
                  />
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Select value={businessType} onValueChange={setBusinessType} disabled={isGenerating}>
                      <SelectTrigger>
                        <SelectValue placeholder="Business Type (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saas">SaaS Platform</SelectItem>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="portfolio">Portfolio</SelectItem>
                        <SelectItem value="blog">Blog/News</SelectItem>
                        <SelectItem value="landing">Landing Page</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder="Target Audience (Optional)"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      disabled={isGenerating}
                    />
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Include Authentication</p>
                        <p className="text-xs text-gray-500">Add user login/signup system</p>
                      </div>
                      <Switch
                        checked={includeAuth}
                        onCheckedChange={setIncludeAuth}
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={generateWebsite}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={20} className="mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play size={20} className="mr-2" />
                        Generate Website
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Card */}
            {isGenerating && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Activity size={20} className="text-green-600" />
                    Generation Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{currentPhase}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Active Agents: {activeAgents.length}</p>
                    <p className="text-xs text-gray-500">
                      Time Elapsed: {isGenerating ? '⏱️' : '✅'} Processing...
                    </p>
                  </div>
                  
                  {/* Phase Progress */}
                  <div className="grid grid-cols-3 gap-2">
                    {phases.map((phase, index) => (
                      <div
                        key={phase}
                        className={`
                          text-center p-2 rounded-lg text-xs transition-all
                          ${index <= currentPhaseIndex
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                          }
                          ${index === currentPhaseIndex ? 'ring-2 ring-blue-400 animate-pulse' : ''}
                        `}
                      >
                        <div className="capitalize font-medium">{phase}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Card */}
            {projectStatus && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    Website Ready!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={downloadCode}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Download size={16} className="mr-2" />
                    Download Code
                  </Button>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {projectStatus.github_repo && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(projectStatus.github_repo, '_blank')}
                      >
                        <Github size={16} className="mr-2" />
                        View Repository
                      </Button>
                    )}
                    
                    {projectStatus.deployment_url && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(projectStatus.deployment_url, '_blank')}
                      >
                        <ExternalLink size={16} className="mr-2" />
                        View Live Site
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content - Agent Dashboard */}
          <div className="xl:col-span-3">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">AI Agent Orchestration</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    88 Specialized AI Agents Working in Perfect Harmony
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={isGenerating ? "default" : "secondary"} 
                    className={`${isGenerating ? 'animate-pulse bg-green-600' : ''} px-4 py-2`}
                  >
                    {isGenerating ? (
                      <>
                        <Activity size={16} className="mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <Cpu size={16} className="mr-1" />
                        Idle
                      </>
                    )}
                  </Badge>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium">{agents.filter(a => a.status === 'complete').length}/88</p>
                    <p className="text-xs text-gray-500">Agents Complete</p>
                  </div>
                </div>
              </div>

              {/* Agent Phases */}
              <div className="space-y-6">
                {phases.map(phase => (
                  <PhaseSection
                    key={phase}
                    phase={phase}
                    agents={agents}
                    activeAgents={activeAgents}
                    currentPhase={currentPhase}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;