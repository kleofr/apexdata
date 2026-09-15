import os
import fastf1 as f1

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)

# Enable FastF1 file-based caching
f1.Cache.enable_cache(CACHE_DIR)

DEFAULT_YEAR = 2024
DEFAULT_GP = 'Monaco'
DEFAULT_SESSION = 'R'
