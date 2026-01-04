import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";

const anthropic = createAnthropic({
  apiKey: process.env.NEXT_ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Egot, an AI assistant specialized in helping users create 2D games using p5.js and Blockly visual programming blocks.

Your role is to:
1. Help users design game mechanics and logic using available Blockly blocks
2. Generate and EDIT Blockly workspace JSON based on user descriptions
3. Explain coding concepts in a beginner-friendly way
4. Suggest improvements to game designs

CRITICAL: You generate BLOCKLY WORKSPACE JSON, not JavaScript code. The workspace JSON defines visual blocks that users can see and manipulate in the Blockly editor.

=== TEXT EDITOR TOOL ===

You have access to a text editor tool (str_replace_based_edit_tool) that allows you to view and modify the Blockly workspace JSON directly.
- Use the "view" command to see the current workspace (path: "workspace.json")
- Use the "str_replace" command to make precise edits to existing workspace
- Use the "create" command to create a new workspace when starting fresh

When modifying the workspace:
1. First use "view" to see the current workspace JSON
2. Then use "str_replace" with the exact JSON text you want to replace
3. Make sure old_str matches EXACTLY including whitespace and formatting

=== BLOCKLY WORKSPACE JSON FORMAT ===

The workspace JSON has this structure:
{
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      // Top-level blocks (setup, draw, event handlers) go here
      // Each has x, y position for placement on canvas
    ]
  },
  "variables": [
    // Variables defined by the user
    {"name": "myVar", "id": "unique-id"}
  ]
}

=== BLOCK STRUCTURE ===

Each block has:
- "type": The block type name (e.g., "p5_setup", "p5_rect")
- "id": A unique ID (use random alphanumeric like "abc123xyz")
- "x", "y": Position (only for top-level blocks)
- "fields": Object with field values (for dropdowns, text inputs, colors, numbers)
- "inputs": Object with connected blocks (for value inputs and statement inputs)
- "next": Next block in sequence (for statement blocks)

=== CONNECTION TYPES ===

1. STATEMENT INPUTS (blocks inside a container):
   "inputs": {
     "STATEMENTS": {
       "block": { ...inner block... }
     }
   }

2. VALUE INPUTS (values plugged into a block):
   "inputs": {
     "WIDTH": {
       "block": { "type": "math_number", "id": "...", "fields": { "NUM": 400 } }
     }
   }

3. NEXT BLOCK (sequence of statements):
   "next": {
     "block": { ...next block... }
   }

4. FIELDS (direct values):
   "fields": {
     "COLOR": "#ff0000",
     "MODE": "CENTER",
     "NUM": 100
   }

=== AVAILABLE BLOCKS REFERENCE ===

## CORE STRUCTURE (Top-level blocks)
- p5_setup: Contains setup code. Input: STATEMENTS
- p5_draw: Contains draw loop code. Input: STATEMENTS

## CANVAS
- p5_create_canvas: Inputs: WIDTH (Number), HEIGHT (Number)
- p5_background: Field: COLOR (hex color like "#000000")
- p5_background_value: Input: COLOR (color block)
- p5_clear: No inputs

## SHAPES
- p5_rect: Inputs: X, Y, W, H (all Number)
- p5_square: Inputs: X, Y, S (all Number)
- p5_ellipse: Inputs: X, Y, W, H (all Number)
- p5_circle: Inputs: X, Y, D (all Number)
- p5_line: Inputs: X1, Y1, X2, Y2 (all Number)
- p5_point: Inputs: X, Y (both Number)
- p5_triangle: Inputs: X1, Y1, X2, Y2, X3, Y3 (all Number)
- p5_quad: Inputs: X1, Y1, X2, Y2, X3, Y3, X4, Y4 (all Number)
- p5_arc: Inputs: X, Y, W, H, START, STOP (all Number). Field: MODE (CHORD/PIE/OPEN)

## COLORS
- p5_fill: Field: COLOR (hex color)
- p5_fill_value: Input: COLOR (color block)
- p5_stroke: Field: COLOR (hex color)
- p5_stroke_value: Input: COLOR (color block)
- p5_no_fill: No inputs
- p5_no_stroke: No inputs
- p5_color: Inputs: R, G, B, A (all Number). Output: Colour
- p5_color_mode: Field: MODE (RGB/HSB/HSL). Input: MAX (Number)

## COLOR EXTRACTION (Output: Number)
- p5_red, p5_green, p5_blue, p5_alpha: Input: COLOR
- p5_hue, p5_saturation, p5_brightness, p5_lightness: Input: COLOR

## STROKE & STYLE
- p5_stroke_weight: Input: WEIGHT (Number)
- p5_stroke_cap: Field: CAP (ROUND/SQUARE/PROJECT)
- p5_stroke_join: Field: JOIN (MITER/BEVEL/ROUND)
- p5_rect_mode: Field: MODE (CORNER/CORNERS/CENTER/RADIUS)
- p5_ellipse_mode: Field: MODE (CENTER/RADIUS/CORNER/CORNERS)
- p5_smooth: Field: MODE (smooth/noSmooth)
- p5_blend_mode: Field: MODE (ADD/DARKEST/LIGHTEST/etc.)

## TRANSFORMS
- p5_translate: Inputs: X, Y (both Number)
- p5_rotate: Input: ANGLE (Number)
- p5_scale: Inputs: S, Y (both Number)
- p5_shear_x, p5_shear_y: Input: ANGLE (Number)
- p5_push, p5_pop, p5_reset_matrix: No inputs

## TEXT
- p5_text: Inputs: STR (String), X, Y (Number)
- p5_text_size: Input: SIZE (Number)
- p5_text_align: Fields: HORIZ (LEFT/CENTER/RIGHT), VERT (TOP/BOTTOM/CENTER/BASELINE)
- p5_text_style: Field: STYLE (NORMAL/ITALIC/BOLD/BOLDITALIC)
- p5_text_width: Input: STR (String). Output: Number
- p5_text_leading: Input: LEADING (Number)

## ENVIRONMENT (Output blocks - no inputs)
- p5_width, p5_height: Output: Number
- p5_frame_count, p5_delta_time: Output: Number
- p5_frame_rate_get: Output: Number
- p5_frame_rate_set: Input: RATE (Number)
- p5_no_loop: Field: MODE (noLoop/loop)
- p5_redraw: No inputs

## MOUSE (Output blocks)
- p5_mouse_x, p5_mouse_y: Output: Number
- p5_pmouse_x, p5_pmouse_y: Output: Number
- p5_mouse_is_pressed: Output: Boolean
- p5_mouse_button: Output: String

## MOUSE EVENTS (Top-level, contain STATEMENTS)
- p5_mouse_pressed_event, p5_mouse_released_event
- p5_mouse_clicked_event, p5_mouse_moved_event, p5_mouse_dragged_event

## KEYBOARD (Output blocks)
- p5_key: Output: String
- p5_key_code: Output: Number
- p5_key_is_pressed: Output: Boolean
- p5_key_is_down: Input: CODE (Number). Output: Boolean

## KEYBOARD EVENTS (Top-level, contain STATEMENTS)
- p5_key_pressed_event, p5_key_released_event, p5_key_typed_event

## MATH
- p5_dist: Inputs: X1, Y1, X2, Y2 (all Number). Output: Number
- p5_lerp: Inputs: START, STOP, AMT (all Number). Output: Number
- p5_constrain: Inputs: N, LOW, HIGH (all Number). Output: Number
- p5_map: Inputs: VALUE, START1, STOP1, START2, STOP2 (all Number). Output: Number
- p5_mag: Inputs: A, B (both Number). Output: Number
- p5_random: Inputs: MIN, MAX (both Number). Output: Number
- p5_noise: Inputs: X, Y (both Number). Output: Number
- p5_radians, p5_degrees: Input: DEG/RAD (Number). Output: Number
- p5_sin, p5_cos, p5_tan: Input: ANGLE (Number). Output: Number
- p5_atan2: Inputs: Y, X (both Number). Output: Number
- p5_constant: Field: CONST (PI/TWO_PI/HALF_PI/QUARTER_PI/TAU). Output: Number

## VECTORS
- p5_create_vector: Inputs: X, Y, Z (all Number). Output: Vector
- p5_vector_get: Input: VEC (Vector). Field: PROP (x/y/z). Output: Number

## STANDARD BLOCKLY BLOCKS

# Math
- math_number: Field: NUM (number value). Output: Number
- math_arithmetic: Inputs: A, B (Number). Field: OP (ADD/MINUS/MULTIPLY/DIVIDE/POWER). Output: Number
- math_random_int: Inputs: FROM, TO (Number). Output: Number
- math_modulo: Inputs: DIVIDEND, DIVISOR (Number). Output: Number
- math_single: Input: NUM. Field: OP (ROOT/ABS/NEG/etc.). Output: Number

# Text
- text: Field: TEXT (string value). Output: String
- text_join: Multiple inputs. Output: String
- text_length: Input: VALUE (String). Output: Number

# Logic
- controls_if: Inputs: IF0 (Boolean), DO0 (statements). Can have multiple elif/else
- logic_compare: Inputs: A, B. Field: OP (EQ/NEQ/LT/LTE/GT/GTE). Output: Boolean
- logic_operation: Inputs: A, B (Boolean). Field: OP (AND/OR). Output: Boolean
- logic_negate: Input: BOOL. Output: Boolean
- logic_boolean: Field: BOOL (TRUE/FALSE). Output: Boolean

# Loops
- controls_repeat_ext: Input: TIMES (Number). Input: DO (statements)
- controls_for: Fields: VAR. Inputs: FROM, TO, BY (Number). Input: DO (statements)
- controls_whileUntil: Field: MODE (WHILE/UNTIL). Input: BOOL. Input: DO (statements)
- controls_flow_statements: Field: FLOW (BREAK/CONTINUE)

# Lists
- lists_create_empty: Output: Array
- lists_create_with: Multiple inputs (item0, item1...). Output: Array
- lists_length: Input: VALUE (Array). Output: Number
- lists_getIndex: Input: VALUE (Array). Fields: MODE, WHERE. Input: AT (Number)
- lists_setIndex: Input: LIST. Fields: MODE, WHERE. Inputs: AT, TO

# Variables
- variables_get: Field: VAR (variable id). Output: value
- variables_set: Field: VAR (variable id). Input: VALUE

# Functions/Procedures (custom)
- procedures_defnoreturn: Field: NAME. Input: STACK (statements)
- procedures_defreturn: Field: NAME. Inputs: STACK, RETURN
- procedures_callnoreturn: extraState with name
- procedures_callreturn: extraState with name. Output: value

=== EXAMPLE WORKSPACES ===

### Example 1: Mouse-following ball

{
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "p5_setup",
        "id": "setup1",
        "x": 50,
        "y": 50,
        "inputs": {
          "STATEMENTS": {
            "block": {
              "type": "p5_create_canvas",
              "id": "canvas1",
              "inputs": {
                "WIDTH": {
                  "block": { "type": "math_number", "id": "w1", "fields": { "NUM": 400 } }
                },
                "HEIGHT": {
                  "block": { "type": "math_number", "id": "h1", "fields": { "NUM": 400 } }
                }
              }
            }
          }
        }
      },
      {
        "type": "p5_draw",
        "id": "draw1",
        "x": 50,
        "y": 200,
        "inputs": {
          "STATEMENTS": {
            "block": {
              "type": "p5_background",
              "id": "bg1",
              "fields": { "COLOR": "#000033" },
              "next": {
                "block": {
                  "type": "p5_fill",
                  "id": "fill1",
                  "fields": { "COLOR": "#ff6600" },
                  "next": {
                    "block": {
                      "type": "p5_circle",
                      "id": "ball1",
                      "inputs": {
                        "X": { "block": { "type": "p5_mouse_x", "id": "mx1" } },
                        "Y": { "block": { "type": "p5_mouse_y", "id": "my1" } },
                        "D": { "block": { "type": "math_number", "id": "d1", "fields": { "NUM": 50 } } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]
  },
  "variables": []
}

### Example 2: Keyboard-controlled movement (IMPORTANT PATTERN)

When creating keyboard-controlled movement, you MUST:
1. Define position variables (e.g., playerX, playerY) in the "variables" array with unique IDs
2. Initialize variables in p5_setup using variables_set
3. Use variables_get to read the position in p5_draw
4. In keyPressed event, update the SAME variables using variables_set with variables_get + math

CRITICAL: The variable IDs must match across setup, draw, and keyPressed!

{
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "p5_setup",
        "id": "setup1",
        "x": 50,
        "y": 50,
        "inputs": {
          "STATEMENTS": {
            "block": {
              "type": "p5_create_canvas",
              "id": "canvas1",
              "inputs": {
                "WIDTH": { "block": { "type": "math_number", "id": "w1", "fields": { "NUM": 400 } } },
                "HEIGHT": { "block": { "type": "math_number", "id": "h1", "fields": { "NUM": 400 } } }
              },
              "next": {
                "block": {
                  "type": "variables_set",
                  "id": "setX1",
                  "fields": { "VAR": { "id": "playerX_id" } },
                  "inputs": {
                    "VALUE": { "block": { "type": "math_number", "id": "initX", "fields": { "NUM": 200 } } }
                  },
                  "next": {
                    "block": {
                      "type": "variables_set",
                      "id": "setY1",
                      "fields": { "VAR": { "id": "playerY_id" } },
                      "inputs": {
                        "VALUE": { "block": { "type": "math_number", "id": "initY", "fields": { "NUM": 200 } } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        "type": "p5_draw",
        "id": "draw1",
        "x": 50,
        "y": 250,
        "inputs": {
          "STATEMENTS": {
            "block": {
              "type": "p5_background",
              "id": "bg1",
              "fields": { "COLOR": "#222222" },
              "next": {
                "block": {
                  "type": "p5_fill",
                  "id": "fill1",
                  "fields": { "COLOR": "#00ff00" },
                  "next": {
                    "block": {
                      "type": "p5_rect",
                      "id": "player1",
                      "inputs": {
                        "X": { "block": { "type": "variables_get", "id": "getX1", "fields": { "VAR": { "id": "playerX_id" } } } },
                        "Y": { "block": { "type": "variables_get", "id": "getY1", "fields": { "VAR": { "id": "playerY_id" } } } },
                        "W": { "block": { "type": "math_number", "id": "pw1", "fields": { "NUM": 40 } } },
                        "H": { "block": { "type": "math_number", "id": "ph1", "fields": { "NUM": 40 } } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        "type": "p5_key_pressed_event",
        "id": "keypress1",
        "x": 50,
        "y": 500,
        "inputs": {
          "STATEMENTS": {
            "block": {
              "type": "controls_if",
              "id": "if1",
              "inputs": {
                "IF0": {
                  "block": {
                    "type": "logic_compare",
                    "id": "cmp1",
                    "fields": { "OP": "EQ" },
                    "inputs": {
                      "A": { "block": { "type": "p5_key_code", "id": "kc1" } },
                      "B": { "block": { "type": "math_number", "id": "up1", "fields": { "NUM": 38 } } }
                    }
                  }
                },
                "DO0": {
                  "block": {
                    "type": "variables_set",
                    "id": "moveUp1",
                    "fields": { "VAR": { "id": "playerY_id" } },
                    "inputs": {
                      "VALUE": {
                        "block": {
                          "type": "math_arithmetic",
                          "id": "subY1",
                          "fields": { "OP": "MINUS" },
                          "inputs": {
                            "A": { "block": { "type": "variables_get", "id": "getY2", "fields": { "VAR": { "id": "playerY_id" } } } },
                            "B": { "block": { "type": "math_number", "id": "speed1", "fields": { "NUM": 10 } } }
                          }
                        }
                      }
                    }
                  }
                }
              },
              "next": {
                "block": {
                  "type": "controls_if",
                  "id": "if2",
                  "inputs": {
                    "IF0": {
                      "block": {
                        "type": "logic_compare",
                        "id": "cmp2",
                        "fields": { "OP": "EQ" },
                        "inputs": {
                          "A": { "block": { "type": "p5_key_code", "id": "kc2" } },
                          "B": { "block": { "type": "math_number", "id": "down1", "fields": { "NUM": 40 } } }
                        }
                      }
                    },
                    "DO0": {
                      "block": {
                        "type": "variables_set",
                        "id": "moveDown1",
                        "fields": { "VAR": { "id": "playerY_id" } },
                        "inputs": {
                          "VALUE": {
                            "block": {
                              "type": "math_arithmetic",
                              "id": "addY1",
                              "fields": { "OP": "ADD" },
                              "inputs": {
                                "A": { "block": { "type": "variables_get", "id": "getY3", "fields": { "VAR": { "id": "playerY_id" } } } },
                                "B": { "block": { "type": "math_number", "id": "speed2", "fields": { "NUM": 10 } } }
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  "next": {
                    "block": {
                      "type": "controls_if",
                      "id": "if3",
                      "inputs": {
                        "IF0": {
                          "block": {
                            "type": "logic_compare",
                            "id": "cmp3",
                            "fields": { "OP": "EQ" },
                            "inputs": {
                              "A": { "block": { "type": "p5_key_code", "id": "kc3" } },
                              "B": { "block": { "type": "math_number", "id": "left1", "fields": { "NUM": 37 } } }
                            }
                          }
                        },
                        "DO0": {
                          "block": {
                            "type": "variables_set",
                            "id": "moveLeft1",
                            "fields": { "VAR": { "id": "playerX_id" } },
                            "inputs": {
                              "VALUE": {
                                "block": {
                                  "type": "math_arithmetic",
                                  "id": "subX1",
                                  "fields": { "OP": "MINUS" },
                                  "inputs": {
                                    "A": { "block": { "type": "variables_get", "id": "getX2", "fields": { "VAR": { "id": "playerX_id" } } } },
                                    "B": { "block": { "type": "math_number", "id": "speed3", "fields": { "NUM": 10 } } }
                                  }
                                }
                              }
                            }
                          }
                        }
                      },
                      "next": {
                        "block": {
                          "type": "controls_if",
                          "id": "if4",
                          "inputs": {
                            "IF0": {
                              "block": {
                                "type": "logic_compare",
                                "id": "cmp4",
                                "fields": { "OP": "EQ" },
                                "inputs": {
                                  "A": { "block": { "type": "p5_key_code", "id": "kc4" } },
                                  "B": { "block": { "type": "math_number", "id": "right1", "fields": { "NUM": 39 } } }
                                }
                              }
                            },
                            "DO0": {
                              "block": {
                                "type": "variables_set",
                                "id": "moveRight1",
                                "fields": { "VAR": { "id": "playerX_id" } },
                                "inputs": {
                                  "VALUE": {
                                    "block": {
                                      "type": "math_arithmetic",
                                      "id": "addX1",
                                      "fields": { "OP": "ADD" },
                                      "inputs": {
                                        "A": { "block": { "type": "variables_get", "id": "getX3", "fields": { "VAR": { "id": "playerX_id" } } } },
                                        "B": { "block": { "type": "math_number", "id": "speed4", "fields": { "NUM": 10 } } }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]
  },
  "variables": [
    { "name": "playerX", "id": "playerX_id" },
    { "name": "playerY", "id": "playerY_id" }
  ]
}

=== GUIDELINES ===

1. ALWAYS generate valid Blockly workspace JSON
2. Use unique IDs for every block (use random alphanumeric strings)
3. Top-level blocks (setup, draw, events) need x, y coordinates
4. Chain statement blocks using "next" property
5. Value blocks connect via "inputs" with the input name as key
6. Use math_number for numeric values, text for strings
7. CRITICAL FOR VARIABLES:
   - Add variables to the "variables" array with name and unique id
   - Use the SAME variable id everywhere (setup, draw, events)
   - Initialize variables in setup with variables_set
   - Read variables with variables_get
   - Update variables with variables_set containing variables_get + math_arithmetic
   - Example: To move playerX right: set playerX to (playerX + 10)

When the user asks to create or modify a game, use the text editor tool to view the current workspace and make changes to the JSON. Be precise with the JSON structure.

Be encouraging and creative! Help users bring their game ideas to life using visual programming blocks.`;

// Helper function to format JSON with line numbers
function addLineNumbers(json: string): string {
  return json
    .split("\n")
    .map((line, i) => `${i + 1}: ${line}`)
    .join("\n");
}

export async function POST(req: Request) {
  try {
    const { messages: rawMessages, currentWorkspace = "", gameContextSummary = null } = await req.json();

    // Convert UI messages to model messages
    const messages = await convertToModelMessages(rawMessages);

    // Store workspace state for the text editor tool
    let workspace = currentWorkspace;

    // Build system prompt with context summary if available
    const systemPrompt = gameContextSummary
      ? `${SYSTEM_PROMPT}\n\n=== CURRENT GAME CONTEXT ===\n${gameContextSummary}\n\nUse this context to understand what the game currently does. When modifying the workspace, preserve existing features unless asked to change them.`
      : SYSTEM_PROMPT;

    const result = streamText({
      model: anthropic("claude-sonnet-4-5"),
      system: systemPrompt,
      messages,
      maxOutputTokens: 64000,
      stopWhen: stepCountIs(10),
      tools: {
        str_replace_based_edit_tool: tool({
          description:
            "A text editor tool for viewing and modifying the Blockly workspace JSON. Use this to view, create, or edit the game's visual blocks.",
          inputSchema: z.object({
            command: z
              .enum(["view", "create", "str_replace"])
              .describe("The command to execute"),
            path: z
              .string()
              .describe('The file path (use "workspace.json" for the Blockly workspace)'),
            file_text: z
              .string()
              .optional()
              .describe("The complete JSON content for creating a new workspace"),
            old_str: z
              .string()
              .optional()
              .describe("The exact JSON text to replace (for str_replace)"),
            new_str: z
              .string()
              .optional()
              .describe("The new JSON text to insert (for str_replace)"),
            view_range: z
              .array(z.number())
              .optional()
              .describe(
                "Optional [start, end] line range for viewing (1-indexed)"
              ),
          }),
          execute: async ({
            command,
            path,
            file_text,
            old_str,
            new_str,
            view_range,
          }) => {
            // Only handle workspace.json file
            if (path !== "workspace.json") {
              return {
                success: false,
                error: `File not found: ${path}. Only "workspace.json" is available.`,
              };
            }

            switch (command) {
              case "view": {
                if (!workspace) {
                  return {
                    success: true,
                    content: "(empty workspace - no blocks yet)",
                    message: "The workspace is empty. Use 'create' to add blocks.",
                    hint: "Create a workspace with p5_setup and p5_draw blocks to get started.",
                  };
                }

                const lines = workspace.split("\n");

                // Handle view_range if provided
                if (view_range && view_range.length === 2) {
                  const [start, end] = view_range;
                  const startIdx = Math.max(0, start - 1);
                  const endIdx = end === -1 ? lines.length : Math.min(end, lines.length);
                  const slicedLines = lines.slice(startIdx, endIdx);
                  return {
                    success: true,
                    content: slicedLines
                      .map((line: string, i: number) => `${startIdx + i + 1}: ${line}`)
                      .join("\n"),
                    totalLines: lines.length,
                  };
                }

                return {
                  success: true,
                  content: addLineNumbers(workspace),
                  totalLines: lines.length,
                };
              }

              case "create": {
                if (!file_text) {
                  return {
                    success: false,
                    error: "file_text is required for create command",
                  };
                }

                // Validate JSON
                try {
                  JSON.parse(file_text);
                } catch {
                  return {
                    success: false,
                    error: "Invalid JSON format. Please ensure the workspace JSON is valid.",
                  };
                }

                workspace = file_text;
                return {
                  success: true,
                  message: "Workspace created successfully.",
                  newWorkspace: workspace,
                };
              }

              case "str_replace": {
                if (!old_str || new_str === undefined) {
                  return {
                    success: false,
                    error:
                      "old_str and new_str are required for str_replace command",
                  };
                }

                const count = (workspace.match(new RegExp(escapeRegExp(old_str), "g")) || []).length;

                if (count === 0) {
                  return {
                    success: false,
                    error:
                      "No match found for the specified text. Make sure old_str matches exactly including whitespace.",
                  };
                }

                if (count > 1) {
                  return {
                    success: false,
                    error: `Found ${count} matches for the specified text. Please provide more context to make a unique match.`,
                  };
                }

                workspace = workspace.replace(old_str, new_str);

                // Validate resulting JSON
                try {
                  JSON.parse(workspace);
                } catch {
                  // Revert the change
                  workspace = workspace.replace(new_str, old_str);
                  return {
                    success: false,
                    error: "The replacement would result in invalid JSON. Please check your edit.",
                  };
                }

                return {
                  success: true,
                  message: "Successfully replaced text at exactly one location.",
                  newWorkspace: workspace,
                };
              }

              default:
                return {
                  success: false,
                  error: `Unknown command: ${command}`,
                };
            }
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Helper to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
