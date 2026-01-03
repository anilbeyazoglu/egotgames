/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * p5.js Block Definitions for Blockly
 * Comprehensive collection of p5.js blocks for visual game development
 */

export function defineP5Blocks(
  Blockly: typeof import("blockly"),
  FieldColour?: any
) {
  // ============================================
  // GAME SETUP BLOCKS
  // ============================================

  Blockly.Blocks["p5_setup"] = {
    init: function () {
      this.appendDummyInput().appendField("setup");
      this.appendStatementInput("STATEMENTS").setCheck(null);
      this.setColour(210);
      this.setTooltip("The setup() function is called once when the program starts.");
    },
  };

  Blockly.Blocks["p5_draw"] = {
    init: function () {
      this.appendDummyInput().appendField("draw loop");
      this.appendStatementInput("STATEMENTS").setCheck(null);
      this.setColour(210);
      this.setTooltip("Called continuously until the program is stopped.");
    },
  };

  Blockly.Blocks["p5_create_canvas"] = {
    init: function () {
      this.appendDummyInput().appendField("create canvas");
      this.appendValueInput("WIDTH").setCheck("Number").appendField("width");
      this.appendValueInput("HEIGHT").setCheck("Number").appendField("height");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(210);
    },
  };

  // ============================================
  // ENVIRONMENT / SYSTEM VARIABLES
  // ============================================

  Blockly.Blocks["p5_width"] = {
    init: function () {
      this.appendDummyInput().appendField("width");
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_height"] = {
    init: function () {
      this.appendDummyInput().appendField("height");
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_frame_count"] = {
    init: function () {
      this.appendDummyInput().appendField("frameCount");
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_delta_time"] = {
    init: function () {
      this.appendDummyInput().appendField("deltaTime");
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_frame_rate_get"] = {
    init: function () {
      this.appendDummyInput().appendField("get frameRate");
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_frame_rate_set"] = {
    init: function () {
      this.appendValueInput("RATE").setCheck("Number").appendField("set frameRate");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_no_loop"] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([["noLoop", "noLoop"], ["loop", "loop"]]), "MODE"
      );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_redraw"] = {
    init: function () {
      this.appendDummyInput().appendField("redraw");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
    },
  };

  // ============================================
  // 2D PRIMITIVES - SHAPES
  // ============================================

  Blockly.Blocks["p5_point"] = {
    init: function () {
      this.appendDummyInput().appendField("point");
      this.appendValueInput("X").setCheck("Number").appendField("x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_line"] = {
    init: function () {
      this.appendDummyInput().appendField("line");
      this.appendValueInput("X1").setCheck("Number").appendField("x1");
      this.appendValueInput("Y1").setCheck("Number").appendField("y1");
      this.appendValueInput("X2").setCheck("Number").appendField("x2");
      this.appendValueInput("Y2").setCheck("Number").appendField("y2");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_rect"] = {
    init: function () {
      this.appendDummyInput().appendField("rect");
      this.appendValueInput("X").setCheck("Number").appendField("x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.appendValueInput("W").setCheck("Number").appendField("w");
      this.appendValueInput("H").setCheck("Number").appendField("h");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_square"] = {
    init: function () {
      this.appendDummyInput().appendField("square");
      this.appendValueInput("X").setCheck("Number").appendField("x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.appendValueInput("S").setCheck("Number").appendField("size");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_ellipse"] = {
    init: function () {
      this.appendDummyInput().appendField("ellipse");
      this.appendValueInput("X").setCheck("Number").appendField("x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.appendValueInput("W").setCheck("Number").appendField("w");
      this.appendValueInput("H").setCheck("Number").appendField("h");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_circle"] = {
    init: function () {
      this.appendDummyInput().appendField("circle");
      this.appendValueInput("X").setCheck("Number").appendField("x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.appendValueInput("D").setCheck("Number").appendField("d");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_triangle"] = {
    init: function () {
      this.appendDummyInput().appendField("triangle");
      this.appendValueInput("X1").setCheck("Number").appendField("x1");
      this.appendValueInput("Y1").setCheck("Number").appendField("y1");
      this.appendValueInput("X2").setCheck("Number").appendField("x2");
      this.appendValueInput("Y2").setCheck("Number").appendField("y2");
      this.appendValueInput("X3").setCheck("Number").appendField("x3");
      this.appendValueInput("Y3").setCheck("Number").appendField("y3");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_quad"] = {
    init: function () {
      this.appendDummyInput().appendField("quad");
      this.appendValueInput("X1").setCheck("Number").appendField("x1");
      this.appendValueInput("Y1").setCheck("Number").appendField("y1");
      this.appendValueInput("X2").setCheck("Number").appendField("x2");
      this.appendValueInput("Y2").setCheck("Number").appendField("y2");
      this.appendValueInput("X3").setCheck("Number").appendField("x3");
      this.appendValueInput("Y3").setCheck("Number").appendField("y3");
      this.appendValueInput("X4").setCheck("Number").appendField("x4");
      this.appendValueInput("Y4").setCheck("Number").appendField("y4");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_arc"] = {
    init: function () {
      this.appendDummyInput().appendField("arc");
      this.appendValueInput("X").setCheck("Number").appendField("x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.appendValueInput("W").setCheck("Number").appendField("w");
      this.appendValueInput("H").setCheck("Number").appendField("h");
      this.appendValueInput("START").setCheck("Number").appendField("start");
      this.appendValueInput("STOP").setCheck("Number").appendField("stop");
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([["CHORD", "CHORD"], ["PIE", "PIE"], ["OPEN", "OPEN"]]), "MODE"
      );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  // ============================================
  // CURVES
  // ============================================

  Blockly.Blocks["p5_bezier"] = {
    init: function () {
      this.appendDummyInput().appendField("bezier");
      this.appendValueInput("X1").setCheck("Number").appendField("x1");
      this.appendValueInput("Y1").setCheck("Number").appendField("y1");
      this.appendValueInput("X2").setCheck("Number").appendField("x2");
      this.appendValueInput("Y2").setCheck("Number").appendField("y2");
      this.appendValueInput("X3").setCheck("Number").appendField("x3");
      this.appendValueInput("Y3").setCheck("Number").appendField("y3");
      this.appendValueInput("X4").setCheck("Number").appendField("x4");
      this.appendValueInput("Y4").setCheck("Number").appendField("y4");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_curve"] = {
    init: function () {
      this.appendDummyInput().appendField("curve");
      this.appendValueInput("X1").setCheck("Number").appendField("x1");
      this.appendValueInput("Y1").setCheck("Number").appendField("y1");
      this.appendValueInput("X2").setCheck("Number").appendField("x2");
      this.appendValueInput("Y2").setCheck("Number").appendField("y2");
      this.appendValueInput("X3").setCheck("Number").appendField("x3");
      this.appendValueInput("Y3").setCheck("Number").appendField("y3");
      this.appendValueInput("X4").setCheck("Number").appendField("x4");
      this.appendValueInput("Y4").setCheck("Number").appendField("y4");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  // ============================================
  // VERTEX / CUSTOM SHAPES
  // ============================================

  Blockly.Blocks["p5_begin_shape"] = {
    init: function () {
      this.appendDummyInput().appendField("beginShape").appendField(
        new Blockly.FieldDropdown([
          ["default", "null"], ["POINTS", "POINTS"], ["LINES", "LINES"],
          ["TRIANGLES", "TRIANGLES"], ["TRIANGLE_FAN", "TRIANGLE_FAN"],
          ["TRIANGLE_STRIP", "TRIANGLE_STRIP"], ["QUADS", "QUADS"], ["QUAD_STRIP", "QUAD_STRIP"]
        ]), "MODE"
      );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_end_shape"] = {
    init: function () {
      this.appendDummyInput().appendField("endShape").appendField(
        new Blockly.FieldDropdown([["CLOSE", "CLOSE"], ["open", "null"]]), "MODE"
      );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_vertex"] = {
    init: function () {
      this.appendDummyInput().appendField("vertex");
      this.appendValueInput("X").setCheck("Number").appendField("x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_curve_vertex"] = {
    init: function () {
      this.appendDummyInput().appendField("curveVertex");
      this.appendValueInput("X").setCheck("Number").appendField("x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  // ============================================
  // COLOR - SETTING
  // ============================================

  Blockly.Blocks["p5_background"] = {
    init: function () {
      this.appendDummyInput().appendField("background")
        .appendField(FieldColour ? new FieldColour("#000000") : new Blockly.FieldTextInput("#000000"), "COLOR");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_background_value"] = {
    init: function () {
      this.appendValueInput("COLOR").appendField("background");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_fill"] = {
    init: function () {
      this.appendDummyInput().appendField("fill")
        .appendField(FieldColour ? new FieldColour("#ffffff") : new Blockly.FieldTextInput("#ffffff"), "COLOR");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_fill_value"] = {
    init: function () {
      this.appendValueInput("COLOR").appendField("fill");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_stroke"] = {
    init: function () {
      this.appendDummyInput().appendField("stroke")
        .appendField(FieldColour ? new FieldColour("#ffffff") : new Blockly.FieldTextInput("#ffffff"), "COLOR");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_stroke_value"] = {
    init: function () {
      this.appendValueInput("COLOR").appendField("stroke");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_no_fill"] = {
    init: function () {
      this.appendDummyInput().appendField("noFill");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_no_stroke"] = {
    init: function () {
      this.appendDummyInput().appendField("noStroke");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_clear"] = {
    init: function () {
      this.appendDummyInput().appendField("clear");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_color_mode"] = {
    init: function () {
      this.appendDummyInput().appendField("colorMode").appendField(
        new Blockly.FieldDropdown([["RGB", "RGB"], ["HSB", "HSB"], ["HSL", "HSL"]]), "MODE"
      );
      this.appendValueInput("MAX").setCheck("Number").appendField("max");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  // Import additional blocks
  defineColorBlocks(Blockly);
  defineAttributeBlocks(Blockly);
  defineTransformBlocks(Blockly);
  defineInputBlocks(Blockly);
  defineTextBlocks(Blockly);
  defineMathBlocks(Blockly);
  defineConstantBlocks(Blockly);
}

function defineColorBlocks(Blockly: typeof import("blockly")) {
  Blockly.Blocks["p5_color"] = {
    init: function () {
      this.appendDummyInput().appendField("color");
      this.appendValueInput("R").setCheck("Number").appendField("r");
      this.appendValueInput("G").setCheck("Number").appendField("g");
      this.appendValueInput("B").setCheck("Number").appendField("b");
      this.appendValueInput("A").setCheck("Number").appendField("a");
      this.setInputsInline(true);
      this.setOutput(true, "Colour");
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_lerp_color"] = {
    init: function () {
      this.appendValueInput("C1").appendField("lerpColor c1");
      this.appendValueInput("C2").appendField("c2");
      this.appendValueInput("AMT").setCheck("Number").appendField("amt");
      this.setInputsInline(true);
      this.setOutput(true, "Colour");
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_red"] = {
    init: function () {
      this.appendValueInput("COLOR").appendField("red");
      this.setOutput(true, "Number");
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_green"] = {
    init: function () {
      this.appendValueInput("COLOR").appendField("green");
      this.setOutput(true, "Number");
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_blue"] = {
    init: function () {
      this.appendValueInput("COLOR").appendField("blue");
      this.setOutput(true, "Number");
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_alpha"] = {
    init: function () {
      this.appendValueInput("COLOR").appendField("alpha");
      this.setOutput(true, "Number");
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_hue"] = {
    init: function () {
      this.appendValueInput("COLOR").appendField("hue");
      this.setOutput(true, "Number");
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_saturation"] = {
    init: function () {
      this.appendValueInput("COLOR").appendField("saturation");
      this.setOutput(true, "Number");
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_brightness"] = {
    init: function () {
      this.appendValueInput("COLOR").appendField("brightness");
      this.setOutput(true, "Number");
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_lightness"] = {
    init: function () {
      this.appendValueInput("COLOR").appendField("lightness");
      this.setOutput(true, "Number");
      this.setColour(20);
    },
  };
}

function defineAttributeBlocks(Blockly: typeof import("blockly")) {
  Blockly.Blocks["p5_stroke_weight"] = {
    init: function () {
      this.appendValueInput("WEIGHT").setCheck("Number").appendField("strokeWeight");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_stroke_cap"] = {
    init: function () {
      this.appendDummyInput().appendField("strokeCap").appendField(
        new Blockly.FieldDropdown([["ROUND", "ROUND"], ["SQUARE", "SQUARE"], ["PROJECT", "PROJECT"]]), "CAP"
      );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_stroke_join"] = {
    init: function () {
      this.appendDummyInput().appendField("strokeJoin").appendField(
        new Blockly.FieldDropdown([["MITER", "MITER"], ["BEVEL", "BEVEL"], ["ROUND", "ROUND"]]), "JOIN"
      );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };

  Blockly.Blocks["p5_rect_mode"] = {
    init: function () {
      this.appendDummyInput().appendField("rectMode").appendField(
        new Blockly.FieldDropdown([
          ["CORNER", "CORNER"], ["CORNERS", "CORNERS"], ["CENTER", "CENTER"], ["RADIUS", "RADIUS"]
        ]), "MODE"
      );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_ellipse_mode"] = {
    init: function () {
      this.appendDummyInput().appendField("ellipseMode").appendField(
        new Blockly.FieldDropdown([
          ["CENTER", "CENTER"], ["RADIUS", "RADIUS"], ["CORNER", "CORNER"], ["CORNERS", "CORNERS"]
        ]), "MODE"
      );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_smooth"] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([["smooth", "smooth"], ["noSmooth", "noSmooth"]]), "MODE"
      );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_blend_mode"] = {
    init: function () {
      this.appendDummyInput().appendField("blendMode").appendField(
        new Blockly.FieldDropdown([
          ["ADD", "ADD"], ["DARKEST", "DARKEST"], ["LIGHTEST", "LIGHTEST"],
          ["DIFFERENCE", "DIFFERENCE"], ["MULTIPLY", "MULTIPLY"], ["SCREEN", "SCREEN"],
          ["REPLACE", "REPLACE"], ["OVERLAY", "OVERLAY"]
        ]), "MODE"
      );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };
}

function defineTransformBlocks(Blockly: typeof import("blockly")) {
  Blockly.Blocks["p5_translate"] = {
    init: function () {
      this.appendDummyInput().appendField("translate");
      this.appendValueInput("X").setCheck("Number").appendField("x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
    },
  };

  Blockly.Blocks["p5_rotate"] = {
    init: function () {
      this.appendValueInput("ANGLE").setCheck("Number").appendField("rotate");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
    },
  };

  Blockly.Blocks["p5_scale"] = {
    init: function () {
      this.appendDummyInput().appendField("scale");
      this.appendValueInput("S").setCheck("Number").appendField("s");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
    },
  };

  Blockly.Blocks["p5_shear_x"] = {
    init: function () {
      this.appendValueInput("ANGLE").setCheck("Number").appendField("shearX");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
    },
  };

  Blockly.Blocks["p5_shear_y"] = {
    init: function () {
      this.appendValueInput("ANGLE").setCheck("Number").appendField("shearY");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
    },
  };

  Blockly.Blocks["p5_push"] = {
    init: function () {
      this.appendDummyInput().appendField("push");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
    },
  };

  Blockly.Blocks["p5_pop"] = {
    init: function () {
      this.appendDummyInput().appendField("pop");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
    },
  };

  Blockly.Blocks["p5_reset_matrix"] = {
    init: function () {
      this.appendDummyInput().appendField("resetMatrix");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
    },
  };
}

function defineInputBlocks(Blockly: typeof import("blockly")) {
  // Mouse
  Blockly.Blocks["p5_mouse_x"] = {
    init: function () {
      this.appendDummyInput().appendField("mouseX");
      this.setOutput(true, "Number");
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_mouse_y"] = {
    init: function () {
      this.appendDummyInput().appendField("mouseY");
      this.setOutput(true, "Number");
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_pmouse_x"] = {
    init: function () {
      this.appendDummyInput().appendField("pmouseX");
      this.setOutput(true, "Number");
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_pmouse_y"] = {
    init: function () {
      this.appendDummyInput().appendField("pmouseY");
      this.setOutput(true, "Number");
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_mouse_is_pressed"] = {
    init: function () {
      this.appendDummyInput().appendField("mouseIsPressed");
      this.setOutput(true, "Boolean");
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_mouse_button"] = {
    init: function () {
      this.appendDummyInput().appendField("mouseButton");
      this.setOutput(true, "String");
      this.setColour(30);
    },
  };

  // Mouse Events
  Blockly.Blocks["p5_mouse_pressed_event"] = {
    init: function () {
      this.appendDummyInput().appendField("mousePressed");
      this.appendStatementInput("STATEMENTS").setCheck(null);
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_mouse_released_event"] = {
    init: function () {
      this.appendDummyInput().appendField("mouseReleased");
      this.appendStatementInput("STATEMENTS").setCheck(null);
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_mouse_clicked_event"] = {
    init: function () {
      this.appendDummyInput().appendField("mouseClicked");
      this.appendStatementInput("STATEMENTS").setCheck(null);
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_mouse_moved_event"] = {
    init: function () {
      this.appendDummyInput().appendField("mouseMoved");
      this.appendStatementInput("STATEMENTS").setCheck(null);
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_mouse_dragged_event"] = {
    init: function () {
      this.appendDummyInput().appendField("mouseDragged");
      this.appendStatementInput("STATEMENTS").setCheck(null);
      this.setColour(30);
    },
  };

  // Keyboard
  Blockly.Blocks["p5_key"] = {
    init: function () {
      this.appendDummyInput().appendField("key");
      this.setOutput(true, "String");
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_key_code"] = {
    init: function () {
      this.appendDummyInput().appendField("keyCode");
      this.setOutput(true, "Number");
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_key_is_pressed"] = {
    init: function () {
      this.appendDummyInput().appendField("keyIsPressed");
      this.setOutput(true, "Boolean");
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_key_is_down"] = {
    init: function () {
      this.appendValueInput("CODE").setCheck("Number").appendField("keyIsDown");
      this.setOutput(true, "Boolean");
      this.setColour(30);
    },
  };

  // Keyboard Events
  Blockly.Blocks["p5_key_pressed_event"] = {
    init: function () {
      this.appendDummyInput().appendField("keyPressed");
      this.appendStatementInput("STATEMENTS").setCheck(null);
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_key_released_event"] = {
    init: function () {
      this.appendDummyInput().appendField("keyReleased");
      this.appendStatementInput("STATEMENTS").setCheck(null);
      this.setColour(30);
    },
  };

  Blockly.Blocks["p5_key_typed_event"] = {
    init: function () {
      this.appendDummyInput().appendField("keyTyped");
      this.appendStatementInput("STATEMENTS").setCheck(null);
      this.setColour(30);
    },
  };
}

function defineTextBlocks(Blockly: typeof import("blockly")) {
  Blockly.Blocks["p5_text"] = {
    init: function () {
      this.appendValueInput("STR").setCheck("String").appendField("text");
      this.appendValueInput("X").setCheck("Number").appendField("x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_text_size"] = {
    init: function () {
      this.appendValueInput("SIZE").setCheck("Number").appendField("textSize");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_text_align"] = {
    init: function () {
      this.appendDummyInput().appendField("textAlign")
        .appendField(new Blockly.FieldDropdown([["LEFT", "LEFT"], ["CENTER", "CENTER"], ["RIGHT", "RIGHT"]]), "HORIZ")
        .appendField(new Blockly.FieldDropdown([["TOP", "TOP"], ["BOTTOM", "BOTTOM"], ["CENTER", "CENTER"], ["BASELINE", "BASELINE"]]), "VERT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_text_style"] = {
    init: function () {
      this.appendDummyInput().appendField("textStyle").appendField(
        new Blockly.FieldDropdown([["NORMAL", "NORMAL"], ["ITALIC", "ITALIC"], ["BOLD", "BOLD"], ["BOLDITALIC", "BOLDITALIC"]]), "STYLE"
      );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_text_width"] = {
    init: function () {
      this.appendValueInput("STR").setCheck("String").appendField("textWidth");
      this.setOutput(true, "Number");
      this.setColour(160);
    },
  };

  Blockly.Blocks["p5_text_leading"] = {
    init: function () {
      this.appendValueInput("LEADING").setCheck("Number").appendField("textLeading");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
    },
  };
}

function defineMathBlocks(Blockly: typeof import("blockly")) {
  Blockly.Blocks["p5_dist"] = {
    init: function () {
      this.appendDummyInput().appendField("dist");
      this.appendValueInput("X1").setCheck("Number").appendField("x1");
      this.appendValueInput("Y1").setCheck("Number").appendField("y1");
      this.appendValueInput("X2").setCheck("Number").appendField("x2");
      this.appendValueInput("Y2").setCheck("Number").appendField("y2");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_lerp"] = {
    init: function () {
      this.appendValueInput("START").setCheck("Number").appendField("lerp start");
      this.appendValueInput("STOP").setCheck("Number").appendField("stop");
      this.appendValueInput("AMT").setCheck("Number").appendField("amt");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_constrain"] = {
    init: function () {
      this.appendValueInput("N").setCheck("Number").appendField("constrain n");
      this.appendValueInput("LOW").setCheck("Number").appendField("low");
      this.appendValueInput("HIGH").setCheck("Number").appendField("high");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_map"] = {
    init: function () {
      this.appendValueInput("VALUE").setCheck("Number").appendField("map value");
      this.appendValueInput("START1").setCheck("Number").appendField("start1");
      this.appendValueInput("STOP1").setCheck("Number").appendField("stop1");
      this.appendValueInput("START2").setCheck("Number").appendField("start2");
      this.appendValueInput("STOP2").setCheck("Number").appendField("stop2");
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_mag"] = {
    init: function () {
      this.appendValueInput("A").setCheck("Number").appendField("mag a");
      this.appendValueInput("B").setCheck("Number").appendField("b");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_random"] = {
    init: function () {
      this.appendValueInput("MIN").setCheck("Number").appendField("random min");
      this.appendValueInput("MAX").setCheck("Number").appendField("max");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_noise"] = {
    init: function () {
      this.appendValueInput("X").setCheck("Number").appendField("noise x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_radians"] = {
    init: function () {
      this.appendValueInput("DEG").setCheck("Number").appendField("radians");
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_degrees"] = {
    init: function () {
      this.appendValueInput("RAD").setCheck("Number").appendField("degrees");
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_sin"] = {
    init: function () {
      this.appendValueInput("ANGLE").setCheck("Number").appendField("sin");
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_cos"] = {
    init: function () {
      this.appendValueInput("ANGLE").setCheck("Number").appendField("cos");
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_tan"] = {
    init: function () {
      this.appendValueInput("ANGLE").setCheck("Number").appendField("tan");
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  Blockly.Blocks["p5_atan2"] = {
    init: function () {
      this.appendValueInput("Y").setCheck("Number").appendField("atan2 y");
      this.appendValueInput("X").setCheck("Number").appendField("x");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };
}

function defineConstantBlocks(Blockly: typeof import("blockly")) {
  Blockly.Blocks["p5_constant"] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ["PI", "PI"], ["TWO_PI", "TWO_PI"], ["HALF_PI", "HALF_PI"],
          ["QUARTER_PI", "QUARTER_PI"], ["TAU", "TAU"]
        ]), "CONST"
      );
      this.setOutput(true, "Number");
      this.setColour(230);
    },
  };

  // Create vector
  Blockly.Blocks["p5_create_vector"] = {
    init: function () {
      this.appendValueInput("X").setCheck("Number").appendField("createVector x");
      this.appendValueInput("Y").setCheck("Number").appendField("y");
      this.appendValueInput("Z").setCheck("Number").appendField("z");
      this.setInputsInline(true);
      this.setOutput(true, "Vector");
      this.setColour(260);
    },
  };

  Blockly.Blocks["p5_vector_get"] = {
    init: function () {
      this.appendValueInput("VEC").setCheck("Vector").appendField("get");
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([["x", "x"], ["y", "y"], ["z", "z"]]), "PROP"
      );
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(260);
    },
  };
}
