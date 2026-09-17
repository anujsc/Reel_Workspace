#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
from pathlib import Path

from doh_resolver import install

install()

import instaloader

URL_PATTERN = re.compile(r"https?://(?:www\.)?(?:instagram\.com|instagr\.am)/(?:reel|reels|p|tv)/([A-Za-z0-9_-]+)", re.IGNORECASE)
VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".webm", ".m4v"}


def parse_short_code(url: str) -> str:
    match = URL_PATTERN.search(url)
    if not match:
        raise ValueError("Invalid Instagram URL format for Instaloader")
    return match.group(1)


def find_largest_video_file(root: Path) -> Path | None:
    largest_path = None
    largest_size = -1

    for file_path in root.rglob("*"):
        if not file_path.is_file():
            continue
        if file_path.suffix.lower() not in VIDEO_EXTENSIONS:
            continue

        size = file_path.stat().st_size
        if size > largest_size:
            largest_size = size
            largest_path = file_path

    return largest_path


def run_extraction(url: str, output_dir: Path, proxy: str | None) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    shortcode = parse_short_code(url)

    loader = instaloader.Instaloader(
        dirname_pattern=str(output_dir),
        filename_pattern="{shortcode}",
        download_comments=False,
        download_geotags=False,
        download_pictures=False,
        download_video_thumbnails=False,
        save_metadata=False,
        post_metadata_txt_pattern="",
        compress_json=False,
        quiet=True,
    )

    if proxy:
        os.environ["HTTPS_PROXY"] = proxy
        os.environ["HTTP_PROXY"] = proxy

    post = instaloader.Post.from_shortcode(loader.context, shortcode)

    if not post.is_video:
        raise RuntimeError("Instagram post is not a video")

    loader.download_post(post, target=shortcode)

    video_path = find_largest_video_file(output_dir)
    if video_path is None:
        raise RuntimeError("Instaloader did not produce a video file")

    return {
        "videoPath": str(video_path),
        "title": post.title or shortcode,
        "caption": post.caption or "",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--proxy")
    args = parser.parse_args()

    try:
        result = run_extraction(args.url, Path(args.output_dir), args.proxy)
        print(json.dumps(result, ensure_ascii=True))
        return 0
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
