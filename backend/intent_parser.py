import os
import json
import logging
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
# the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai = OpenAI(api_key=OPENAI_API_KEY)

def parse_user_prompt(prompt):
    """
    Parse the user's natural language prompt into structured fields using OpenAI.
    
    Args:
        prompt (str): The user's natural language prompt
        
    Returns:
        dict: Structured fields extracted from the prompt
    """
    logger.debug(f"Parsing user prompt: {prompt}")
    
    system_message = """
    You are an expert financial analyst and trading strategy specialist.
    Parse the user's natural language prompt about a trading strategy into structured fields.
    Respond with a JSON object containing these fields:
    - goal: The main investment goal (e.g., growth, income, value)
    - risk_level: Quantified from 1-10 (1 being very low risk, 10 being extremely high risk)
    - time_horizon: Short-term, medium-term, or long-term
    - style: Trading style (e.g., momentum, trend-following, contrarian, etc.)
    - special_instructions: Any specific requirements or constraints
    - summary: A concise summary of the user's intent in 1-2 sentences
    
    Do not fabricate or assume information that isn't present or implied in the user's prompt.
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        parsed_intent = json.loads(response.choices[0].message.content)
        logger.debug(f"Parsed intent: {parsed_intent}")
        
        return parsed_intent
        
    except Exception as e:
        logger.error(f"Error parsing user prompt: {str(e)}")
        raise Exception(f"Failed to parse user prompt: {str(e)}")
