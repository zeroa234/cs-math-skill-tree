"""宣传片开场 / 片尾的 3D 技能树（Blender 5.2，Eevee + 合成器 Bloom）。

几何全部来自 output/skilltree.json，不手摆：
- 节点 = 201 个技能。高度 = 第几步（第 1 步在最下面，往上长）；绕中轴按 13 条泳道分扇区（扇区大小按该泳道技能数），
  同一步、同一泳道的技能在扇区里均匀排开；每一步的半径按这一步的技能数开方，所以整体是个树冠的形状。
  球的大小按 reach（学完后能解锁的后续技能总数）开方。
- 连线 = 278 条必须前置，从前置往上弯到后续技能。
动画时刻读 src/promo/public/build/timeline.json（旁白时间轴），所以画面跟着旁白走：
- intro：cold + hook 两拍里按步骤一层层亮起、连线往上长，title 拍镜头拉远看全树；
- outro：说到“点亮你自己的技能树”时，从第 1 步起一层层变成“已点亮”的暖金色（页面深色模式的 --lit #f5c46a）。

用法（项目根目录）：
  blender -b --factory-startup -P scripts/promo/blender-tree.py -- --shot intro --out temp/promo/blender/intro [--samples 32] [--pct 100] [--frames 0,120,300]
--frames 只渲这几帧（试看用）；不给就渲整段。
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
FPS = 30


def hexc(h, a=1.0):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb], a)


def lighten(h, t):
    """sRGB 里往白色混 t（深色主题下领域色偏暗，发光前提一提）"""
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) for i in (0, 2, 4)]
    return "#" + "".join(f"{round(v + (255 - v) * t):02x}" for v in c)


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


# ── 数据与布局 ────────────────────────────────────────────
tree = json.loads((ROOT / "output/skilltree.json").read_text(encoding="utf-8"))
tl = json.loads((ROOT / "src/promo/public/build/timeline.json").read_text(encoding="utf-8"))
BEAT = {b["id"]: b for b in tl["beats"]}
skills = tree["skills"]
SK = {s["id"]: s for s in skills}
lanes = tree["lanes"]
LANE_COLOR = {l["id"]: lighten(l["color"], 0.12) for l in lanes}
GOLD = "#f5c46a"

STEP_H = 1.45
by_step = {}
for s in skills:
    by_step.setdefault(s["step"], []).append(s)
lane_total = {l["id"]: sum(1 for s in skills if s["lane"] == l["id"]) for l in lanes}
sector, a0 = {}, 0.0
for l in lanes:                       # 扇区按泳道顺序（数学三条挨着，后面是理论、程序、系统……）
    w = lane_total[l["id"]] / len(skills) * 2 * math.pi
    sector[l["id"]] = (a0, a0 + w)
    a0 += w
POS = {}
for st, group in by_step.items():
    r = 0.62 * math.sqrt(len(group)) + 0.15
    for lid in sector:
        mine = sorted((s for s in group if s["lane"] == lid), key=lambda s: s["y"])
        lo, hi = sector[lid]
        for i, s in enumerate(mine):
            a = lo + (hi - lo) * (i + 0.5) / len(mine)
            rr = r * (1.0 + (0.09 if i % 2 else -0.09) * (len(mine) > 2))
            POS[s["id"]] = Vector((math.cos(a) * rr, math.sin(a) * rr, (st - 1) * STEP_H))
EDGES = [(r["id"] if isinstance(r, dict) else r, s["id"]) for s in skills for r in s["required"]]
TOP = (max(by_step) - 1) * STEP_H


# ── 场景 ─────────────────────────────────────────────────
def setup(samples, pct):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, pct
    sc.render.fps = FPS
    sc.eevee.taa_render_samples = samples
    sc.view_settings.view_transform = "Standard"     # AgX 把亮的领域色洗成粉白，Standard 颜色更饱和（芯是白的、光晕带色）
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    wd = bpy.data.worlds.new("world")
    wd.use_nodes = True
    bg = wd.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = hexc("#06090f")
    bg.inputs["Strength"].default_value = 1.0
    sc.world = wd
    # 合成器：Bloom 辉光（Blender 5 的合成器是节点组，挂在 scene.compositing_node_group）
    ng = bpy.data.node_groups.new("comp", "CompositorNodeTree")
    ng.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    rl = ng.nodes.new("CompositorNodeRLayers")
    gl = ng.nodes.new("CompositorNodeGlare")
    gl.inputs["Type"].default_value = "Bloom"
    gl.inputs["Threshold"].default_value = 0.35
    gl.inputs["Strength"].default_value = 0.9
    gl.inputs["Size"].default_value = 0.85
    out = ng.nodes.new("NodeGroupOutput")
    ng.links.new(rl.outputs["Image"], gl.inputs["Image"])
    ng.links.new(gl.outputs["Image"], out.inputs[0])
    sc.compositing_node_group = ng
    sc.render.use_compositing = True
    return sc


def emissive_mat(name, strength):
    """颜色和亮度都从物体颜色（Object Info → Color / Alpha）取：每个物体自己打关键帧，几百个物体共用一个材质"""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    oi = nt.nodes.new("ShaderNodeObjectInfo")
    em = nt.nodes.new("ShaderNodeEmission")
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = strength
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(oi.outputs["Color"], em.inputs["Color"])
    nt.links.new(oi.outputs["Alpha"], mul.inputs[0])
    nt.links.new(mul.outputs[0], em.inputs["Strength"])
    nt.links.new(em.outputs[0], out.inputs["Surface"])
    return m


def key_color(ob, frame, hexcol, alpha):
    ob.color = hexc(hexcol, alpha)
    ob.keyframe_insert("color", frame=frame)


def jit(sid, n):
    """按 id 定的小错开（Python 内置的 hash 每个进程不同，渲染要可复现）"""
    return sum(map(ord, sid)) % n


def build_tree():
    node_mat, edge_mat = emissive_mat("node", 6.0), emissive_mat("edge", 2.2)
    obs = {}
    for s in skills:
        rad = 0.055 + 0.0115 * math.sqrt(s["reach"] + 1)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=rad, segments=20, ring_count=10, location=POS[s["id"]])
        ob = bpy.context.active_object
        ob.name = s["id"]
        bpy.ops.object.shade_smooth()
        ob.data.materials.append(node_mat)
        obs[s["id"]] = ob
    curves = []
    for a, b in EDGES:
        p0, p3 = POS[a], POS[b]
        dz = p3.z - p0.z
        cu = bpy.data.curves.new(f"e-{a}-{b}", "CURVE")
        cu.dimensions = "3D"
        cu.bevel_depth = 0.0105
        cu.bevel_resolution = 2
        cu.use_fill_caps = True
        cu.bevel_factor_mapping_end = "SPLINE"
        sp = cu.splines.new("BEZIER")
        sp.bezier_points.add(1)
        q0, q1 = sp.bezier_points
        q0.co, q1.co = p0, p3
        # 先往上走、再往外靠：像枝条往上抽
        q0.handle_right = p0 + Vector((0, 0, dz * 0.55))
        q0.handle_left = p0 - Vector((0, 0, dz * 0.2))
        q1.handle_left = p3 - Vector((0, 0, dz * 0.45))
        q1.handle_right = p3 + Vector((0, 0, dz * 0.2))
        ob = bpy.data.objects.new(cu.name, cu)
        bpy.context.scene.collection.objects.link(ob)
        cu.materials.append(edge_mat)
        curves.append((a, b, ob))
    # 远处的星点（呼应“知识星图”）：一个物体里几百个小球
    import random
    rnd = random.Random(7)
    star_mat = emissive_mat("star", 2.2)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=1, subdivisions=1)
    proto = bpy.context.active_object
    me = proto.data
    import bmesh
    bm = bmesh.new()
    for _ in range(420):
        d = Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 0.6))).normalized() * rnd.uniform(38, 60)
        d.z += 4
        r = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=rnd.uniform(0.04, 0.12))
        bmesh.ops.translate(bm, vec=d, verts=r["verts"])
    bm.to_mesh(me)
    bm.free()
    proto.name = "stars"
    proto.data.materials.append(star_mat)
    proto.color = hexc("#9fb6e0", 1.0)
    # 树根下一圈很淡的地面光
    bpy.ops.mesh.primitive_circle_add(vertices=96, radius=3.2, fill_type="NGON", location=(0, 0, -0.35))
    ground = bpy.context.active_object
    gm = bpy.data.materials.new("ground")
    gm.use_nodes = True
    nt = gm.node_tree
    nt.nodes.clear()
    tc = nt.nodes.new("ShaderNodeTexCoord")
    grad = nt.nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = "SPHERICAL"
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / 3.2, 1 / 3.2, 1)
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = hexc("#2b4b86")
    em = nt.nodes.new("ShaderNodeEmission")
    oi = nt.nodes.new("ShaderNodeObjectInfo")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], grad.inputs["Vector"])
    nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
    nt.links.new(oi.outputs["Alpha"], em.inputs["Strength"])
    nt.links.new(em.outputs[0], out.inputs["Surface"])
    ground.data.materials.append(gm)
    return obs, curves, proto, ground


def camera(path, target_path, lens=35):
    """path / target_path：[(帧, (x, y, z)), ...]，Bezier 关键帧，起止自然缓动"""
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = lens
    cam_data.dof.use_dof = True
    cam_data.dof.aperture_fstop = 3.2
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    tgt = bpy.data.objects.new("target", None)
    bpy.context.scene.collection.objects.link(tgt)
    for f, p in path:
        cam.location = p
        cam.keyframe_insert("location", frame=f)
    for f, p in target_path:
        tgt.location = p
        tgt.keyframe_insert("location", frame=f)
    c = cam.constraints.new("TRACK_TO")
    c.target = tgt
    c.track_axis, c.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
    cam_data.dof.focus_object = tgt
    bpy.context.scene.camera = cam
    return cam


def side(ang_deg, z, d):
    """镜头在 ang_deg 方位时，把注视点往镜头的左手边挪 d：树就落在画面右边"""
    a = math.radians(ang_deg)          # 镜头朝向 (-cos a, -sin a, 0)，右手边 (-sin a, cos a, 0)，左手边取反
    return (math.sin(a) * d, -math.cos(a) * d, z)


def orbit(f, r, ang_deg, z):
    a = math.radians(ang_deg)
    return (f, (math.cos(a) * r, math.sin(a) * r, z))


# ── 两个镜头 ─────────────────────────────────────────────
def shot_intro(obs, curves, stars, ground):
    end = BEAT["title"]["end"]                       # 开场到 title 拍结束（帧号就是成片里的帧号，从 0 开始）
    hook_end = BEAT["hook"]["speech"][-1]["end"]
    t_step = {st: round(14 + (hook_end - 30) * (st - 1) / 6) for st in range(1, 8)}   # 第 1 步 14 帧亮，第 7 步在 hook 说完前亮
    for sid, ob in obs.items():
        st = SK[sid]["step"]
        t = t_step[st] + jit(sid, 7)
        col = LANE_COLOR[SK[sid]["lane"]]
        ob.scale = (0.001,) * 3
        ob.keyframe_insert("scale", frame=t - 1)
        ob.scale = (1.35,) * 3
        ob.keyframe_insert("scale", frame=t + 5)
        ob.scale = (1.0,) * 3
        ob.keyframe_insert("scale", frame=t + 14)
        key_color(ob, t - 1, "#ffffff", 0.0)
        key_color(ob, t + 4, "#ffffff", 1.15)
        key_color(ob, t + 16, col, 0.85)
        # title 拍说“技能树”时全树亮一下，从下往上
        pulse = BEAT["title"]["speech"][0]["start"] + round(POS[sid].z / TOP * 24)
        key_color(ob, pulse, col, 0.85)
        key_color(ob, pulse + 8, lighten(col, 0.45), 1.5)
        key_color(ob, pulse + 26, col, 0.9)
    for a, b, ob in curves:
        t0, t1 = t_step[SK[a]["step"]] + 6, t_step[SK[b]["step"]] + 2
        ob.data.bevel_factor_end = 0.0
        ob.data.keyframe_insert("bevel_factor_end", frame=t0)
        ob.data.bevel_factor_end = 1.0
        ob.data.keyframe_insert("bevel_factor_end", frame=t1)
        key_color(ob, t0, LANE_COLOR[SK[a]["lane"]], 0.0)
        key_color(ob, t0 + 4, LANE_COLOR[SK[a]["lane"]], 0.55)
    key_color(stars, 0, "#9fb6e0", 0.0)
    key_color(stars, 60, "#9fb6e0", 0.6)
    key_color(ground, 0, "#ffffff", 0.0)
    key_color(ground, 40, "#ffffff", 1.6)
    camera([orbit(0, 7.6, -35, 0.15), orbit(t_step[4], 11.5, 5, 2.6), orbit(hook_end, 17.0, 40, 6.0), orbit(end, 20.5, 62, 7.0)],
           # hook 一开口（第 3 步亮起前后）注视点就往左挪，树落在画面右边，左边留给提问的大字和标题
           [(0, (0, 0, 1.0)), (t_step[3], side(-15, 1.9, 1.2)), (t_step[4], side(5, 2.6, 2.6)), (hook_end, side(40, 4.0, 3.4)), (end, side(62, 4.3, 3.6))])
    return 0, end - 1


def shot_outro(obs, curves, stars, ground):
    b = BEAT["outro"]
    start, end = b["start"], tl["frames"]
    n = end - start
    lit0 = b["speech"][-1]["start"] - start          # “从第一步开始，点亮……”开口的时刻（相对本段）
    t_step = {st: lit0 - 2 + (st - 1) * 10 for st in range(1, 8)}   # 第 7 步约 2 s 后亮完，留出整树金色的停留
    key_color(stars, 0, "#9fb6e0", 0.6)
    key_color(ground, 0, "#ffffff", 1.6)
    for sid, ob in obs.items():
        col = LANE_COLOR[SK[sid]["lane"]]
        t = t_step[SK[sid]["step"]] + jit(sid, 5)
        key_color(ob, 0, col, 0.85)
        key_color(ob, t, col, 0.85)
        key_color(ob, t + 5, "#fff1cf", 2.4)
        key_color(ob, t + 18, GOLD, 1.25)
        ob.scale = (1.0,) * 3
        ob.keyframe_insert("scale", frame=t)
        ob.scale = (1.45,) * 3
        ob.keyframe_insert("scale", frame=t + 5)
        ob.scale = (1.12,) * 3
        ob.keyframe_insert("scale", frame=t + 18)
    for a, bb, ob in curves:
        col = LANE_COLOR[SK[a]["lane"]]
        t = t_step[SK[bb]["step"]] + 2
        key_color(ob, 0, col, 0.55)
        key_color(ob, t - 8, col, 0.55)
        key_color(ob, t + 6, GOLD, 0.95)
    camera([orbit(0, 21.5, 112, 6.8), orbit(n - 1, 21.0, 160, 6.2)], [(0, side(112, 4.2, 3.8)), (n - 1, side(160, 4.2, 3.8))])
    return 0, n - 1


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--shot", choices=["intro", "outro"], required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--samples", type=int, default=32)
    ap.add_argument("--pct", type=int, default=100)
    ap.add_argument("--frames", default="")
    ap.add_argument("--save", help="另存 .blend（看场景用）")
    a = ap.parse_args(argv)
    sc = setup(a.samples, a.pct)
    obs, curves, stars, ground = build_tree()
    f0, f1 = (shot_intro if a.shot == "intro" else shot_outro)(obs, curves, stars, ground)
    sc.frame_start, sc.frame_end = f0, f1
    out = Path(a.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    if a.save:
        bpy.ops.wm.save_as_mainfile(filepath=str(Path(a.save).resolve()))
    print(f"shot {a.shot}: 帧 {f0}-{f1}（{f1 - f0 + 1} 帧），{len(obs)} 个节点、{len(curves)} 条连线", flush=True)
    frames = [int(x) for x in a.frames.split(",") if x] or None
    if frames:
        for f in frames:
            sc.frame_set(f)
            sc.render.filepath = str(out / f"{f:04d}.png")
            bpy.ops.render.render(write_still=True)
    else:
        sc.render.filepath = str(out / "####")
        bpy.ops.render.render(animation=True)


main()
