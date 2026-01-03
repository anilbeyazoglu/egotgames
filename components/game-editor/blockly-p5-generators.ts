/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * p5.js Code Generators for Blockly
 * Generates JavaScript code from p5.js blocks
 */

export function defineP5Generators(javascriptGenerator: any) {
  const Order = javascriptGenerator.Order || {
    ATOMIC: 0,
    NONE: 99,
    FUNCTION_CALL: 2,
  };

  // ============================================
  // GAME SETUP
  // ============================================

  javascriptGenerator.forBlock["p5_setup"] = function (block: any) {
    const statements = javascriptGenerator.statementToCode(block, "STATEMENTS");
    return `function setup() {\n${statements}}\n`;
  };

  javascriptGenerator.forBlock["p5_draw"] = function (block: any) {
    const statements = javascriptGenerator.statementToCode(block, "STATEMENTS");
    return `function draw() {\n${statements}}\n`;
  };

  javascriptGenerator.forBlock["p5_create_canvas"] = function (block: any) {
    const width = javascriptGenerator.valueToCode(block, "WIDTH", Order.ATOMIC) || "400";
    const height = javascriptGenerator.valueToCode(block, "HEIGHT", Order.ATOMIC) || "400";
    return `createCanvas(${width}, ${height});\n`;
  };

  // ============================================
  // ENVIRONMENT / SYSTEM VARIABLES
  // ============================================

  javascriptGenerator.forBlock["p5_width"] = function () {
    return ["width", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_height"] = function () {
    return ["height", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_frame_count"] = function () {
    return ["frameCount", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_delta_time"] = function () {
    return ["deltaTime", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_frame_rate_get"] = function () {
    return ["frameRate()", Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_frame_rate_set"] = function (block: any) {
    const rate = javascriptGenerator.valueToCode(block, "RATE", Order.ATOMIC) || "60";
    return `frameRate(${rate});\n`;
  };

  javascriptGenerator.forBlock["p5_no_loop"] = function (block: any) {
    const mode = block.getFieldValue("MODE");
    return `${mode}();\n`;
  };

  javascriptGenerator.forBlock["p5_redraw"] = function () {
    return "redraw();\n";
  };

  // ============================================
  // 2D PRIMITIVES - SHAPES
  // ============================================

  javascriptGenerator.forBlock["p5_point"] = function (block: any) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    return `point(${x}, ${y});\n`;
  };

  javascriptGenerator.forBlock["p5_line"] = function (block: any) {
    const x1 = javascriptGenerator.valueToCode(block, "X1", Order.ATOMIC) || "0";
    const y1 = javascriptGenerator.valueToCode(block, "Y1", Order.ATOMIC) || "0";
    const x2 = javascriptGenerator.valueToCode(block, "X2", Order.ATOMIC) || "0";
    const y2 = javascriptGenerator.valueToCode(block, "Y2", Order.ATOMIC) || "0";
    return `line(${x1}, ${y1}, ${x2}, ${y2});\n`;
  };

  javascriptGenerator.forBlock["p5_rect"] = function (block: any) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    const w = javascriptGenerator.valueToCode(block, "W", Order.ATOMIC) || "50";
    const h = javascriptGenerator.valueToCode(block, "H", Order.ATOMIC) || "50";
    return `rect(${x}, ${y}, ${w}, ${h});\n`;
  };

  javascriptGenerator.forBlock["p5_square"] = function (block: any) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    const s = javascriptGenerator.valueToCode(block, "S", Order.ATOMIC) || "50";
    return `square(${x}, ${y}, ${s});\n`;
  };

  javascriptGenerator.forBlock["p5_ellipse"] = function (block: any) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    const w = javascriptGenerator.valueToCode(block, "W", Order.ATOMIC) || "50";
    const h = javascriptGenerator.valueToCode(block, "H", Order.ATOMIC) || "50";
    return `ellipse(${x}, ${y}, ${w}, ${h});\n`;
  };

  javascriptGenerator.forBlock["p5_circle"] = function (block: any) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    const d = javascriptGenerator.valueToCode(block, "D", Order.ATOMIC) || "50";
    return `circle(${x}, ${y}, ${d});\n`;
  };

  javascriptGenerator.forBlock["p5_triangle"] = function (block: any) {
    const x1 = javascriptGenerator.valueToCode(block, "X1", Order.ATOMIC) || "0";
    const y1 = javascriptGenerator.valueToCode(block, "Y1", Order.ATOMIC) || "0";
    const x2 = javascriptGenerator.valueToCode(block, "X2", Order.ATOMIC) || "0";
    const y2 = javascriptGenerator.valueToCode(block, "Y2", Order.ATOMIC) || "0";
    const x3 = javascriptGenerator.valueToCode(block, "X3", Order.ATOMIC) || "0";
    const y3 = javascriptGenerator.valueToCode(block, "Y3", Order.ATOMIC) || "0";
    return `triangle(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3});\n`;
  };

  javascriptGenerator.forBlock["p5_quad"] = function (block: any) {
    const x1 = javascriptGenerator.valueToCode(block, "X1", Order.ATOMIC) || "0";
    const y1 = javascriptGenerator.valueToCode(block, "Y1", Order.ATOMIC) || "0";
    const x2 = javascriptGenerator.valueToCode(block, "X2", Order.ATOMIC) || "0";
    const y2 = javascriptGenerator.valueToCode(block, "Y2", Order.ATOMIC) || "0";
    const x3 = javascriptGenerator.valueToCode(block, "X3", Order.ATOMIC) || "0";
    const y3 = javascriptGenerator.valueToCode(block, "Y3", Order.ATOMIC) || "0";
    const x4 = javascriptGenerator.valueToCode(block, "X4", Order.ATOMIC) || "0";
    const y4 = javascriptGenerator.valueToCode(block, "Y4", Order.ATOMIC) || "0";
    return `quad(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3}, ${x4}, ${y4});\n`;
  };

  javascriptGenerator.forBlock["p5_arc"] = function (block: any) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    const w = javascriptGenerator.valueToCode(block, "W", Order.ATOMIC) || "50";
    const h = javascriptGenerator.valueToCode(block, "H", Order.ATOMIC) || "50";
    const start = javascriptGenerator.valueToCode(block, "START", Order.ATOMIC) || "0";
    const stop = javascriptGenerator.valueToCode(block, "STOP", Order.ATOMIC) || "PI";
    const mode = block.getFieldValue("MODE");
    return `arc(${x}, ${y}, ${w}, ${h}, ${start}, ${stop}, ${mode});\n`;
  };

  // ============================================
  // CURVES
  // ============================================

  javascriptGenerator.forBlock["p5_bezier"] = function (block: any) {
    const x1 = javascriptGenerator.valueToCode(block, "X1", Order.ATOMIC) || "0";
    const y1 = javascriptGenerator.valueToCode(block, "Y1", Order.ATOMIC) || "0";
    const x2 = javascriptGenerator.valueToCode(block, "X2", Order.ATOMIC) || "0";
    const y2 = javascriptGenerator.valueToCode(block, "Y2", Order.ATOMIC) || "0";
    const x3 = javascriptGenerator.valueToCode(block, "X3", Order.ATOMIC) || "0";
    const y3 = javascriptGenerator.valueToCode(block, "Y3", Order.ATOMIC) || "0";
    const x4 = javascriptGenerator.valueToCode(block, "X4", Order.ATOMIC) || "0";
    const y4 = javascriptGenerator.valueToCode(block, "Y4", Order.ATOMIC) || "0";
    return `bezier(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3}, ${x4}, ${y4});\n`;
  };

  javascriptGenerator.forBlock["p5_curve"] = function (block: any) {
    const x1 = javascriptGenerator.valueToCode(block, "X1", Order.ATOMIC) || "0";
    const y1 = javascriptGenerator.valueToCode(block, "Y1", Order.ATOMIC) || "0";
    const x2 = javascriptGenerator.valueToCode(block, "X2", Order.ATOMIC) || "0";
    const y2 = javascriptGenerator.valueToCode(block, "Y2", Order.ATOMIC) || "0";
    const x3 = javascriptGenerator.valueToCode(block, "X3", Order.ATOMIC) || "0";
    const y3 = javascriptGenerator.valueToCode(block, "Y3", Order.ATOMIC) || "0";
    const x4 = javascriptGenerator.valueToCode(block, "X4", Order.ATOMIC) || "0";
    const y4 = javascriptGenerator.valueToCode(block, "Y4", Order.ATOMIC) || "0";
    return `curve(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3}, ${x4}, ${y4});\n`;
  };

  // ============================================
  // VERTEX / CUSTOM SHAPES
  // ============================================

  javascriptGenerator.forBlock["p5_begin_shape"] = function (block: any) {
    const mode = block.getFieldValue("MODE");
    return mode === "null" ? "beginShape();\n" : `beginShape(${mode});\n`;
  };

  javascriptGenerator.forBlock["p5_end_shape"] = function (block: any) {
    const mode = block.getFieldValue("MODE");
    return mode === "null" ? "endShape();\n" : `endShape(${mode});\n`;
  };

  javascriptGenerator.forBlock["p5_vertex"] = function (block: any) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    return `vertex(${x}, ${y});\n`;
  };

  javascriptGenerator.forBlock["p5_curve_vertex"] = function (block: any) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    return `curveVertex(${x}, ${y});\n`;
  };

  // ============================================
  // COLOR - SETTING
  // ============================================

  javascriptGenerator.forBlock["p5_background"] = function (block: any) {
    const color = block.getFieldValue("COLOR");
    return `background('${color}');\n`;
  };

  javascriptGenerator.forBlock["p5_background_value"] = function (block: any) {
    const color = javascriptGenerator.valueToCode(block, "COLOR", Order.ATOMIC) || "'#000000'";
    return `background(${color});\n`;
  };

  javascriptGenerator.forBlock["p5_fill"] = function (block: any) {
    const color = block.getFieldValue("COLOR");
    return `fill('${color}');\n`;
  };

  javascriptGenerator.forBlock["p5_fill_value"] = function (block: any) {
    const color = javascriptGenerator.valueToCode(block, "COLOR", Order.ATOMIC) || "'#ffffff'";
    return `fill(${color});\n`;
  };

  javascriptGenerator.forBlock["p5_stroke"] = function (block: any) {
    const color = block.getFieldValue("COLOR");
    return `stroke('${color}');\n`;
  };

  javascriptGenerator.forBlock["p5_stroke_value"] = function (block: any) {
    const color = javascriptGenerator.valueToCode(block, "COLOR", Order.ATOMIC) || "'#ffffff'";
    return `stroke(${color});\n`;
  };

  javascriptGenerator.forBlock["p5_no_fill"] = function () {
    return "noFill();\n";
  };

  javascriptGenerator.forBlock["p5_no_stroke"] = function () {
    return "noStroke();\n";
  };

  javascriptGenerator.forBlock["p5_clear"] = function () {
    return "clear();\n";
  };

  javascriptGenerator.forBlock["p5_color_mode"] = function (block: any) {
    const mode = block.getFieldValue("MODE");
    const max = javascriptGenerator.valueToCode(block, "MAX", Order.ATOMIC) || "255";
    return `colorMode(${mode}, ${max});\n`;
  };

  // ============================================
  // COLOR - CREATING & EXTRACTING
  // ============================================

  javascriptGenerator.forBlock["p5_color"] = function (block: any) {
    const r = javascriptGenerator.valueToCode(block, "R", Order.ATOMIC) || "255";
    const g = javascriptGenerator.valueToCode(block, "G", Order.ATOMIC) || "255";
    const b = javascriptGenerator.valueToCode(block, "B", Order.ATOMIC) || "255";
    const a = javascriptGenerator.valueToCode(block, "A", Order.ATOMIC) || "255";
    return [`color(${r}, ${g}, ${b}, ${a})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_lerp_color"] = function (block: any) {
    const c1 = javascriptGenerator.valueToCode(block, "C1", Order.ATOMIC) || "color(0)";
    const c2 = javascriptGenerator.valueToCode(block, "C2", Order.ATOMIC) || "color(255)";
    const amt = javascriptGenerator.valueToCode(block, "AMT", Order.ATOMIC) || "0.5";
    return [`lerpColor(${c1}, ${c2}, ${amt})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_red"] = function (block: any) {
    const color = javascriptGenerator.valueToCode(block, "COLOR", Order.ATOMIC) || "color(0)";
    return [`red(${color})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_green"] = function (block: any) {
    const color = javascriptGenerator.valueToCode(block, "COLOR", Order.ATOMIC) || "color(0)";
    return [`green(${color})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_blue"] = function (block: any) {
    const color = javascriptGenerator.valueToCode(block, "COLOR", Order.ATOMIC) || "color(0)";
    return [`blue(${color})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_alpha"] = function (block: any) {
    const color = javascriptGenerator.valueToCode(block, "COLOR", Order.ATOMIC) || "color(0)";
    return [`alpha(${color})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_hue"] = function (block: any) {
    const color = javascriptGenerator.valueToCode(block, "COLOR", Order.ATOMIC) || "color(0)";
    return [`hue(${color})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_saturation"] = function (block: any) {
    const color = javascriptGenerator.valueToCode(block, "COLOR", Order.ATOMIC) || "color(0)";
    return [`saturation(${color})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_brightness"] = function (block: any) {
    const color = javascriptGenerator.valueToCode(block, "COLOR", Order.ATOMIC) || "color(0)";
    return [`brightness(${color})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_lightness"] = function (block: any) {
    const color = javascriptGenerator.valueToCode(block, "COLOR", Order.ATOMIC) || "color(0)";
    return [`lightness(${color})`, Order.FUNCTION_CALL];
  };

  // ============================================
  // ATTRIBUTES
  // ============================================

  javascriptGenerator.forBlock["p5_stroke_weight"] = function (block: any) {
    const weight = javascriptGenerator.valueToCode(block, "WEIGHT", Order.ATOMIC) || "1";
    return `strokeWeight(${weight});\n`;
  };

  javascriptGenerator.forBlock["p5_stroke_cap"] = function (block: any) {
    const cap = block.getFieldValue("CAP");
    return `strokeCap(${cap});\n`;
  };

  javascriptGenerator.forBlock["p5_stroke_join"] = function (block: any) {
    const join = block.getFieldValue("JOIN");
    return `strokeJoin(${join});\n`;
  };

  javascriptGenerator.forBlock["p5_rect_mode"] = function (block: any) {
    const mode = block.getFieldValue("MODE");
    return `rectMode(${mode});\n`;
  };

  javascriptGenerator.forBlock["p5_ellipse_mode"] = function (block: any) {
    const mode = block.getFieldValue("MODE");
    return `ellipseMode(${mode});\n`;
  };

  javascriptGenerator.forBlock["p5_smooth"] = function (block: any) {
    const mode = block.getFieldValue("MODE");
    return `${mode}();\n`;
  };

  javascriptGenerator.forBlock["p5_blend_mode"] = function (block: any) {
    const mode = block.getFieldValue("MODE");
    return `blendMode(${mode});\n`;
  };

  // ============================================
  // TRANSFORM
  // ============================================

  javascriptGenerator.forBlock["p5_translate"] = function (block: any) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    return `translate(${x}, ${y});\n`;
  };

  javascriptGenerator.forBlock["p5_rotate"] = function (block: any) {
    const angle = javascriptGenerator.valueToCode(block, "ANGLE", Order.ATOMIC) || "0";
    return `rotate(${angle});\n`;
  };

  javascriptGenerator.forBlock["p5_scale"] = function (block: any) {
    const s = javascriptGenerator.valueToCode(block, "S", Order.ATOMIC) || "1";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC);
    return y ? `scale(${s}, ${y});\n` : `scale(${s});\n`;
  };

  javascriptGenerator.forBlock["p5_shear_x"] = function (block: any) {
    const angle = javascriptGenerator.valueToCode(block, "ANGLE", Order.ATOMIC) || "0";
    return `shearX(${angle});\n`;
  };

  javascriptGenerator.forBlock["p5_shear_y"] = function (block: any) {
    const angle = javascriptGenerator.valueToCode(block, "ANGLE", Order.ATOMIC) || "0";
    return `shearY(${angle});\n`;
  };

  javascriptGenerator.forBlock["p5_push"] = function () {
    return "push();\n";
  };

  javascriptGenerator.forBlock["p5_pop"] = function () {
    return "pop();\n";
  };

  javascriptGenerator.forBlock["p5_reset_matrix"] = function () {
    return "resetMatrix();\n";
  };

  // ============================================
  // MOUSE INPUT
  // ============================================

  javascriptGenerator.forBlock["p5_mouse_x"] = function () {
    return ["mouseX", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_mouse_y"] = function () {
    return ["mouseY", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_pmouse_x"] = function () {
    return ["pmouseX", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_pmouse_y"] = function () {
    return ["pmouseY", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_mouse_is_pressed"] = function () {
    return ["mouseIsPressed", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_mouse_button"] = function () {
    return ["mouseButton", Order.ATOMIC];
  };

  // ============================================
  // MOUSE EVENTS
  // ============================================

  javascriptGenerator.forBlock["p5_mouse_pressed_event"] = function (block: any) {
    const statements = javascriptGenerator.statementToCode(block, "STATEMENTS");
    return `function mousePressed() {\n${statements}}\n`;
  };

  javascriptGenerator.forBlock["p5_mouse_released_event"] = function (block: any) {
    const statements = javascriptGenerator.statementToCode(block, "STATEMENTS");
    return `function mouseReleased() {\n${statements}}\n`;
  };

  javascriptGenerator.forBlock["p5_mouse_clicked_event"] = function (block: any) {
    const statements = javascriptGenerator.statementToCode(block, "STATEMENTS");
    return `function mouseClicked() {\n${statements}}\n`;
  };

  javascriptGenerator.forBlock["p5_mouse_moved_event"] = function (block: any) {
    const statements = javascriptGenerator.statementToCode(block, "STATEMENTS");
    return `function mouseMoved() {\n${statements}}\n`;
  };

  javascriptGenerator.forBlock["p5_mouse_dragged_event"] = function (block: any) {
    const statements = javascriptGenerator.statementToCode(block, "STATEMENTS");
    return `function mouseDragged() {\n${statements}}\n`;
  };

  // ============================================
  // KEYBOARD INPUT
  // ============================================

  javascriptGenerator.forBlock["p5_key"] = function () {
    return ["key", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_key_code"] = function () {
    return ["keyCode", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_key_is_pressed"] = function () {
    return ["keyIsPressed", Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_key_is_down"] = function (block: any) {
    const code = javascriptGenerator.valueToCode(block, "CODE", Order.ATOMIC) || "0";
    return [`keyIsDown(${code})`, Order.FUNCTION_CALL];
  };

  // ============================================
  // KEYBOARD EVENTS
  // ============================================

  javascriptGenerator.forBlock["p5_key_pressed_event"] = function (block: any) {
    const statements = javascriptGenerator.statementToCode(block, "STATEMENTS");
    return `function keyPressed() {\n${statements}}\n`;
  };

  javascriptGenerator.forBlock["p5_key_released_event"] = function (block: any) {
    const statements = javascriptGenerator.statementToCode(block, "STATEMENTS");
    return `function keyReleased() {\n${statements}}\n`;
  };

  javascriptGenerator.forBlock["p5_key_typed_event"] = function (block: any) {
    const statements = javascriptGenerator.statementToCode(block, "STATEMENTS");
    return `function keyTyped() {\n${statements}}\n`;
  };

  // ============================================
  // TEXT
  // ============================================

  javascriptGenerator.forBlock["p5_text"] = function (block: any) {
    const str = javascriptGenerator.valueToCode(block, "STR", Order.ATOMIC) || "''";
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    return `text(${str}, ${x}, ${y});\n`;
  };

  javascriptGenerator.forBlock["p5_text_size"] = function (block: any) {
    const size = javascriptGenerator.valueToCode(block, "SIZE", Order.ATOMIC) || "12";
    return `textSize(${size});\n`;
  };

  javascriptGenerator.forBlock["p5_text_align"] = function (block: any) {
    const horiz = block.getFieldValue("HORIZ");
    const vert = block.getFieldValue("VERT");
    return `textAlign(${horiz}, ${vert});\n`;
  };

  javascriptGenerator.forBlock["p5_text_style"] = function (block: any) {
    const style = block.getFieldValue("STYLE");
    return `textStyle(${style});\n`;
  };

  javascriptGenerator.forBlock["p5_text_width"] = function (block: any) {
    const str = javascriptGenerator.valueToCode(block, "STR", Order.ATOMIC) || "''";
    return [`textWidth(${str})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_text_leading"] = function (block: any) {
    const leading = javascriptGenerator.valueToCode(block, "LEADING", Order.ATOMIC) || "15";
    return `textLeading(${leading});\n`;
  };

  // ============================================
  // MATH
  // ============================================

  javascriptGenerator.forBlock["p5_dist"] = function (block: any) {
    const x1 = javascriptGenerator.valueToCode(block, "X1", Order.ATOMIC) || "0";
    const y1 = javascriptGenerator.valueToCode(block, "Y1", Order.ATOMIC) || "0";
    const x2 = javascriptGenerator.valueToCode(block, "X2", Order.ATOMIC) || "0";
    const y2 = javascriptGenerator.valueToCode(block, "Y2", Order.ATOMIC) || "0";
    return [`dist(${x1}, ${y1}, ${x2}, ${y2})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_lerp"] = function (block: any) {
    const start = javascriptGenerator.valueToCode(block, "START", Order.ATOMIC) || "0";
    const stop = javascriptGenerator.valueToCode(block, "STOP", Order.ATOMIC) || "1";
    const amt = javascriptGenerator.valueToCode(block, "AMT", Order.ATOMIC) || "0.5";
    return [`lerp(${start}, ${stop}, ${amt})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_constrain"] = function (block: any) {
    const n = javascriptGenerator.valueToCode(block, "N", Order.ATOMIC) || "0";
    const low = javascriptGenerator.valueToCode(block, "LOW", Order.ATOMIC) || "0";
    const high = javascriptGenerator.valueToCode(block, "HIGH", Order.ATOMIC) || "100";
    return [`constrain(${n}, ${low}, ${high})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_map"] = function (block: any) {
    const value = javascriptGenerator.valueToCode(block, "VALUE", Order.ATOMIC) || "0";
    const start1 = javascriptGenerator.valueToCode(block, "START1", Order.ATOMIC) || "0";
    const stop1 = javascriptGenerator.valueToCode(block, "STOP1", Order.ATOMIC) || "1";
    const start2 = javascriptGenerator.valueToCode(block, "START2", Order.ATOMIC) || "0";
    const stop2 = javascriptGenerator.valueToCode(block, "STOP2", Order.ATOMIC) || "100";
    return [`map(${value}, ${start1}, ${stop1}, ${start2}, ${stop2})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_mag"] = function (block: any) {
    const a = javascriptGenerator.valueToCode(block, "A", Order.ATOMIC) || "0";
    const b = javascriptGenerator.valueToCode(block, "B", Order.ATOMIC) || "0";
    return [`mag(${a}, ${b})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_random"] = function (block: any) {
    const min = javascriptGenerator.valueToCode(block, "MIN", Order.ATOMIC) || "0";
    const max = javascriptGenerator.valueToCode(block, "MAX", Order.ATOMIC) || "1";
    return [`random(${min}, ${max})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_noise"] = function (block: any) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC);
    return y ? [`noise(${x}, ${y})`, Order.FUNCTION_CALL] : [`noise(${x})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_radians"] = function (block: any) {
    const deg = javascriptGenerator.valueToCode(block, "DEG", Order.ATOMIC) || "0";
    return [`radians(${deg})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_degrees"] = function (block: any) {
    const rad = javascriptGenerator.valueToCode(block, "RAD", Order.ATOMIC) || "0";
    return [`degrees(${rad})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_sin"] = function (block: any) {
    const angle = javascriptGenerator.valueToCode(block, "ANGLE", Order.ATOMIC) || "0";
    return [`sin(${angle})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_cos"] = function (block: any) {
    const angle = javascriptGenerator.valueToCode(block, "ANGLE", Order.ATOMIC) || "0";
    return [`cos(${angle})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_tan"] = function (block: any) {
    const angle = javascriptGenerator.valueToCode(block, "ANGLE", Order.ATOMIC) || "0";
    return [`tan(${angle})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_atan2"] = function (block: any) {
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "1";
    return [`atan2(${y}, ${x})`, Order.FUNCTION_CALL];
  };

  // ============================================
  // CONSTANTS & VECTORS
  // ============================================

  javascriptGenerator.forBlock["p5_constant"] = function (block: any) {
    const constant = block.getFieldValue("CONST");
    return [constant, Order.ATOMIC];
  };

  javascriptGenerator.forBlock["p5_create_vector"] = function (block: any) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || "0";
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || "0";
    const z = javascriptGenerator.valueToCode(block, "Z", Order.ATOMIC) || "0";
    return [`createVector(${x}, ${y}, ${z})`, Order.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock["p5_vector_get"] = function (block: any) {
    const vec = javascriptGenerator.valueToCode(block, "VEC", Order.ATOMIC) || "createVector()";
    const prop = block.getFieldValue("PROP");
    return [`${vec}.${prop}`, Order.ATOMIC];
  };
}
