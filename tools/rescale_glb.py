"""Re-scale GLB models so their longest axis matches the real-world target size.

Why: Scene Viewer on Android treats 1 GLB unit = 1 meter, so a motherboard
exported at 2 m looks like a billboard when placed in AR. We rewrite the
root-node scale of each GLB so the longest dimension equals TARGETS_M[name]
in meters. Files are overwritten in place — restore with git if needed.
"""
import sys
from pathlib import Path

from pygltflib import GLTF2

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "assets" / "models"

# Real-world longest-axis size in meters. Tweak per model if a value
# turns out too small/large on the phone.
TARGETS_M = {
    "cpu.glb": 0.05,           # 5 cm — реальный процессор
    "gpu.glb": 0.30,           # 30 cm — длина видеокарты
    "gpu_real.glb": 0.30,
    "motherboard.glb": 0.30,   # 30 cm — ATX-плата
    "ram.glb": 0.13,           # 13 cm — длина DIMM
    "ssd.glb": 0.08,           # 8 cm — M.2 2280
    "ssd_real.glb": 0.10,      # уже маленькая, оставляем как есть-ish
    "psu.glb": 0.15,           # 15 cm — ATX БП
    "psu_real.glb": 0.15,
    "cooler.glb": 0.10,        # 10 cm — кулер CPU
    "hdd.glb": 0.10,           # 10 cm — 2.5" / M.2
}


def world_bbox(gltf: GLTF2):
    """Bounding box over all meshes with node scales accumulated."""
    if not gltf.accessors:
        return None
    min_v = [float("inf")] * 3
    max_v = [float("-inf")] * 3

    def visit(node_idx, parent_scale):
        node = gltf.nodes[node_idx]
        s = node.scale or [1, 1, 1]
        cur = [parent_scale[i] * s[i] for i in range(3)]
        if node.mesh is not None:
            mesh = gltf.meshes[node.mesh]
            for prim in mesh.primitives:
                pos = prim.attributes.POSITION
                if pos is None:
                    continue
                acc = gltf.accessors[pos]
                if acc.min and acc.max:
                    for i in range(3):
                        min_v[i] = min(min_v[i], acc.min[i] * cur[i])
                        max_v[i] = max(max_v[i], acc.max[i] * cur[i])
        for c in node.children or []:
            visit(c, cur)

    scene_idx = gltf.scene if gltf.scene is not None else 0
    for root in gltf.scenes[scene_idx].nodes:
        visit(root, [1, 1, 1])

    if min_v[0] == float("inf"):
        return None
    return tuple(max_v[i] - min_v[i] for i in range(3))


def rescale(glb_path: Path, target_m: float) -> bool:
    g = GLTF2().load(str(glb_path))
    bbox = world_bbox(g)
    if not bbox:
        print(f"  {glb_path.name}: no geometry, skipped")
        return False
    longest = max(bbox)
    if longest == 0:
        print(f"  {glb_path.name}: zero size, skipped")
        return False

    factor = target_m / longest
    if abs(factor - 1.0) < 0.02:
        print(f"  {glb_path.name}: already ~= target ({longest:.3f} m), skipped")
        return False

    # Apply scale to every root node of the default scene.
    scene_idx = g.scene if g.scene is not None else 0
    for root_idx in g.scenes[scene_idx].nodes:
        node = g.nodes[root_idx]
        cur = node.scale or [1.0, 1.0, 1.0]
        node.scale = [cur[i] * factor for i in range(3)]
        # If there's a translation, it's also in meters — scale it too so
        # the model's pivot doesn't drift outside the AR placement reticle.
        if node.translation:
            node.translation = [node.translation[i] * factor for i in range(3)]

    g.save(str(glb_path))
    new_bbox = world_bbox(g)
    new_longest = max(new_bbox) if new_bbox else 0
    print(f"  {glb_path.name}: {longest:.3f} m -> {new_longest:.3f} m (x{factor:.4f})")
    return True


def main() -> int:
    print(f"Rescaling GLB files in {MODELS_DIR}")
    changed = 0
    for name, target in TARGETS_M.items():
        p = MODELS_DIR / name
        if not p.exists():
            print(f"  {name}: not found, skipped")
            continue
        if rescale(p, target):
            changed += 1
    print(f"Done. {changed} file(s) updated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
