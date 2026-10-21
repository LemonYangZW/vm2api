#!/usr/bin/env python3
"""验证正式门禁在重复层和最后阶段取证失败时仍以失败退出。"""
import contextlib
import io
import json
from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest
from unittest.mock import patch

import run_suite


def arguments(output, layers="kernel,cli,integration"):
    result = ["run_suite.py", "--output-dir", str(output), "--layers", layers]
    for name in ("payload-root", "native-root", "manifest", "upstream-ref", "upstream-commit",
                 "candidate-commit", "runtime-image", "upstream-repo", "native-repo",
                 "upstream-api-kernel", "native-api-kernel"):
        result.extend(["--" + name, "test-placeholder"])
    return result


class RunnerTests(unittest.TestCase):
    def test_duplicate_layer_cannot_overwrite_a_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "evidence"
            with patch("sys.argv", arguments(output, "kernel,cli,integration,kernel")), \
                    patch.object(run_suite, "prepare") as prepare, contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(run_suite.main(), 1)
            prepare.assert_not_called()
            report = json.loads((output / "report.json").read_text(encoding="utf-8"))
            self.assertEqual(report["status"], "FAIL")

    def test_final_evidence_failure_cannot_leave_pass_exit(self):
        completed = SimpleNamespace(testsRun=1, failures=[], errors=[], skipped=[], wasSuccessful=lambda: True)
        layer = SimpleNamespace(run_cli_layer=lambda *args: {"status": "PASS"},
                                run_kernel_layer=lambda *args: {"status": "PASS"},
                                run_integration_layer=lambda **kwargs: {"ok": True})
        binaries = {name: "test-placeholder" for name in
                    ("upstream_kernel", "native_kernel", "upstream_cli", "native_cli")}
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "evidence"
            with patch("sys.argv", arguments(output)), \
                    patch.object(run_suite, "prepare", return_value=(binaries, {})), \
                    patch.object(run_suite.importlib, "import_module", return_value=layer), \
                    patch.object(run_suite.unittest.TextTestRunner, "run", return_value=completed), \
                    patch.object(run_suite, "digest", side_effect=OSError("test source became unreadable")), \
                    contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(run_suite.main(), 1)
            report = json.loads((output / "report.json").read_text(encoding="utf-8"))
            self.assertTrue(all(item["ok"] for item in report["layers"].values()))
            self.assertEqual(report["status"], "FAIL")
            self.assertIn("test source became unreadable", report["error"])


if __name__ == "__main__":
    unittest.main()
