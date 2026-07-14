/*****************************************************************************************************************************/
/* Purpose: Tests for resolveDisplayMode utility, including backward compatibility with legacy show_needle/show_dial configs
/* History: 14-JUL-2026 D.Geisenhoff   Created
/*****************************************************************************************************************************/
import { resolveDisplayMode } from "../utils/resolve-display-mode";

describe("resolveDisplayMode", () => {
  describe("display_mode (current config)", () => {
    it("resolves gauge_and_needle to needle+segments, no dial", () => {
      expect(resolveDisplayMode({ display_mode: "gauge_and_needle" })).toEqual({
        showNeedle: true,
        showDial: false,
        showSegments: true,
      });
    });

    it("resolves dial_only to dial only, no needle, no segments", () => {
      expect(resolveDisplayMode({ display_mode: "dial_only" })).toEqual({
        showNeedle: false,
        showDial: true,
        showSegments: false,
      });
    });

    it("resolves dial_and_needle to needle+dial, no segments", () => {
      expect(resolveDisplayMode({ display_mode: "dial_and_needle" })).toEqual({
        showNeedle: true,
        showDial: true,
        showSegments: false,
      });
    });

    it("display_mode takes precedence over legacy show_needle/show_dial when both are set", () => {
      expect(
        resolveDisplayMode({
          display_mode: "dial_only",
          show_needle: true,
          show_dial: false,
        })
      ).toEqual({ showNeedle: false, showDial: true, showSegments: false });
    });
  });

  describe("legacy show_needle / show_dial (backward compatibility)", () => {
    it("falls back to gauge_and_needle-equivalent defaults when config is undefined", () => {
      expect(resolveDisplayMode(undefined)).toEqual({
        showNeedle: true,
        showDial: false,
        showSegments: true,
      });
    });

    it("reproduces the old default of show_needle: true, show_dial: true", () => {
      expect(
        resolveDisplayMode({ show_needle: true, show_dial: true })
      ).toEqual({ showNeedle: true, showDial: true, showSegments: true });
    });

    it("show_needle: false, show_dial: true hides needle and segments, shows dial", () => {
      expect(
        resolveDisplayMode({ show_needle: false, show_dial: true })
      ).toEqual({ showNeedle: false, showDial: true, showSegments: false });
    });

    it("show_needle: true, show_dial: false shows needle and segments, hides dial", () => {
      expect(
        resolveDisplayMode({ show_needle: true, show_dial: false })
      ).toEqual({ showNeedle: true, showDial: false, showSegments: true });
    });

    it("show_needle: false, show_dial: false hides needle, segments and dial", () => {
      expect(
        resolveDisplayMode({ show_needle: false, show_dial: false })
      ).toEqual({ showNeedle: false, showDial: false, showSegments: false });
    });

    it("defaults show_dial to true when only show_needle is set", () => {
      expect(resolveDisplayMode({ show_needle: false })).toEqual({
        showNeedle: false,
        showDial: true,
        showSegments: false,
      });
    });

    it("defaults show_needle to true when only show_dial is set", () => {
      expect(resolveDisplayMode({ show_dial: false })).toEqual({
        showNeedle: true,
        showDial: false,
        showSegments: true,
      });
    });
  });
});
