from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

import video_guide as vg  # noqa: E402


class ParsingTests(unittest.TestCase):
    def test_parse_fraction(self) -> None:
        self.assertAlmostEqual(vg.parse_fraction("30000/1001"), 29.97002997)
        self.assertEqual(vg.parse_fraction("25"), 25.0)
        self.assertIsNone(vg.parse_fraction("0/0"))
        self.assertIsNone(vg.parse_fraction("N/A"))

    def test_parse_scene_metadata(self) -> None:
        text = """frame:0 pts:12 pts_time:1.5
lavfi.scene_score=0.125421
frame:1 pts:35 pts_time:4.375
lavfi.scene_score=0.024126
"""
        self.assertEqual(
            vg.parse_scene_metadata(text),
            [
                {"pts_time": 1.5, "scene_score": 0.125421},
                {"pts_time": 4.375, "scene_score": 0.024126},
            ],
        )

    def test_parse_showinfo_uses_pts_time(self) -> None:
        stderr = """[Parsed_showinfo_3] n:   0 pts:      0 pts_time:0 duration:1
[Parsed_showinfo_3] n:   1 pts:      1 pts_time:1.001 duration:1
"""
        self.assertEqual(vg.parse_showinfo_pts(stderr), [0.0, 1.001])

    def test_format_timestamp(self) -> None:
        self.assertEqual(vg.format_timestamp(3661.234), "01:01:01.234")


class AnalysisTests(unittest.TestCase):
    def test_mean_absolute_difference(self) -> None:
        self.assertEqual(vg.mean_absolute_difference(bytes([0, 10]), bytes([10, 20])), 10.0)
        with self.assertRaises(ValueError):
            vg.mean_absolute_difference(b"", b"")

    def test_tile_mad_preserves_small_local_change(self) -> None:
        left = bytes([0] * 16)
        right = bytes([4, 4, 0, 0, 4, 4, 0, 0] + [0] * 8)
        self.assertEqual(vg.mean_absolute_difference(left, right), 1.0)
        self.assertEqual(
            vg.max_tile_mean_absolute_difference(left, right, width=4, columns=2, rows=2),
            4.0,
        )

    def test_periodic_local_peak(self) -> None:
        samples = [
            vg.GraySample(0.0, bytes([0, 0])),
            vg.GraySample(1.0, bytes([1, 1])),
            vg.GraySample(2.0, bytes([20, 20])),
            vg.GraySample(3.0, bytes([21, 21])),
        ]
        config = vg.PipelineConfig(periodic_mad_floor=5.0, periodic_noise_multiplier=0.0)
        signals, differences, threshold = vg.analyze_periodic_samples(samples, config)
        self.assertEqual(differences, [1.0, 19.0, 1.0])
        self.assertEqual(threshold, 5.0)
        self.assertEqual(len(signals), 1)
        self.assertEqual(signals[0].timestamp, 2.0)

    def test_two_second_clustering_and_stable_offset(self) -> None:
        config = vg.PipelineConfig(cluster_window_seconds=2.0, stable_offset_seconds=0.5)
        signals = [
            vg.Signal(1.0, "scene", 2.0, 0.02),
            vg.Signal(2.75, "periodic", 3.0, 7.5),
            vg.Signal(5.1, "scene", 4.0, 0.04),
        ]
        proposals = vg.cluster_signals(signals, duration=10.0, config=config)
        self.assertEqual(len(proposals), 2)
        self.assertEqual(proposals[0].requested_timestamp, 3.25)
        self.assertEqual(proposals[0].sources, ["periodic", "scene"])
        self.assertEqual(proposals[1].requested_timestamp, 5.6)

    def test_cluster_waits_until_final_change_not_strongest_change(self) -> None:
        config = vg.PipelineConfig(cluster_window_seconds=2.0, stable_offset_seconds=0.5)
        signals = [
            vg.Signal(1.0, "scene", 10.0, 0.2),
            vg.Signal(2.5, "scene", 1.0, 0.02),
        ]
        proposals = vg.cluster_signals(signals, duration=10.0, config=config)
        self.assertEqual(proposals[0].requested_timestamp, 3.0)

    def test_periodic_only_signal_is_not_delayed_past_short_menu(self) -> None:
        config = vg.PipelineConfig(stable_offset_seconds=0.5)
        proposals = vg.cluster_signals(
            [vg.Signal(12.0, "periodic", 2.0, 0.4)],
            duration=20.0,
            config=config,
        )
        self.assertEqual(proposals[0].requested_timestamp, 12.0)

    def test_coverage_fills_long_signal_free_gap(self) -> None:
        proposals = [
            vg.Proposal(1.0, ["boundary_start"]),
            vg.Proposal(17.0, ["scene"]),
        ]
        filled = vg.add_coverage_proposals(proposals, duration=20.0, interval_seconds=5.0)
        self.assertEqual(
            [item.requested_timestamp for item in filled],
            [1.0, 6.0, 11.0, 16.0, 17.0],
        )
        self.assertEqual(filled[1].sources, ["coverage"])

    def test_dedup_only_within_adjacent_time_window(self) -> None:
        samples = [
            vg.GraySample(0.0, bytes([10, 10])),
            vg.GraySample(2.0, bytes([10, 10])),
            vg.GraySample(10.0, bytes([10, 10])),
        ]
        proposals = [
            vg.Proposal(0.0, ["boundary_start"]),
            vg.Proposal(2.0, ["scene"]),
            vg.Proposal(10.0, ["scene"]),
        ]
        config = vg.PipelineConfig(dedup_time_window_seconds=4.0, dedup_mad_threshold=1.0)
        kept, discarded = vg.deduplicate_proposals(proposals, samples, config)
        self.assertEqual([item.requested_timestamp for item in kept], [0.0, 10.0])
        self.assertEqual(len(discarded), 1)

    def test_dedup_keeps_small_local_popover(self) -> None:
        samples = [
            vg.GraySample(0.0, bytes([0] * 16)),
            vg.GraySample(2.0, bytes([4, 4, 0, 0, 4, 4, 0, 0] + [0] * 8)),
        ]
        proposals = [vg.Proposal(0.0, ["scene"]), vg.Proposal(2.0, ["periodic"])]
        config = vg.PipelineConfig(
            sample_width=4,
            dedup_mad_threshold=1.5,
            dedup_tile_mad_threshold=2.0,
        )
        kept, discarded = vg.deduplicate_proposals(proposals, samples, config)
        self.assertEqual(len(kept), 2)
        self.assertEqual(discarded, [])

    def test_limit_is_even_across_full_ordered_timeline(self) -> None:
        proposals = [vg.Proposal(float(index), ["scene"]) for index in range(10)]
        kept, omitted = vg.evenly_limit(proposals, 4)
        self.assertEqual([item.requested_timestamp for item in kept], [0.0, 3.0, 6.0, 9.0])
        self.assertEqual(len(omitted), 6)


class OutputTests(unittest.TestCase):
    def test_nonempty_output_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            (path / "existing.txt").write_text("user data", encoding="utf-8")
            with self.assertRaises(vg.PipelineError):
                vg.prepare_output_directory(path)
            self.assertEqual((path / "existing.txt").read_text(encoding="utf-8"), "user data")

    def test_review_html_escapes_filename(self) -> None:
        metadata = {"source": {"filename": "<unsafe>.mov"}}
        manifest = {"candidates": []}
        output = vg.render_review_html(metadata, manifest)
        self.assertIn("&lt;unsafe&gt;.mov", output)
        self.assertNotIn("<unsafe>.mov", output)

    def test_symlink_output_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "target"
            target.mkdir()
            link = root / "result"
            link.symlink_to(target, target_is_directory=True)
            with self.assertRaises(vg.PipelineError):
                vg.prepare_output_directory(link)


@unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "需要 ffmpeg/ffprobe")
class EndToEndTests(unittest.TestCase):
    def test_small_synthetic_video(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            video = root / "synthetic.mp4"
            output = root / "result"
            command = [
                "ffmpeg",
                "-hide_banner",
                "-nostdin",
                "-loglevel",
                "error",
                "-f",
                "lavfi",
                "-i",
                "testsrc2=size=320x180:rate=12:duration=3",
                "-c:v",
                "mpeg4",
                "-y",
                str(video),
            ]
            subprocess.run(command, check=True)
            config = vg.PipelineConfig(
                scene_width=320,
                sample_width=64,
                screenshot_max_width=320,
                max_candidates=8,
            )
            result = vg.process_video(video, output, config)
            self.assertGreaterEqual(result["manifest"]["candidate_count"], 1)
            for filename in ("metadata.json", "candidates.json", "review.html", "model_prompt.md"):
                self.assertTrue((output / filename).is_file(), filename)
            serialized = (output / "metadata.json").read_text(encoding="utf-8")
            self.assertNotIn(str(root), serialized)
            manifest = json.loads((output / "candidates.json").read_text(encoding="utf-8"))
            for candidate in manifest["candidates"]:
                self.assertIsNone(candidate["timestamp"]["actual_seconds"])
                self.assertEqual(candidate["screenshot"]["privacy_status"], "unreviewed")
                self.assertTrue((output / candidate["screenshot"]["relative_path"]).is_file())


if __name__ == "__main__":
    unittest.main()
