from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
API_ROOT = ROOT / "apps" / "api"

if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.main import app  # noqa: E402
