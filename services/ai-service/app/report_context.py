# ai-service/app/report_context.py
from typing import Dict, Optional
from datetime import datetime, timedelta
import uuid

# In-memory storage for active analyses
# Key: analysis_id (UUID)
# Value: {user_id, report_text, analysis, summary, created_at}
active_analyses: Dict[str, Dict] = {}

# In-memory storage for active chat sessions
# Key: user_id
# Value: analysis_id (which analysis they're currently chatting about)
active_sessions: Dict[int, str] = {}

def create_analysis(user_id: int, report_text: str, analysis: str, summary: str, filename: str = None) -> str:
    """
    Store a new analysis and return its ID
    """
    analysis_id = str(uuid.uuid4())
    
    active_analyses[analysis_id] = {
        "user_id": user_id,
        "filename": filename,
        "report_text": report_text,
        "analysis": analysis,
        "summary": summary,
        "created_at": datetime.utcnow().isoformat(),
        "expires": (datetime.utcnow() + timedelta(hours=24)).isoformat()  # Auto-expire after 24 hours
    }
    
    print(f"✅ Analysis stored with ID: {analysis_id} for user {user_id}")
    return analysis_id

def get_analysis(analysis_id: str) -> Optional[Dict]:
    """
    Get analysis by ID
    """
    analysis = active_analyses.get(analysis_id)
    
    if analysis:
        # Check if expired
        expires = datetime.fromisoformat(analysis["expires"])
        if datetime.utcnow() > expires:
            del active_analyses[analysis_id]
            return None
    
    return analysis

def set_active_analysis(user_id: int, analysis_id: str):
    """
    Set which analysis user is currently chatting about
    """
    active_sessions[user_id] = analysis_id
    print(f"✅ Active session set for user {user_id} -> analysis {analysis_id}")

def get_active_analysis(user_id: int) -> Optional[Dict]:
    """
    Get the active analysis for a user
    """
    analysis_id = active_sessions.get(user_id)
    if analysis_id:
        return get_analysis(analysis_id)
    return None

def clear_session(user_id: int):
    """
    Clear user's active session
    """
    if user_id in active_sessions:
        del active_sessions[user_id]
        print(f"🗑️ Session cleared for user {user_id}")

def get_user_analyses(user_id: int) -> list:
    """
    Get all analyses for a user (for history display)
    """
    user_analyses = []
    for analysis_id, analysis in active_analyses.items():
        if analysis["user_id"] == user_id:
            user_analyses.append({
                "id": analysis_id,
                "filename": analysis.get("filename", f"Analysis"),
                "summary": analysis["summary"],
                "created_at": analysis["created_at"]
            })
    
    # Sort by created_at (newest first)
    user_analyses.sort(key=lambda x: x["created_at"], reverse=True)
    return user_analyses