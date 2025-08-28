from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import json
import uuid
import base64
import zipfile
import io
import aiofiles
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import requests
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app and router
app = FastAPI(title="FlowForge API", version="2.1.0")
api_router = APIRouter(prefix="/api")

# AI Agent definitions - 88 specialized agents
AGENTS = [
    # Analysis Phase (22 agents)
    {"id": "agent_001", "name": "Business Model Analyzer", "phase": "analysis", "specialization": "Business strategy and revenue models", "duration": 2500},
    {"id": "agent_002", "name": "Target Audience Researcher", "phase": "analysis", "specialization": "User personas and demographics", "duration": 3000},
    {"id": "agent_003", "name": "Competitor Analysis Specialist", "phase": "analysis", "specialization": "Market positioning and competitive landscape", "duration": 2800},
    {"id": "agent_004", "name": "Brand Identity Extractor", "phase": "analysis", "specialization": "Brand voice and visual identity", "duration": 2200},
    {"id": "agent_005", "name": "Content Strategy Planner", "phase": "analysis", "specialization": "Content architecture and messaging", "duration": 2600},
    {"id": "agent_006", "name": "User Journey Mapper", "phase": "analysis", "specialization": "Customer experience pathways", "duration": 2400},
    {"id": "agent_007", "name": "Value Proposition Designer", "phase": "analysis", "specialization": "Core value and differentiation", "duration": 2300},
    {"id": "agent_008", "name": "Market Trends Analyst", "phase": "analysis", "specialization": "Industry trends and opportunities", "duration": 2700},
    {"id": "agent_009", "name": "Pain Point Identifier", "phase": "analysis", "specialization": "Customer problems and solutions", "duration": 2100},
    {"id": "agent_010", "name": "Feature Prioritizer", "phase": "analysis", "specialization": "Feature importance and roadmap", "duration": 2500},
    {"id": "agent_011", "name": "Conversion Goal Setter", "phase": "analysis", "specialization": "KPI definition and optimization", "duration": 2000},
    {"id": "agent_012", "name": "Technical Requirements Analyzer", "phase": "analysis", "specialization": "Platform and integration needs", "duration": 2800},
    {"id": "agent_013", "name": "SEO Strategy Consultant", "phase": "analysis", "specialization": "Search optimization planning", "duration": 2400},
    {"id": "agent_014", "name": "Mobile Strategy Planner", "phase": "analysis", "specialization": "Mobile-first considerations", "duration": 2200},
    {"id": "agent_015", "name": "Performance Requirements Analyst", "phase": "analysis", "specialization": "Speed and scalability needs", "duration": 2600},
    {"id": "agent_016", "name": "Security Assessment Specialist", "phase": "analysis", "specialization": "Security requirements and compliance", "duration": 2300},
    {"id": "agent_017", "name": "Analytics Requirements Planner", "phase": "analysis", "specialization": "Tracking and measurement setup", "duration": 2100},
    {"id": "agent_018", "name": "Accessibility Consultant", "phase": "analysis", "specialization": "WCAG compliance and inclusion", "duration": 2500},
    {"id": "agent_019", "name": "Integration Requirements Analyst", "phase": "analysis", "specialization": "Third-party service planning", "duration": 2700},
    {"id": "agent_020", "name": "Content Management Strategist", "phase": "analysis", "specialization": "CMS and content workflow needs", "duration": 2400},
    {"id": "agent_021", "name": "User Testing Planner", "phase": "analysis", "specialization": "Testing strategy and validation", "duration": 2200},
    {"id": "agent_022", "name": "Growth Strategy Consultant", "phase": "analysis", "specialization": "Scalability and expansion planning", "duration": 2800},

    # Design Phase (22 agents)
    {"id": "agent_023", "name": "Color Palette Generator", "phase": "design", "specialization": "Brand colors and psychology", "duration": 2000},
    {"id": "agent_024", "name": "Typography Curator", "phase": "design", "specialization": "Font selection and hierarchy", "duration": 1800},
    {"id": "agent_025", "name": "Layout Architect", "phase": "design", "specialization": "Grid systems and spatial design", "duration": 3000},
    {"id": "agent_026", "name": "UI Component Designer", "phase": "design", "specialization": "Interface elements and patterns", "duration": 2500},
    {"id": "agent_027", "name": "Brand Consistency Checker", "phase": "design", "specialization": "Visual identity alignment", "duration": 2200},
    {"id": "agent_028", "name": "Visual Hierarchy Specialist", "phase": "design", "specialization": "Information architecture design", "duration": 2400},
    {"id": "agent_029", "name": "Icon Library Curator", "phase": "design", "specialization": "Icon system and visual language", "duration": 1900},
    {"id": "agent_030", "name": "Responsive Design Engineer", "phase": "design", "specialization": "Multi-device layout adaptation", "duration": 3200},
    {"id": "agent_031", "name": "Animation Director", "phase": "design", "specialization": "Micro-interactions and motion", "duration": 2600},
    {"id": "agent_032", "name": "Image Style Coordinator", "phase": "design", "specialization": "Photography and imagery curation", "duration": 2300},
    {"id": "agent_033", "name": "Whitespace Optimizer", "phase": "design", "specialization": "Spacing and breathing room", "duration": 2100},
    {"id": "agent_034", "name": "Visual Flow Designer", "phase": "design", "specialization": "User journey visualization", "duration": 2700},
    {"id": "agent_035", "name": "Accessibility Design Consultant", "phase": "design", "specialization": "Inclusive design patterns", "duration": 2400},
    {"id": "agent_036", "name": "Mobile UI Specialist", "phase": "design", "specialization": "Touch-first interface design", "duration": 2800},
    {"id": "agent_037", "name": "Dark Mode Designer", "phase": "design", "specialization": "Theme variations and adaptability", "duration": 2200},
    {"id": "agent_038", "name": "Loading State Designer", "phase": "design", "specialization": "Progressive enhancement visuals", "duration": 2000},
    {"id": "agent_039", "name": "Error State Designer", "phase": "design", "specialization": "Error handling and messaging", "duration": 1800},
    {"id": "agent_040", "name": "Form Design Specialist", "phase": "design", "specialization": "Input patterns and validation", "duration": 2500},
    {"id": "agent_041", "name": "Navigation Designer", "phase": "design", "specialization": "Menu systems and wayfinding", "duration": 2600},
    {"id": "agent_042", "name": "CTA Optimization Expert", "phase": "design", "specialization": "Call-to-action design and placement", "duration": 2300},
    {"id": "agent_043", "name": "Visual Storytelling Designer", "phase": "design", "specialization": "Narrative flow and engagement", "duration": 2400},
    {"id": "agent_044", "name": "Brand Asset Creator", "phase": "design", "specialization": "Logo adaptation and brand elements", "duration": 2700},

    # Frontend Development Phase (22 agents)
    {"id": "agent_045", "name": "React Component Architect", "phase": "frontend", "specialization": "Component structure and patterns", "duration": 3500},
    {"id": "agent_046", "name": "CSS Framework Engineer", "phase": "frontend", "specialization": "Styling architecture and optimization", "duration": 3200},
    {"id": "agent_047", "name": "Animation Implementation Specialist", "phase": "frontend", "specialization": "CSS and JavaScript animations", "duration": 2800},
    {"id": "agent_048", "name": "Responsive Code Engineer", "phase": "frontend", "specialization": "Breakpoint management and flexibility", "duration": 3000},
    {"id": "agent_049", "name": "Performance Optimization Expert", "phase": "frontend", "specialization": "Bundle size and load time optimization", "duration": 3300},
    {"id": "agent_050", "name": "Accessibility Implementation Engineer", "phase": "frontend", "specialization": "ARIA patterns and keyboard navigation", "duration": 2900},
    {"id": "agent_051", "name": "SEO Implementation Specialist", "phase": "frontend", "specialization": "Meta tags and structured data", "duration": 2400},
    {"id": "agent_052", "name": "Form Validation Engineer", "phase": "frontend", "specialization": "Client-side validation and UX", "duration": 2600},
    {"id": "agent_053", "name": "State Management Architect", "phase": "frontend", "specialization": "Application state and data flow", "duration": 3400},
    {"id": "agent_054", "name": "API Integration Specialist", "phase": "frontend", "specialization": "Backend communication and error handling", "duration": 3100},
    {"id": "agent_055", "name": "Routing Implementation Engineer", "phase": "frontend", "specialization": "Navigation and URL management", "duration": 2500},
    {"id": "agent_056", "name": "Image Optimization Specialist", "phase": "frontend", "specialization": "Asset loading and compression", "duration": 2300},
    {"id": "agent_057", "name": "Progressive Enhancement Engineer", "phase": "frontend", "specialization": "Graceful degradation and fallbacks", "duration": 2700},
    {"id": "agent_058", "name": "Cross-Browser Compatibility Specialist", "phase": "frontend", "specialization": "Browser testing and polyfills", "duration": 2800},
    {"id": "agent_059", "name": "Security Implementation Engineer", "phase": "frontend", "specialization": "XSS prevention and secure patterns", "duration": 2900},
    {"id": "agent_060", "name": "Error Boundary Engineer", "phase": "frontend", "specialization": "Error handling and recovery", "duration": 2400},
    {"id": "agent_061", "name": "Testing Implementation Specialist", "phase": "frontend", "specialization": "Unit and integration testing", "duration": 3000},
    {"id": "agent_062", "name": "PWA Implementation Engineer", "phase": "frontend", "specialization": "Service workers and offline capability", "duration": 3200},
    {"id": "agent_063", "name": "Analytics Integration Specialist", "phase": "frontend", "specialization": "Tracking code and event management", "duration": 2500},
    {"id": "agent_064", "name": "Third-Party Integration Engineer", "phase": "frontend", "specialization": "External service integration", "duration": 2800},
    {"id": "agent_065", "name": "Build System Optimizer", "phase": "frontend", "specialization": "Webpack and build configuration", "duration": 2600},
    {"id": "agent_066", "name": "Code Splitting Specialist", "phase": "frontend", "specialization": "Dynamic imports and lazy loading", "duration": 2700},

    # Backend Development Phase (11 agents)
    {"id": "agent_067", "name": "API Architecture Designer", "phase": "backend", "specialization": "RESTful design and endpoint structure", "duration": 3000},
    {"id": "agent_068", "name": "Database Schema Engineer", "phase": "backend", "specialization": "Data modeling and relationships", "duration": 3200},
    {"id": "agent_069", "name": "Authentication Implementation Specialist", "phase": "backend", "specialization": "User management and security", "duration": 3500},
    {"id": "agent_070", "name": "Security Implementation Engineer", "phase": "backend", "specialization": "Data protection and validation", "duration": 3300},
    {"id": "agent_071", "name": "Performance Optimization Specialist", "phase": "backend", "specialization": "Query optimization and caching", "duration": 3100},
    {"id": "agent_072", "name": "Error Handling Engineer", "phase": "backend", "specialization": "Exception management and logging", "duration": 2800},
    {"id": "agent_073", "name": "API Documentation Specialist", "phase": "backend", "specialization": "OpenAPI and developer experience", "duration": 2400},
    {"id": "agent_074", "name": "Data Validation Engineer", "phase": "backend", "specialization": "Input sanitization and validation", "duration": 2600},
    {"id": "agent_075", "name": "File Upload Specialist", "phase": "backend", "specialization": "Media handling and storage", "duration": 2900},
    {"id": "agent_076", "name": "Email Integration Engineer", "phase": "backend", "specialization": "Notification and communication systems", "duration": 2700},
    {"id": "agent_077", "name": "Background Task Processor", "phase": "backend", "specialization": "Async job processing and queues", "duration": 3000},

    # Testing & Quality Assurance Phase (6 agents)
    {"id": "agent_078", "name": "Security Penetration Tester", "phase": "testing", "specialization": "Vulnerability assessment and protection", "duration": 3500},
    {"id": "agent_079", "name": "Performance Testing Specialist", "phase": "testing", "specialization": "Load testing and optimization", "duration": 3200},
    {"id": "agent_080", "name": "Cross-Browser Testing Engineer", "phase": "testing", "specialization": "Compatibility validation and fixes", "duration": 2800},
    {"id": "agent_081", "name": "Accessibility Testing Specialist", "phase": "testing", "specialization": "WCAG compliance verification", "duration": 2600},
    {"id": "agent_082", "name": "SEO Audit Specialist", "phase": "testing", "specialization": "Search optimization validation", "duration": 2400},
    {"id": "agent_083", "name": "Mobile Testing Engineer", "phase": "testing", "specialization": "Device compatibility and responsive testing", "duration": 3000},

    # Deployment & Operations Phase (5 agents)
    {"id": "agent_084", "name": "GitHub Repository Manager", "phase": "deployment", "specialization": "Version control and repository setup", "duration": 2200},
    {"id": "agent_085", "name": "CI/CD Pipeline Engineer", "phase": "deployment", "specialization": "Automated deployment and testing", "duration": 3000},
    {"id": "agent_086", "name": "Domain Configuration Specialist", "phase": "deployment", "specialization": "DNS and SSL setup", "duration": 2500},
    {"id": "agent_087", "name": "Performance Monitoring Setup Engineer", "phase": "deployment", "specialization": "Analytics and monitoring configuration", "duration": 2800},
    {"id": "agent_088", "name": "Production Optimization Specialist", "phase": "deployment", "specialization": "Live site optimization and maintenance", "duration": 3200}
]

# Pydantic models
class GenerateWebsiteRequest(BaseModel):
    prompt: str
    business_type: Optional[str] = None
    target_audience: Optional[str] = None
    style_preferences: Optional[Dict[str, Any]] = None
    include_auth: Optional[bool] = False

class AgentStatus(BaseModel):
    id: str
    name: str
    phase: str
    status: str = "idle"  # idle, active, complete, error
    progress: int = 0
    task: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class ProjectStatus(BaseModel):
    project_id: str
    status: str  # generating, ready, deployed, error
    progress: int = 0
    current_phase: str = "initializing"
    agents: List[AgentStatus] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    generated_files: Optional[Dict[str, str]] = None
    deployment_url: Optional[str] = None
    github_repo: Optional[str] = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, project_id: str):
        await websocket.accept()
        self.active_connections[project_id] = websocket

    def disconnect(self, project_id: str):
        if project_id in self.active_connections:
            del self.active_connections[project_id]

    async def send_update(self, project_id: str, data: dict):
        if project_id in self.active_connections:
            try:
                await self.active_connections[project_id].send_text(json.dumps(data))
            except:
                self.disconnect(project_id)

manager = ConnectionManager()

# AI Chat initialization
def get_ai_chat(session_id: str, system_message: str):
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system_message
    ).with_model("gemini", "gemini-2.0-flash")
    return chat

# Website generation functions
async def run_agent_phase(project_id: str, phase: str, prompt: str, project_data: dict):
    """Run a specific phase of agents"""
    phase_agents = [agent for agent in AGENTS if agent["phase"] == phase]
    
    for agent in phase_agents:
        # Update agent status to active
        await db.projects.update_one(
            {"project_id": project_id},
            {
                "$set": {
                    f"agents.{agent['id']}.status": "active",
                    f"agents.{agent['id']}.started_at": datetime.now(timezone.utc),
                    f"agents.{agent['id']}.task": f"Processing {phase} requirements"
                }
            }
        )
        
        # Send WebSocket update
        await manager.send_update(project_id, {
            "type": "agent_update",
            "agent": agent,
            "status": "active"
        })
        
        # Simulate agent work with AI processing
        await asyncio.sleep(1)  # Brief delay for visualization
        
        # Get AI response for this agent's specialization
        try:
            system_message = f"You are {agent['name']}, a specialist in {agent['specialization']}. Provide specific insights and recommendations for the given project."
            chat = get_ai_chat(f"{project_id}_{agent['id']}", system_message)
            
            user_message = UserMessage(
                text=f"Project: {prompt}\nProvide your specialized analysis and recommendations as {agent['name']}."
            )
            
            ai_response = await chat.send_message(user_message)
            
            # Store agent output
            await db.agent_outputs.insert_one({
                "project_id": project_id,
                "agent_id": agent["id"],
                "phase": phase,
                "output": ai_response,
                "timestamp": datetime.now(timezone.utc)
            })
            
        except Exception as e:
            logging.error(f"AI processing error for agent {agent['id']}: {e}")
        
        # Update agent status to complete
        await db.projects.update_one(
            {"project_id": project_id},
            {
                "$set": {
                    f"agents.{agent['id']}.status": "complete",
                    f"agents.{agent['id']}.completed_at": datetime.now(timezone.utc),
                    f"agents.{agent['id']}.progress": 100
                }
            }
        )
        
        # Send completion update
        await manager.send_update(project_id, {
            "type": "agent_update",
            "agent": agent,
            "status": "complete"
        })

async def generate_website_files(project_id: str, prompt: str, project_data: dict):
    """Generate the actual website files using AI"""
    try:
        # Get consolidated agent insights
        agent_outputs = await db.agent_outputs.find({"project_id": project_id}).to_list(None)
        
        # Create comprehensive context from all agent outputs
        context = f"Project Requirements: {prompt}\n\n"
        for output in agent_outputs:
            context += f"{output.get('output', '')}\n"
        
        # Generate HTML
        html_chat = get_ai_chat(f"{project_id}_html", "You are an expert web developer. Generate modern, responsive HTML with proper structure, accessibility, and SEO optimization.")
        html_message = UserMessage(
            text=f"Based on this comprehensive analysis: {context}\n\nGenerate a complete, modern HTML document for this website. Include proper meta tags, structured data, and accessibility features. Make it production-ready."
        )
        html_content = await html_chat.send_message(html_message)
        
        # Generate CSS
        css_chat = get_ai_chat(f"{project_id}_css", "You are a CSS expert specializing in modern, responsive design with beautiful aesthetics and smooth animations.")
        css_message = UserMessage(
            text=f"Based on this analysis: {context}\n\nGenerate modern CSS with:\n- Responsive design\n- Beautiful animations and transitions\n- CSS Grid and Flexbox\n- Custom properties for theming\n- Modern color schemes\n- Professional typography\n- Smooth hover effects"
        )
        css_content = await css_chat.send_message(css_message)
        
        # Generate JavaScript
        js_chat = get_ai_chat(f"{project_id}_js", "You are a JavaScript expert creating interactive, accessible web experiences with modern ES6+ features.")
        js_message = UserMessage(
            text=f"Based on this analysis: {context}\n\nGenerate modern JavaScript for:\n- Interactive elements\n- Form validation\n- Smooth animations\n- Mobile navigation\n- Accessibility enhancements\n- Performance optimization"
        )
        js_content = await js_chat.send_message(js_message)
        
        # Generate additional files if authentication is requested
        files = {
            "index.html": html_content,
            "styles.css": css_content,
            "script.js": js_content,
            "README.md": f"""# {project_data.get('title', 'Generated Website')}

## Project Overview
This website was generated by FlowForge using 88 specialized AI agents.

## Features
- Responsive design
- Modern CSS with animations
- Interactive JavaScript
- SEO optimized
- Accessibility compliant

## Generated on
{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC

## Deployment
This website is ready for deployment to any static hosting service.
"""
        }
        
        # If authentication requested, add backend files
        if project_data.get('include_auth'):
            # Generate backend files
            backend_chat = get_ai_chat(f"{project_id}_backend", "You are a backend expert creating secure, scalable APIs with authentication.")
            backend_message = UserMessage(
                text=f"Generate a complete FastAPI backend with authentication, user management, and database models for: {context}"
            )
            backend_content = await backend_chat.send_message(backend_message)
            
            files.update({
                "backend/server.py": backend_content,
                "backend/requirements.txt": """fastapi==0.110.1
uvicorn==0.25.0
python-dotenv>=1.0.1
pymongo==4.5.0
pydantic>=2.6.4
pyjwt>=2.10.1
passlib>=1.7.4
motor==3.3.1
python-multipart>=0.0.9
""",
                "backend/.env.example": """MONGO_URL=mongodb://localhost:27017
DB_NAME=your_database
JWT_SECRET=your-secret-key
CORS_ORIGINS=*
"""
            })
        
        return files
        
    except Exception as e:
        logging.error(f"Error generating website files: {e}")
        raise e

async def deploy_to_github(project_id: str, files: Dict[str, str], project_data: dict):
    """Deploy generated website to GitHub"""
    try:
        github_token = os.environ.get('GITHUB_TOKEN')
        if not github_token:
            raise Exception("GitHub token not configured")
        
        repo_name = f"flowforge-{project_id[:8]}"
        
        # Create repository
        headers = {
            'Authorization': f'token {github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        repo_data = {
            'name': repo_name,
            'description': f"Website generated by FlowForge - {project_data.get('title', 'AI Generated Website')}",
            'private': False,
            'auto_init': True
        }
        
        repo_response = requests.post(
            'https://api.github.com/user/repos',
            json=repo_data,
            headers=headers
        )
        
        if repo_response.status_code == 201:
            repo_info = repo_response.json()
            repo_url = repo_info['html_url']
            
            # Upload files
            for file_path, content in files.items():
                file_data = {
                    'message': f'Add {file_path}',
                    'content': base64.b64encode(content.encode()).decode()
                }
                
                file_response = requests.put(
                    f"https://api.github.com/repos/{repo_info['full_name']}/contents/{file_path}",
                    json=file_data,
                    headers=headers
                )
                
                if file_response.status_code not in [200, 201]:
                    logging.error(f"Failed to upload {file_path}: {file_response.text}")
            
            # Enable GitHub Pages
            pages_data = {
                'source': {
                    'branch': 'main',
                    'path': '/'
                }
            }
            
            pages_response = requests.post(
                f"https://api.github.com/repos/{repo_info['full_name']}/pages",
                json=pages_data,
                headers=headers
            )
            
            github_pages_url = f"https://{repo_info['owner']['login']}.github.io/{repo_name}"
            
            return {
                'github_repo': repo_url,
                'deployment_url': github_pages_url,
                'status': 'deployed'
            }
        else:
            raise Exception(f"Failed to create GitHub repository: {repo_response.text}")
            
    except Exception as e:
        logging.error(f"GitHub deployment error: {e}")
        raise e

# API Routes
@api_router.post("/generate")
async def generate_website(request: GenerateWebsiteRequest, background_tasks: BackgroundTasks):
    """Start website generation process"""
    project_id = str(uuid.uuid4())
    
    # Initialize project in database
    project_data = {
        "project_id": project_id,
        "prompt": request.prompt,
        "business_type": request.business_type,
        "target_audience": request.target_audience,
        "include_auth": request.include_auth,
        "status": "generating",
        "progress": 0,
        "current_phase": "analysis",
        "agents": {agent["id"]: {
            "id": agent["id"],
            "name": agent["name"],
            "phase": agent["phase"],
            "status": "idle",
            "progress": 0
        } for agent in AGENTS},
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.projects.insert_one(project_data)
    
    # Start background generation
    background_tasks.add_task(generate_website_background, project_id, request.prompt, project_data)
    
    return {"project_id": project_id, "status": "generating"}

async def generate_website_background(project_id: str, prompt: str, project_data: dict):
    """Background task for website generation"""
    try:
        phases = ["analysis", "design", "frontend", "backend", "testing", "deployment"]
        
        for i, phase in enumerate(phases):
            # Update current phase
            await db.projects.update_one(
                {"project_id": project_id},
                {
                    "$set": {
                        "current_phase": phase,
                        "progress": int((i / len(phases)) * 80)  # 80% for agent work
                    }
                }
            )
            
            # Send phase update
            await manager.send_update(project_id, {
                "type": "phase_update",
                "phase": phase,
                "progress": int((i / len(phases)) * 80)
            })
            
            # Run agents for this phase
            await run_agent_phase(project_id, phase, prompt, project_data)
        
        # Generate website files (remaining 15%)
        await db.projects.update_one(
            {"project_id": project_id},
            {"$set": {"current_phase": "generating_files", "progress": 85}}
        )
        
        files = await generate_website_files(project_id, prompt, project_data)
        
        # Deploy to GitHub (final 15%)
        await db.projects.update_one(
            {"project_id": project_id},
            {"$set": {"current_phase": "deploying", "progress": 95}}
        )
        
        deployment_result = await deploy_to_github(project_id, files, project_data)
        
        # Mark as complete
        await db.projects.update_one(
            {"project_id": project_id},
            {
                "$set": {
                    "status": "ready",
                    "progress": 100,
                    "current_phase": "complete",
                    "generated_files": files,
                    "github_repo": deployment_result["github_repo"],
                    "deployment_url": deployment_result["deployment_url"],
                    "completed_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # Send completion update
        await manager.send_update(project_id, {
            "type": "generation_complete",
            "github_repo": deployment_result["github_repo"],
            "deployment_url": deployment_result["deployment_url"]
        })
        
    except Exception as e:
        logging.error(f"Background generation error: {e}")
        await db.projects.update_one(
            {"project_id": project_id},
            {
                "$set": {
                    "status": "error",
                    "error": str(e),
                    "completed_at": datetime.now(timezone.utc)
                }
            }
        )
        
        await manager.send_update(project_id, {
            "type": "generation_error",
            "error": str(e)
        })

@api_router.get("/project/{project_id}")
async def get_project_status(project_id: str):
    """Get project status and progress"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project

@api_router.get("/project/{project_id}/download")
async def download_project_code(project_id: str):
    """Download project code as ZIP file"""
    project = await db.projects.find_one({"project_id": project_id})
    if not project or not project.get("generated_files"):
        raise HTTPException(status_code=404, detail="Project not found or not ready")
    
    # Create ZIP file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for file_path, content in project["generated_files"].items():
            zip_file.writestr(file_path, content)
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(zip_buffer.read()),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=flowforge-{project_id[:8]}.zip"}
    )

@api_router.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket, project_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(project_id)

@api_router.get("/")
async def root():
    return {"message": "FlowForge API v2.1.0 - 88 AI Agents at your service!"}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()