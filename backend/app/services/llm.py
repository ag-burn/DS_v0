import google.generativeai as genai
from google.generativeai.types import GenerationConfig
import json
from pathlib import Path
from typing import Dict, List
from PIL import Image
from io import BytesIO
import base64

from ..schemas import VerificationResult
from ..config import get_settings

class LLMService:
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.LLM_API_KEY
        self.model = settings.LLM_MODEL
        genai.configure(api_key=self.api_key)
        
        # Load prompt templates
        prompts_dir = Path(__file__).parent.parent / "config" / "prompts"
        with open(prompts_dir / "system.txt") as f:
            self.system_prompt = f.read()
        with open(prompts_dir / "user_template.md") as f:
            self.user_template = f.read()

    async def verify_session(
        self,
        session_id: str,
        images: Dict[str, Path],
        transcript: str,
        expected_phrase: str,
        timings: Dict
    ) -> VerificationResult:
        # Prepare the images
        image_parts = []
        for kind, path in images.items():
            with open(path, "rb") as f:
                content = f.read()
                image = Image.open(BytesIO(content))
                image_parts.append(image)

        # Format the user prompt with context
        user_prompt = self.user_template.format(
            session_id=session_id,
            transcript=transcript,
            expected_phrase=expected_phrase,
            timings=json.dumps(timings, indent=2)
        )

        # Construct the full prompt
        prompt_parts = [self.system_prompt, user_prompt, *image_parts]

        # Make API call
        model = genai.GenerativeModel(self.model)
        generation_config = GenerationConfig(
            max_output_tokens=1000,
            temperature=0.1,
        )
        response = await model.generate_content_async(
            prompt_parts,
            generation_config=generation_config
        )
        
        # The response text may be enclosed in ```json ... ```, so we need to extract it.
        response_text = response.text
        if response_text.strip().startswith("```json"):
            response_text = response_text.strip()[7:-3]

        # Parse LLM response
        verification_data = json.loads(response_text)
        
        # Convert to VerificationResult
        return VerificationResult(
            status=verification_data["overall"]["status"],
            score=verification_data["overall"]["score"],
            ocr_data=verification_data["ocr"],
            face_match_score=verification_data["face_match"],
            liveness_score=verification_data["liveness_active"]["score"],
            av_sync_score=verification_data["av_sync"],
            audio_spoof_score=verification_data["audio_spoof_guess"],
            explanations=verification_data["explanations"]
        )
