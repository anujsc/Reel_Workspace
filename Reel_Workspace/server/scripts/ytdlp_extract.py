#!/usr/bin/env python3
import sys

from doh_resolver import install

install()

from yt_dlp import main

if __name__ == "__main__":
    sys.exit(main())
