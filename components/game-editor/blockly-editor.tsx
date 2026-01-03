"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useEditor } from "./editor-context";
import { defineP5Blocks } from "./blockly-p5-blocks";
import { defineP5Generators } from "./blockly-p5-generators";

// Blockly will be loaded dynamically
declare global {
  interface Window {
    Blockly: typeof import("blockly");
  }
}

export function BlocklyEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<import("blockly").WorkspaceSvg | null>(null);
  const [isBlocklyReady, setIsBlocklyReady] = useState(false);
  const { updateGeneratedCode, workspace, setWorkspace, pendingAIWorkspace, clearPendingAIWorkspace } = useEditor();

  const initBlockly = useCallback(async () => {
    if (!containerRef.current || workspaceRef.current) return;

    const Blockly = await import("blockly");
    const { javascriptGenerator } = await import("blockly/javascript");
    const { FieldColour } = await import("@blockly/field-colour");

    // Define custom p5.js blocks and generators
    defineP5Blocks(Blockly, FieldColour);
    defineP5Generators(javascriptGenerator);

    // Create comprehensive toolbox
    const toolbox = {
      kind: "categoryToolbox",
      contents: [
        {
          kind: "category",
          name: "Game Setup",
          colour: "#5C81A6",
          contents: [
            { kind: "block", type: "p5_setup" },
            { kind: "block", type: "p5_draw" },
            { kind: "block", type: "p5_create_canvas" },
            { kind: "block", type: "p5_frame_rate_set" },
            { kind: "block", type: "p5_no_loop" },
            { kind: "block", type: "p5_redraw" },
          ],
        },
        {
          kind: "category",
          name: "Shapes",
          colour: "#5CA65C",
          contents: [
            { kind: "block", type: "p5_rect" },
            { kind: "block", type: "p5_square" },
            { kind: "block", type: "p5_ellipse" },
            { kind: "block", type: "p5_circle" },
            { kind: "block", type: "p5_line" },
            { kind: "block", type: "p5_point" },
            { kind: "block", type: "p5_triangle" },
            { kind: "block", type: "p5_quad" },
            { kind: "block", type: "p5_arc" },
            { kind: "block", type: "p5_bezier" },
            { kind: "block", type: "p5_curve" },
          ],
        },
        {
          kind: "category",
          name: "Custom Shapes",
          colour: "#5CA65C",
          contents: [
            { kind: "block", type: "p5_begin_shape" },
            { kind: "block", type: "p5_end_shape" },
            { kind: "block", type: "p5_vertex" },
            { kind: "block", type: "p5_curve_vertex" },
          ],
        },
        {
          kind: "category",
          name: "Colors",
          colour: "#A65C81",
          contents: [
            { kind: "block", type: "p5_background" },
            { kind: "block", type: "p5_background_value" },
            { kind: "block", type: "p5_fill" },
            { kind: "block", type: "p5_fill_value" },
            { kind: "block", type: "p5_stroke" },
            { kind: "block", type: "p5_stroke_value" },
            { kind: "block", type: "p5_no_fill" },
            { kind: "block", type: "p5_no_stroke" },
            { kind: "block", type: "p5_clear" },
            { kind: "block", type: "p5_color_mode" },
            { kind: "block", type: "p5_color" },
            { kind: "block", type: "p5_lerp_color" },
          ],
        },
        {
          kind: "category",
          name: "Color Extract",
          colour: "#A65C81",
          contents: [
            { kind: "block", type: "p5_red" },
            { kind: "block", type: "p5_green" },
            { kind: "block", type: "p5_blue" },
            { kind: "block", type: "p5_alpha" },
            { kind: "block", type: "p5_hue" },
            { kind: "block", type: "p5_saturation" },
            { kind: "block", type: "p5_brightness" },
            { kind: "block", type: "p5_lightness" },
          ],
        },
        {
          kind: "category",
          name: "Stroke & Style",
          colour: "#A65C81",
          contents: [
            { kind: "block", type: "p5_stroke_weight" },
            { kind: "block", type: "p5_stroke_cap" },
            { kind: "block", type: "p5_stroke_join" },
            { kind: "block", type: "p5_rect_mode" },
            { kind: "block", type: "p5_ellipse_mode" },
            { kind: "block", type: "p5_smooth" },
            { kind: "block", type: "p5_blend_mode" },
          ],
        },
        {
          kind: "category",
          name: "Transform",
          colour: "#9966FF",
          contents: [
            { kind: "block", type: "p5_translate" },
            { kind: "block", type: "p5_rotate" },
            { kind: "block", type: "p5_scale" },
            { kind: "block", type: "p5_shear_x" },
            { kind: "block", type: "p5_shear_y" },
            { kind: "block", type: "p5_push" },
            { kind: "block", type: "p5_pop" },
            { kind: "block", type: "p5_reset_matrix" },
          ],
        },
        {
          kind: "category",
          name: "Mouse",
          colour: "#A6745C",
          contents: [
            { kind: "block", type: "p5_mouse_x" },
            { kind: "block", type: "p5_mouse_y" },
            { kind: "block", type: "p5_pmouse_x" },
            { kind: "block", type: "p5_pmouse_y" },
            { kind: "block", type: "p5_mouse_is_pressed" },
            { kind: "block", type: "p5_mouse_button" },
          ],
        },
        {
          kind: "category",
          name: "Mouse Events",
          colour: "#A6745C",
          contents: [
            { kind: "block", type: "p5_mouse_pressed_event" },
            { kind: "block", type: "p5_mouse_released_event" },
            { kind: "block", type: "p5_mouse_clicked_event" },
            { kind: "block", type: "p5_mouse_moved_event" },
            { kind: "block", type: "p5_mouse_dragged_event" },
          ],
        },
        {
          kind: "category",
          name: "Keyboard",
          colour: "#A6745C",
          contents: [
            { kind: "block", type: "p5_key" },
            { kind: "block", type: "p5_key_code" },
            { kind: "block", type: "p5_key_is_pressed" },
            { kind: "block", type: "p5_key_is_down" },
          ],
        },
        {
          kind: "category",
          name: "Key Events",
          colour: "#A6745C",
          contents: [
            { kind: "block", type: "p5_key_pressed_event" },
            { kind: "block", type: "p5_key_released_event" },
            { kind: "block", type: "p5_key_typed_event" },
          ],
        },
        {
          kind: "category",
          name: "Text",
          colour: "#5CA65C",
          contents: [
            { kind: "block", type: "p5_text" },
            { kind: "block", type: "p5_text_size" },
            { kind: "block", type: "p5_text_align" },
            { kind: "block", type: "p5_text_style" },
            { kind: "block", type: "p5_text_width" },
            { kind: "block", type: "p5_text_leading" },
          ],
        },
        {
          kind: "category",
          name: "p5 Math",
          colour: "#745CA6",
          contents: [
            { kind: "block", type: "p5_dist" },
            { kind: "block", type: "p5_lerp" },
            { kind: "block", type: "p5_map" },
            { kind: "block", type: "p5_constrain" },
            { kind: "block", type: "p5_mag" },
            { kind: "block", type: "p5_random" },
            { kind: "block", type: "p5_noise" },
            { kind: "block", type: "p5_radians" },
            { kind: "block", type: "p5_degrees" },
            { kind: "block", type: "p5_sin" },
            { kind: "block", type: "p5_cos" },
            { kind: "block", type: "p5_tan" },
            { kind: "block", type: "p5_atan2" },
            { kind: "block", type: "p5_constant" },
          ],
        },
        {
          kind: "category",
          name: "Environment",
          colour: "#5C81A6",
          contents: [
            { kind: "block", type: "p5_width" },
            { kind: "block", type: "p5_height" },
            { kind: "block", type: "p5_frame_count" },
            { kind: "block", type: "p5_delta_time" },
            { kind: "block", type: "p5_frame_rate_get" },
          ],
        },
        {
          kind: "category",
          name: "Vectors",
          colour: "#9966FF",
          contents: [
            { kind: "block", type: "p5_create_vector" },
            { kind: "block", type: "p5_vector_get" },
          ],
        },
        { kind: "sep" },
        {
          kind: "category",
          name: "Math",
          colour: "#745CA6",
          contents: [
            { kind: "block", type: "math_number" },
            { kind: "block", type: "math_arithmetic" },
            { kind: "block", type: "math_random_int" },
            { kind: "block", type: "math_modulo" },
            { kind: "block", type: "math_single" },
          ],
        },
        {
          kind: "category",
          name: "Text",
          colour: "#5CA68C",
          contents: [
            { kind: "block", type: "text" },
            { kind: "block", type: "text_join" },
            { kind: "block", type: "text_length" },
          ],
        },
        {
          kind: "category",
          name: "Variables",
          colour: "#A6A65C",
          custom: "VARIABLE",
        },
        {
          kind: "category",
          name: "Functions",
          colour: "#995BA5",
          custom: "PROCEDURE",
        },
        {
          kind: "category",
          name: "Logic",
          colour: "#5CA6A6",
          contents: [
            { kind: "block", type: "controls_if" },
            { kind: "block", type: "logic_compare" },
            { kind: "block", type: "logic_operation" },
            { kind: "block", type: "logic_negate" },
            { kind: "block", type: "logic_boolean" },
          ],
        },
        {
          kind: "category",
          name: "Loops",
          colour: "#5C5CA6",
          contents: [
            { kind: "block", type: "controls_repeat_ext" },
            { kind: "block", type: "controls_for" },
            { kind: "block", type: "controls_whileUntil" },
            { kind: "block", type: "controls_flow_statements" },
          ],
        },
        {
          kind: "category",
          name: "Lists",
          colour: "#745CA6",
          contents: [
            { kind: "block", type: "lists_create_empty" },
            { kind: "block", type: "lists_create_with" },
            { kind: "block", type: "lists_length" },
            { kind: "block", type: "lists_getIndex" },
            { kind: "block", type: "lists_setIndex" },
          ],
        },
      ],
    };

    // Inject Blockly
    workspaceRef.current = Blockly.inject(containerRef.current, {
      toolbox,
      grid: {
        spacing: 20,
        length: 3,
        colour: "#333",
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      trashcan: true,
      theme: Blockly.Themes.Classic,
    });

    // Load saved workspace if exists
    if (workspace.blocks) {
      try {
        Blockly.serialization.workspaces.load(
          JSON.parse(workspace.blocks),
          workspaceRef.current
        );
      } catch (e) {
        console.error("Failed to load workspace:", e);
      }
    }

    // Listen for changes
    workspaceRef.current.addChangeListener(() => {
      if (!workspaceRef.current) return;

      // Generate code
      const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
      updateGeneratedCode(code);

      // Save workspace
      const state = Blockly.serialization.workspaces.save(workspaceRef.current);
      setWorkspace({
        blocks: JSON.stringify(state),
        generatedCode: code,
      });
    });

    // Mark Blockly as ready
    setIsBlocklyReady(true);
  }, [workspace.blocks, updateGeneratedCode, setWorkspace]);

  useEffect(() => {
    initBlockly();

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [initBlockly]);

  // Handle resize
  useEffect(() => {
    const handleResize = async () => {
      if (workspaceRef.current && containerRef.current) {
        const Blockly = await import("blockly");
        Blockly.svgResize(workspaceRef.current);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Load AI-generated workspace when pendingAIWorkspace changes AND Blockly is ready
  useEffect(() => {
    const loadAIWorkspaceEffect = async () => {
      if (!pendingAIWorkspace || !isBlocklyReady || !workspaceRef.current) return;

      try {
        const Blockly = await import("blockly");
        const { javascriptGenerator } = await import("blockly/javascript");

        // Parse the workspace JSON
        const workspaceState = JSON.parse(pendingAIWorkspace);
        console.log("Loading workspace state:", workspaceState);

        // Clear existing workspace
        workspaceRef.current.clear();

        // Load the new workspace
        Blockly.serialization.workspaces.load(workspaceState, workspaceRef.current);

        // Check what blocks were loaded
        const allBlocks = workspaceRef.current.getAllBlocks(false);
        console.log("Blocks loaded:", allBlocks.length, allBlocks.map(b => b.type));

        // Force re-render after a small delay to ensure container is visible
        setTimeout(() => {
          if (!workspaceRef.current) return;
          Blockly.svgResize(workspaceRef.current);
          workspaceRef.current.render();
          workspaceRef.current.scrollCenter();
        }, 100);

        // Generate code from the new blocks
        const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
        console.log("Generated code length:", code.length);
        updateGeneratedCode(code);

        // Save the workspace state
        const state = Blockly.serialization.workspaces.save(workspaceRef.current);
        setWorkspace({
          blocks: JSON.stringify(state),
          generatedCode: code,
        });

        // Clear the pending workspace
        clearPendingAIWorkspace();
      } catch (e) {
        console.error("Failed to load AI workspace:", e);
        clearPendingAIWorkspace();
      }
    };

    loadAIWorkspaceEffect();
  }, [pendingAIWorkspace, isBlocklyReady, updateGeneratedCode, setWorkspace, clearPendingAIWorkspace]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
